/**
 * ドメイン型定義。
 * 金額は「円単位の整数（Money）」で保持し、浮動小数の丸め誤差を避ける。
 */

/** 円単位の整数金額 */
export type Money = number;

/** "YYYY-MM" 形式の年月 */
export type YearMonth = string;

/** "YYYY-MM-DD" 形式の日付 */
export type ISODate = string;

/** 支出の種別 */
export type ExpenseKind = "subscription" | "installment" | "fixedCost";

/** 課金サイクル */
export type BillingCycle = "monthly" | "yearly";

/** サブスクリプション */
export interface Subscription {
  id: string;
  name: string;
  /** 1サイクルあたりの金額 */
  amount: Money;
  cycle: BillingCycle;
  /** 課金開始日（この月から cycle ごとに発生） */
  startDate: ISODate;
  /** 解約日。指定すると、この月以降は発生しない */
  endDate?: ISODate;
  category: string;
  memo?: string;
}

/**
 * 分割払いの金額階層（変動額対応）。
 * 「何回目から何回目まではいくら」を表す。tiers を連結して totalCount をカバーする。
 * 例: スマホ24回払い → [{from:1,to:12,amount:3000},{from:13,to:24,amount:2000}]
 */
export interface InstallmentTier {
  /** 開始回（1始まり、含む） */
  fromCount: number;
  /** 終了回（含む） */
  toCount: number;
  amount: Money;
}

/** 分割払い */
export interface Installment {
  id: string;
  name: string;
  /** 初回支払いの基準日。過去日付を指定すると過去分も自動でスケジュール化される */
  startDate: ISODate;
  /** 総回数 */
  totalCount: number;
  /** 金額スケジュール。fromCount=1 から始まり totalCount まで連続してカバーする */
  tiers: InstallmentTier[];
  category: string;
  memo?: string;
}

/** 固定費（家賃など）。補助込みで実負担額を扱う */
export interface FixedCost {
  id: string;
  name: string;
  /** 請求額 */
  amount: Money;
  /** 補助額（家賃補助など）。実負担 = amount - subsidy */
  subsidy: Money;
  /** 適用開始日 */
  effectiveFrom: ISODate;
  /** 適用終了日。指定するとこの月以降は発生しない */
  effectiveTo?: ISODate;
  category: string;
  memo?: string;
}

/** 全データのまとまり（集計関数の入力） */
export interface ExpenseData {
  subscriptions: Subscription[];
  installments: Installment[];
  fixedCosts: FixedCost[];
}

/** 月別内訳の1明細 */
export interface MonthlyLineItem {
  kind: ExpenseKind;
  sourceId: string;
  name: string;
  category: string;
  /** その月の実負担額 */
  amount: Money;
  /** 分割払いのみ: 「3/24回目」のような進捗情報 */
  occurrence?: { count: number; totalCount: number };
}
