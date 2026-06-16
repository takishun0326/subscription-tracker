/**
 * 月別・年別の集計（純粋関数）。グラフ・分析・ホーム画面の基盤。
 * Firestore には生データ（Subscription/Installment/FixedCost）のみ保存し、
 * 集計はすべてここでクライアント側計算する。
 */
import { compareYearMonth, currentYearMonth, monthsOfYear } from "./date";
import * as fixedCostFn from "./fixedCost";
import * as installmentFn from "./installment";
import { sumMoney } from "./money";
import * as subscriptionFn from "./subscription";
import type { ExpenseData, Money, MonthlyLineItem, YearMonth } from "./types";

/** ある月の内訳（明細＋合計） */
export interface MonthlyBreakdown {
  yearMonth: YearMonth;
  items: MonthlyLineItem[];
  total: Money;
  byKind: {
    subscription: Money;
    installment: Money;
    fixedCost: Money;
  };
}

/** 指定月の全明細を生成（金額が発生するものだけ） */
export function monthlyBreakdown(data: ExpenseData, ym: YearMonth): MonthlyBreakdown {
  const items: MonthlyLineItem[] = [];

  for (const sub of data.subscriptions) {
    const amount = subscriptionFn.amountInMonth(sub, ym);
    if (amount > 0) {
      items.push({
        kind: "subscription",
        sourceId: sub.id,
        name: sub.name,
        category: sub.category,
        amount,
      });
    }
  }

  for (const inst of data.installments) {
    const amount = installmentFn.amountInMonth(inst, ym);
    if (amount > 0) {
      const status = installmentFn.computeStatus(inst, ym);
      const count = status.nextOccurrence?.count ?? inst.totalCount;
      items.push({
        kind: "installment",
        sourceId: inst.id,
        name: inst.name,
        category: inst.category,
        amount,
        occurrence: { count, totalCount: inst.totalCount },
      });
    }
  }

  for (const fc of data.fixedCosts) {
    const amount = fixedCostFn.amountInMonth(fc, ym);
    if (amount > 0) {
      items.push({
        kind: "fixedCost",
        sourceId: fc.id,
        name: fc.name,
        category: fc.category,
        amount,
      });
    }
  }

  const byKind = {
    subscription: sumMoney(items.filter((i) => i.kind === "subscription").map((i) => i.amount)),
    installment: sumMoney(items.filter((i) => i.kind === "installment").map((i) => i.amount)),
    fixedCost: sumMoney(items.filter((i) => i.kind === "fixedCost").map((i) => i.amount)),
  };

  return {
    yearMonth: ym,
    items: items.sort((a, b) => b.amount - a.amount),
    total: sumMoney(items.map((i) => i.amount)),
    byKind,
  };
}

/** 指定月の合計のみ（軽量） */
export function monthlyTotal(data: ExpenseData, ym: YearMonth): Money {
  return monthlyBreakdown(data, ym).total;
}

/** 棒グラフ用: 指定年の月別合計（1〜12月） */
export interface MonthlyPoint {
  yearMonth: YearMonth;
  total: Money;
}

export function yearlyByMonth(data: ExpenseData, year: number): MonthlyPoint[] {
  return monthsOfYear(year).map((ym) => ({ yearMonth: ym, total: monthlyTotal(data, ym) }));
}

/** 指定年の年間合計 */
export function yearlyTotal(data: ExpenseData, year: number): Money {
  return sumMoney(yearlyByMonth(data, year).map((p) => p.total));
}

/**
 * 今年の「これから」かかる合計（asOf 当月を含む、年末まで）。
 * 「今年あと◯円」の表示に使う。
 */
export function remainingThisYear(
  data: ExpenseData,
  asOf: YearMonth = currentYearMonth(),
): Money {
  const year = Number(asOf.slice(0, 4));
  return sumMoney(
    monthsOfYear(year)
      .filter((ym) => compareYearMonth(ym, asOf) >= 0)
      .map((ym) => monthlyTotal(data, ym)),
  );
}

/** 円グラフ用: カテゴリ別の金額内訳 */
export interface CategorySlice {
  category: string;
  amount: Money;
}

/** 指定月のカテゴリ別内訳（降順） */
export function categoryBreakdown(data: ExpenseData, ym: YearMonth): CategorySlice[] {
  const map = new Map<string, Money>();
  for (const item of monthlyBreakdown(data, ym).items) {
    map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** 指定年のカテゴリ別内訳（年間合計、降順） */
export function categoryBreakdownForYear(data: ExpenseData, year: number): CategorySlice[] {
  const map = new Map<string, Money>();
  for (const ym of monthsOfYear(year)) {
    for (const item of monthlyBreakdown(data, ym).items) {
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    }
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
