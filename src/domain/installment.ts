/**
 * 分割払いのスケジュール生成・進捗計算（純粋関数）。
 *
 * 設計のポイント:
 * - startDate は過去日付を許可する。買った月から全回数を自動展開するため、
 *   途中から手入力する必要がない。
 * - tiers により「何回目はいくら」という変動額に対応する（スマホ端末代など）。
 * - 「支払い済み」判定は基準月（asOf, 既定は現在月）より前の回を済みとみなす。
 *   asOf 当月の回は「当月の支払い予定（未済）」として残額側に含める。
 */
import {
  addMonths,
  compareYearMonth,
  currentYearMonth,
  isoDateToYearMonth,
  monthDiff,
} from "./date";
import type { Installment, InstallmentTier, Money, YearMonth } from "./types";

/** スケジュール上の1回分 */
export interface InstallmentOccurrence {
  /** 何回目か（1始まり） */
  count: number;
  /** 支払い月 */
  yearMonth: YearMonth;
  amount: Money;
}

/** 進捗サマリー */
export interface InstallmentStatus {
  totalCount: number;
  totalAmount: Money;
  /** 支払い済みの回数（asOf より前） */
  paidCount: number;
  paidAmount: Money;
  /** 残りの回数（asOf 当月を含む） */
  remainingCount: number;
  remainingAmount: Money;
  /** 次に支払う回（asOf 当月以降の先頭）。完済済みなら undefined */
  nextOccurrence?: InstallmentOccurrence;
  /** 最終支払い月 */
  finalYearMonth: YearMonth;
  /** 完済しているか */
  isCompleted: boolean;
}

/**
 * tiers の整合性を検証する。
 * fromCount=1 から始まり、隙間・重複なく totalCount までを連続でカバーすること。
 */
export function validateTiers(tiers: readonly InstallmentTier[], totalCount: number): void {
  if (totalCount < 1) {
    throw new Error(`総回数は1以上である必要があります: ${totalCount}`);
  }
  if (tiers.length === 0) {
    throw new Error("金額スケジュール（tiers）が空です");
  }
  const sorted = [...tiers].sort((a, b) => a.fromCount - b.fromCount);
  let expectedNext = 1;
  for (const tier of sorted) {
    if (tier.fromCount !== expectedNext) {
      throw new Error(
        `金額スケジュールに隙間または重複があります（${expectedNext}回目が未定義）`,
      );
    }
    if (tier.toCount < tier.fromCount) {
      throw new Error(
        `tier の範囲が不正です（fromCount=${tier.fromCount} > toCount=${tier.toCount}）`,
      );
    }
    if (tier.amount < 0) {
      throw new Error(`金額が負です: ${tier.amount}`);
    }
    expectedNext = tier.toCount + 1;
  }
  if (expectedNext - 1 !== totalCount) {
    throw new Error(
      `金額スケジュールの最終回（${expectedNext - 1}）が総回数（${totalCount}）と一致しません`,
    );
  }
}

/** n 回目（1始まり）の金額を tiers から求める */
export function amountForCount(inst: Installment, count: number): Money {
  if (count < 1 || count > inst.totalCount) {
    throw new Error(`回数が範囲外です（1〜${inst.totalCount}）: ${count}`);
  }
  const tier = inst.tiers.find((t) => count >= t.fromCount && count <= t.toCount);
  if (!tier) {
    throw new Error(`${count}回目に対応する金額スケジュールが見つかりません`);
  }
  return tier.amount;
}

/** 全回分のスケジュールを生成（過去〜未来すべて） */
export function buildSchedule(inst: Installment): InstallmentOccurrence[] {
  validateTiers(inst.tiers, inst.totalCount);
  const startMonth = isoDateToYearMonth(inst.startDate);
  return Array.from({ length: inst.totalCount }, (_, i) => {
    const count = i + 1;
    return {
      count,
      yearMonth: addMonths(startMonth, i),
      amount: amountForCount(inst, count),
    };
  });
}

/** 総支払額 */
export function totalAmount(inst: Installment): Money {
  return inst.tiers.reduce((acc, t) => acc + t.amount * (t.toCount - t.fromCount + 1), 0);
}

/**
 * 指定月に発生する分割払い額。発生しなければ 0。
 * 月別集計で利用する。
 */
export function amountInMonth(inst: Installment, ym: YearMonth): Money {
  const startMonth = isoDateToYearMonth(inst.startDate);
  // startMonth から ym までの月数差。0 か月後 = 1回目。
  const count = monthDiff(startMonth, ym) + 1;
  if (count < 1 || count > inst.totalCount) return 0;
  return amountForCount(inst, count);
}

/** 基準月（既定は現在月）における進捗を計算 */
export function computeStatus(
  inst: Installment,
  asOf: YearMonth = currentYearMonth(),
): InstallmentStatus {
  const schedule = buildSchedule(inst);
  const final = schedule[schedule.length - 1];
  if (!final) {
    throw new Error("スケジュールが空です（totalCount を確認してください）");
  }

  const paid = schedule.filter((o) => compareYearMonth(o.yearMonth, asOf) < 0);
  const remaining = schedule.filter((o) => compareYearMonth(o.yearMonth, asOf) >= 0);

  const paidAmount = paid.reduce((acc, o) => acc + o.amount, 0);
  const remainingAmount = remaining.reduce((acc, o) => acc + o.amount, 0);
  const next = remaining[0];

  return {
    totalCount: inst.totalCount,
    totalAmount: paidAmount + remainingAmount,
    paidCount: paid.length,
    paidAmount,
    remainingCount: remaining.length,
    remainingAmount,
    ...(next ? { nextOccurrence: next } : {}),
    finalYearMonth: final.yearMonth,
    isCompleted: remaining.length === 0,
  };
}
