/**
 * Firestore リポジトリ層。
 * データ構造: users/{uid}/subscriptions, .../installments, .../fixedCosts
 * 集計はクライアント側（domain/aggregation）で行うため、ここは生データの CRUD と購読のみ。
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
} from "firebase/firestore";

import type { FixedCost, Installment, Subscription } from "@/domain/types";
import { getDb } from "./firebase";

export type CollectionName = "subscriptions" | "installments" | "fixedCosts";

/** id を除いた登録用ペイロード */
export type WithoutId<T> = Omit<T, "id">;

function userCollection(uid: string, name: CollectionName) {
  return collection(getDb(), "users", uid, name);
}

/** undefined のフィールドを除去（Firestore は undefined を許容しない） */
function stripUndefined(data: DocumentData): DocumentData {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

/** コレクションをリアルタイム購読。返り値は解除関数。 */
export function subscribeCollection<T extends { id: string }>(
  uid: string,
  name: CollectionName,
  onChange: (items: T[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    userCollection(uid, name),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onChange(items);
    },
    (error) => onError(error),
  );
}

/** 追加（id は Firestore が採番） */
export async function addItem<T extends { id: string }>(
  uid: string,
  name: CollectionName,
  payload: WithoutId<T>,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, name), stripUndefined(payload as DocumentData));
  return ref.id;
}

/** 更新（merge ではなく全置換で id 以外を保存） */
export async function setItem<T extends { id: string }>(
  uid: string,
  name: CollectionName,
  item: T,
): Promise<void> {
  const { id, ...rest } = item;
  await setDoc(doc(getDb(), "users", uid, name, id), stripUndefined(rest as DocumentData));
}

/** 削除 */
export async function deleteItem(
  uid: string,
  name: CollectionName,
  id: string,
): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, name, id));
}

// 型を明示した薄いラッパ（呼び出し側の型推論を助ける）
export const subscriptionsRepo = {
  subscribe: (uid: string, cb: (v: Subscription[]) => void, err: (e: Error) => void) =>
    subscribeCollection<Subscription>(uid, "subscriptions", cb, err),
  add: (uid: string, v: WithoutId<Subscription>) => addItem<Subscription>(uid, "subscriptions", v),
  set: (uid: string, v: Subscription) => setItem<Subscription>(uid, "subscriptions", v),
  remove: (uid: string, id: string) => deleteItem(uid, "subscriptions", id),
};

export const installmentsRepo = {
  subscribe: (uid: string, cb: (v: Installment[]) => void, err: (e: Error) => void) =>
    subscribeCollection<Installment>(uid, "installments", cb, err),
  add: (uid: string, v: WithoutId<Installment>) => addItem<Installment>(uid, "installments", v),
  set: (uid: string, v: Installment) => setItem<Installment>(uid, "installments", v),
  remove: (uid: string, id: string) => deleteItem(uid, "installments", id),
};

export const fixedCostsRepo = {
  subscribe: (uid: string, cb: (v: FixedCost[]) => void, err: (e: Error) => void) =>
    subscribeCollection<FixedCost>(uid, "fixedCosts", cb, err),
  add: (uid: string, v: WithoutId<FixedCost>) => addItem<FixedCost>(uid, "fixedCosts", v),
  set: (uid: string, v: FixedCost) => setItem<FixedCost>(uid, "fixedCosts", v),
  remove: (uid: string, id: string) => deleteItem(uid, "fixedCosts", id),
};
