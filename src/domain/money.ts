/** 金額（Money = 円単位の整数）のフォーマット・計算ヘルパー */
import type { Money } from "./types";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

/** "¥3,000" 形式 */
export function formatYen(amount: Money): string {
  return yenFormatter.format(Math.round(amount));
}

/** 合計（整数のまま加算） */
export function sumMoney(values: readonly Money[]): Money {
  return values.reduce((acc, v) => acc + v, 0);
}
