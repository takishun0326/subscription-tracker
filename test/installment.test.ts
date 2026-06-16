import assert from "node:assert/strict";
import { test } from "node:test";

import {
  amountForCount,
  amountInMonth,
  buildSchedule,
  computeStatus,
  totalAmount,
  validateTiers,
} from "../src/domain/installment";
import type { Installment } from "../src/domain/types";

/** スマホ24回払い: 1〜12回目 ¥5,000 / 13〜24回目 ¥3,000、2024-10 購入 */
const phone: Installment = {
  id: "phone",
  name: "iPhone 端末代",
  startDate: "2024-10-15",
  totalCount: 24,
  tiers: [
    { fromCount: 1, toCount: 12, amount: 5000 },
    { fromCount: 13, toCount: 24, amount: 3000 },
  ],
  category: "通信",
};

test("validateTiers: 連続して全回をカバーすれば通る", () => {
  assert.doesNotThrow(() => validateTiers(phone.tiers, 24));
});

test("validateTiers: 隙間があれば例外", () => {
  assert.throws(() =>
    validateTiers([{ fromCount: 1, toCount: 10, amount: 5000 }], 24),
  );
});

test("validateTiers: 最終回が総回数と不一致なら例外", () => {
  assert.throws(() =>
    validateTiers(
      [
        { fromCount: 1, toCount: 12, amount: 5000 },
        { fromCount: 13, toCount: 20, amount: 3000 },
      ],
      24,
    ),
  );
});

test("amountForCount: tier に応じた変動額", () => {
  assert.equal(amountForCount(phone, 1), 5000);
  assert.equal(amountForCount(phone, 12), 5000);
  assert.equal(amountForCount(phone, 13), 3000);
  assert.equal(amountForCount(phone, 24), 3000);
});

test("totalAmount: 12*5000 + 12*3000 = 96000", () => {
  assert.equal(totalAmount(phone), 96000);
});

test("buildSchedule: 過去日付から全24回を月展開", () => {
  const schedule = buildSchedule(phone);
  assert.equal(schedule.length, 24);
  assert.equal(schedule[0]!.yearMonth, "2024-10");
  assert.equal(schedule[0]!.amount, 5000);
  assert.equal(schedule[12]!.yearMonth, "2025-10"); // 13回目
  assert.equal(schedule[12]!.amount, 3000);
  assert.equal(schedule[23]!.yearMonth, "2026-09"); // 24回目（最終）
});

test("amountInMonth: 該当月のみ金額、範囲外は0", () => {
  assert.equal(amountInMonth(phone, "2024-09"), 0); // 開始前
  assert.equal(amountInMonth(phone, "2024-10"), 5000); // 1回目
  assert.equal(amountInMonth(phone, "2025-10"), 3000); // 13回目
  assert.equal(amountInMonth(phone, "2026-09"), 3000); // 最終
  assert.equal(amountInMonth(phone, "2026-10"), 0); // 完済後
});

test("computeStatus: 2025-04 時点での進捗", () => {
  // 2024-10 が1回目 → 2025-04 は7回目（当月、未済扱い）
  // 済み: 1〜6回目（すべて 5000）= 30000
  const status = computeStatus(phone, "2025-04");
  assert.equal(status.paidCount, 6);
  assert.equal(status.paidAmount, 30000);
  assert.equal(status.remainingCount, 18);
  assert.equal(status.remainingAmount, 66000);
  assert.equal(status.totalAmount, 96000);
  assert.equal(status.nextOccurrence?.count, 7);
  assert.equal(status.nextOccurrence?.amount, 5000);
  assert.equal(status.isCompleted, false);
  assert.equal(status.finalYearMonth, "2026-09");
});

test("computeStatus: 完済後は remaining=0, isCompleted", () => {
  const status = computeStatus(phone, "2027-01");
  assert.equal(status.paidCount, 24);
  assert.equal(status.remainingCount, 0);
  assert.equal(status.isCompleted, true);
  assert.equal(status.nextOccurrence, undefined);
});
