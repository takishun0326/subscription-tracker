# Subsc Tracker

サブスク・分割払い・固定費をまとめて把握する家計管理アプリ。
「スマホの24回払い、今どこまで払った？あと何回？」を一目で確認できることを目的にしています。

iPhone（Expo Go / TestFlight）で動作する React Native + Expo アプリです。

## 主な機能

- **サブスク管理** — 月額/年額・課金開始日・カテゴリを登録。月額換算の合計を表示
- **分割払い管理**
  - 購入日に**過去日付**を指定でき、その月から全回数を自動でスケジュール化（途中から手入力する必要なし）
  - **変動額に対応**（例: スマホ端末代「12回 ×5,000円 → 12回 ×3,000円」）
  - 進捗バーで「6/24回 完了・残額・完済予定月」を表示
- **固定費管理** — 家賃などを登録。家賃補助を入力すると `実負担額 = 請求額 − 補助額` を自動計算
- **月別ビュー** — 任意の月（過去・未来）を選んで内訳を確認
- **分析** — 月別推移（棒グラフ）／カテゴリ別内訳（ドーナツ）／年間合計／「今年あと◯円」
- **クラウド同期** — Firebase Authentication（メール・パスワード / ゲスト）でログインし、Firestore に保存。複数端末で同期

## 技術スタック

- React Native 0.76 / Expo SDK 52（expo-router）
- Firebase Authentication + Cloud Firestore
- グラフは `react-native-svg` による自前描画（ネイティブ追加依存なし）

## アーキテクチャ

- **ドメイン層を純粋関数として分離**（[`src/domain/`](src/domain/)）
  Firestore には生データ（サブスク/分割/固定費）のみ保存し、月別・年別の集計はすべてクライアント側で計算します。スケジュール生成・進捗計算・集計はユニットテストで検証済み。
- 金額は円単位の整数で保持し、丸め誤差を回避しています。

```
src/
  domain/          ドメインロジック（純粋関数・テスト対象）
    types.ts         型定義
    date.ts          年月ユーティリティ
    installment.ts   分割スケジュール生成・進捗計算
    subscription.ts  サブスクの月別発生額
    fixedCost.ts     固定費の実負担額
    aggregation.ts   月別・年別・カテゴリ別の集計
  lib/             Firebase 連携・認証/データの Context
  components/      UI 部品（カード・進捗バー・グラフ・フォーム）
app/               画面（expo-router）
  (tabs)/          ホーム・サブスク・分割・固定費・分析
  edit/            追加・編集フォーム
  login.tsx        ログイン
test/              ドメイン層のユニットテスト
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase の準備

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** を有効化し、「メール / パスワード」と「匿名」を ON
3. **Cloud Firestore** を作成
4. プロジェクト設定からウェブアプリの構成値を取得

### 3. 環境変数

`.env.example` を `.env` にコピーし、構成値を記入します（`.env` は Git 管理外）。

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> 未設定でもアプリは起動し、設定を促すガイド画面が表示されます。

### 4. Firestore セキュリティルール（推奨）

各ユーザーが自分のデータのみ読み書きできるようにします。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 実行

```bash
npm start        # Metro を起動。表示された QR コードを iPhone の Expo Go で読み取る
npm run ios      # iOS シミュレータで起動
```

## 開発

```bash
npm run typecheck   # 型チェック（tsc --noEmit）
npm test            # ドメイン層のユニットテスト（node:test）
```

## ロードマップ（スコープ外 / 今後）

- 引き落とし前のプッシュ通知
- クレジットカード利用履歴の取り込みによる支出の自動入力
- 支出全体の分析・予算管理
