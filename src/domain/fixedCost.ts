/** 固定費（家賃など、補助込み）の月別実負担額（純粋関数） */
import { compareYearMonth, isoDateToYearMonth } from "./date";
import type { FixedCost, Money, YearMonth } from "./types";

/** 実負担額 = 請求額 - 補助額（負にはしない） */
export function netAmount(fc: FixedCost): Money {
  return Math.max(0, fc.amount - fc.subsidy);
}

/** 指定月の実負担額。適用期間外は 0。 */
export function amountInMonth(fc: FixedCost, ym: YearMonth): Money {
  const fromMonth = isoDateToYearMonth(fc.effectiveFrom);
  if (compareYearMonth(ym, fromMonth) < 0) return 0;
  if (fc.effectiveTo) {
    const toMonth = isoDateToYearMonth(fc.effectiveTo);
    if (compareYearMonth(ym, toMonth) >= 0) return 0;
  }
  return netAmount(fc);
}
