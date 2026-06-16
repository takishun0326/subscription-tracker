/**
 * 年月（YearMonth）を中心とした日付ユーティリティ。
 * 内部では「月インデックス = year * 12 + (month - 1)」に変換して計算するため、
 * 月の加算・差分・比較が安全に行える。すべて純粋関数。
 */
import type { ISODate, YearMonth } from "./types";

const YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YearMonth を {year, month} に分解。不正な値は例外。 */
export function parseYearMonth(ym: YearMonth): { year: number; month: number } {
  const m = YEAR_MONTH_RE.exec(ym);
  if (!m) {
    throw new Error(`不正な年月形式です（YYYY-MM を期待）: ${ym}`);
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) {
    throw new Error(`月が範囲外です（1〜12）: ${ym}`);
  }
  return { year, month };
}

/** 月インデックスへ変換 */
export function monthIndex(ym: YearMonth): number {
  const { year, month } = parseYearMonth(ym);
  return year * 12 + (month - 1);
}

/** 月インデックスから YearMonth へ復元 */
export function fromMonthIndex(index: number): YearMonth {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** ISODate（YYYY-MM-DD）から YearMonth を取り出す */
export function isoDateToYearMonth(date: ISODate): YearMonth {
  const m = ISO_DATE_RE.exec(date);
  if (!m) {
    throw new Error(`不正な日付形式です（YYYY-MM-DD を期待）: ${date}`);
  }
  return `${m[1]}-${m[2]}`;
}

/** 月を n か月加算（n は負も可） */
export function addMonths(ym: YearMonth, n: number): YearMonth {
  return fromMonthIndex(monthIndex(ym) + n);
}

/** from から to までの月数差（to - from）。同月なら 0、未来なら正。 */
export function monthDiff(from: YearMonth, to: YearMonth): number {
  return monthIndex(to) - monthIndex(from);
}

/** YearMonth の比較（a<b: 負, a==b: 0, a>b: 正） */
export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return monthIndex(a) - monthIndex(b);
}

/** 指定年のすべての月（1月〜12月） */
export function monthsOfYear(year: number): YearMonth[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

/** 現在の年月（端末ローカル時刻） */
export function currentYearMonth(now: Date = new Date()): YearMonth {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 今日の ISODate（端末ローカル時刻） */
export function todayISO(now: Date = new Date()): ISODate {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function yearOf(ym: YearMonth): number {
  return parseYearMonth(ym).year;
}

export function monthOf(ym: YearMonth): number {
  return parseYearMonth(ym).month;
}

/** 日本語表記 "2024年10月" */
export function formatYearMonthJa(ym: YearMonth): string {
  const { year, month } = parseYearMonth(ym);
  return `${year}年${month}月`;
}
