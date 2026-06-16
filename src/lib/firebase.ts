/**
 * Firebase 初期化。設定値は .env（EXPO_PUBLIC_*）から読み込む。
 * 認証の永続化に AsyncStorage を使い、アプリ再起動後もログイン状態を保持する。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { initializeAuth, type Auth, type Persistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * getReactNativePersistence は Firebase の React Native エントリ（index.rn）
 * でのみ型公開されるため、既定の型定義には現れない。Metro はランタイムで
 * RN エントリへ解決するので、型付きの間接参照で取り出す。
 */
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readEnv(): FirebaseEnv {
  const env: FirebaseEnv = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  const missing = Object.entries(env)
    .filter(([, v]) => v === "")
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Firebase の環境変数が未設定です: ${missing.join(", ")}。.env.example を参考に .env を作成してください。`,
    );
  }
  return env;
}

/** Firebase 設定が揃っているか（UI で未設定ガイドを出すため） */
export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
}

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function ensureApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const existing = getApps()[0];
  appInstance = existing ?? initializeApp(readEnv());
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = initializeAuth(ensureApp(), {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  return authInstance;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(ensureApp());
  return dbInstance;
}
