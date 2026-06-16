/** サブスクリプションの月別発生額・月換算（純粋関数） */
import { compareYearMonth, isoDateToYearMonth, monthOf } from "./date";
import type { Money, Subscription, YearMonth } from "./types";

/**
 * 指定月にそのサブスクで発生する金額。発生しなければ 0。
 * - monthly: 開始月以降、解約月の前まで毎月発生
 * - yearly: 開始月と同じ「月（1〜12）」のときだけ発生
 */
export function amountInMonth(sub: Subscription, ym: YearMonth): Money {
  const startMonth = isoDateToYearMonth(sub.startDate);
  if (compareYearMonth(ym, startMonth) < 0) return 0;
  if (sub.endDate) {
    const endMonth = isoDateToYearMonth(sub.endDate);
    if (compareYearMonth(ym, endMonth) >= 0) return 0;
  }
  if (sub.cycle === "monthly") return sub.amount;
  // yearly: 開始月と同じ月にのみ発生
  return monthOf(ym) === monthOf(startMonth) ? sub.amount : 0;
}

/** 月換算コスト（サマリー表示用）。yearly は 1/12。 */
export function monthlyEquivalent(sub: Subscription): Money {
  return sub.cycle === "yearly" ? Math.round(sub.amount / 12) : sub.amount;
}

/** そのサブスクが現在も有効か（asOf 月時点） */
export function isActive(sub: Subscription, asOf: YearMonth): boolean {
  const startMonth = isoDateToYearMonth(sub.startDate);
  if (compareYearMonth(asOf, startMonth) < 0) return false;
  if (sub.endDate) {
    const endMonth = isoDateToYearMonth(sub.endDate);
    if (compareYearMonth(asOf, endMonth) >= 0) return false;
  }
  return true;
}
