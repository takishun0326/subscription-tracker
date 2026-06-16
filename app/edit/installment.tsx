import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DateField, FormField, Segmented, TextField } from "@/components/form";
import { AppButton, Muted } from "@/components/primitives";
import { todayISO } from "@/domain/date";
import { installments as instFn } from "@/domain/index";
import { formatYen } from "@/domain/money";
import type { Installment, InstallmentTier } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, radius, spacing } from "@/lib/theme";

type AmountMode = "fixed" | "variable";

/** 変動額入力用のセグメント（回数 × 金額）。tiers へ変換する。 */
interface Segment {
  count: string;
  amount: string;
}

/** 既存の tiers を編集用セグメントへ戻す */
function tiersToSegments(tiers: InstallmentTier[]): Segment[] {
  return tiers.map((t) => ({
    count: String(t.toCount - t.fromCount + 1),
    amount: String(t.amount),
  }));
}

export default function EditInstallmentScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, installments } = useData();
  const existing = data.installments.find((i) => i.id === id);

  const initialMode: AmountMode =
    existing && existing.tiers.length > 1 ? "variable" : "fixed";

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "分割払い");
  const [startDate, setStartDate] = useState(existing?.startDate ?? todayISO());
  const [mode, setMode] = useState<AmountMode>(initialMode);

  // 一定額モード
  const [fixedCount, setFixedCount] = useState(
    existing && initialMode === "fixed" ? String(existing.totalCount) : "",
  );
  const [fixedAmount, setFixedAmount] = useState(
    existing && initialMode === "fixed" ? String(existing.tiers[0]?.amount ?? "") : "",
  );

  // 変動額モード
  const [segments, setSegments] = useState<Segment[]>(
    existing && initialMode === "variable"
      ? tiersToSegments(existing.tiers)
      : [
          { count: "", amount: "" },
          { count: "", amount: "" },
        ],
  );
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  // プレビュー: 合計回数・総額
  const preview = useMemo(() => buildTiers(mode, fixedCount, fixedAmount, segments), [
    mode,
    fixedCount,
    fixedAmount,
    segments,
  ]);

  const updateSegment = (index: number, patch: Partial<Segment>) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addSegment = () => setSegments((prev) => [...prev, { count: "", amount: "" }]);
  const removeSegment = (index: number) =>
    setSegments((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setError(null);
    if (name.trim() === "") return setError("名前を入力してください");

    let tiers: InstallmentTier[];
    let totalCount: number;
    try {
      const built = buildTiers(mode, fixedCount, fixedAmount, segments);
      if (!built) throw new Error("回数・金額を正しく入力してください");
      tiers = built.tiers;
      totalCount = built.totalCount;
      instFn.validateTiers(tiers, totalCount);
    } catch (e) {
      return setError(e instanceof Error ? e.message : "入力が不正です");
    }

    const payload: Omit<Installment, "id"> = {
      name: name.trim(),
      category: category.trim() || "分割払い",
      startDate,
      totalCount,
      tiers,
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    };

    try {
      if (existing) {
        await installments.update({ ...payload, id: existing.id });
      } else {
        await installments.add(payload);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert("削除しますか？", `「${existing.name}」を削除します。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await installments.remove(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormField label="名前">
        <TextField value={name} onChangeText={setName} placeholder="iPhone 端末代 など" />
      </FormField>

      <FormField label="カテゴリ">
        <TextField value={category} onChangeText={setCategory} placeholder="通信 / 家電 など" />
      </FormField>

      <FormField label="購入日（初回支払い月・過去日付でも可）">
        <DateField value={startDate} onChange={setStartDate} />
        <Muted>※ 購入月から全回数を自動でスケジュール化します。</Muted>
      </FormField>

      <FormField label="支払い金額のタイプ">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { label: "一定額", value: "fixed" },
            { label: "変動額", value: "variable" },
          ]}
        />
      </FormField>

      {mode === "fixed" ? (
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField label="回数">
              <TextField
                value={fixedCount}
                onChangeText={setFixedCount}
                keyboardType="number-pad"
                placeholder="24"
              />
            </FormField>
          </View>
          <View style={styles.flex}>
            <FormField label="毎回の金額（円）">
              <TextField
                value={fixedAmount}
                onChangeText={setFixedAmount}
                keyboardType="number-pad"
                placeholder="4000"
              />
            </FormField>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Muted>
            「何回 × いくら」を上から順に入力します（例: 12回 ×5,000円 → 12回 ×3,000円）。
          </Muted>
          {segments.map((seg, i) => (
            <View key={i} style={styles.segmentRow}>
              <View style={styles.flex}>
                <TextField
                  value={seg.count}
                  onChangeText={(v) => updateSegment(i, { count: v })}
                  keyboardType="number-pad"
                  placeholder="回数"
                />
              </View>
              <Text style={styles.times}>×</Text>
              <View style={styles.flex}>
                <TextField
                  value={seg.amount}
                  onChangeText={(v) => updateSegment(i, { amount: v })}
                  keyboardType="number-pad"
                  placeholder="金額"
                />
              </View>
              {segments.length > 1 ? (
                <Pressable onPress={() => removeSegment(i)} hitSlop={8} style={styles.removeBtn}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <AppButton label="＋ 期間を追加" variant="ghost" onPress={addSegment} />
        </View>
      )}

      {preview ? (
        <View style={styles.preview}>
          <Muted>
            合計 {preview.totalCount}回 ・ 総額 {formatYen(preview.totalAmount)}
          </Muted>
        </View>
      ) : null}

      <FormField label="メモ（任意）">
        <TextField value={memo} onChangeText={setMemo} />
      </FormField>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <AppButton label={existing ? "保存" : "追加"} onPress={save} />
        {existing ? <AppButton label="削除" variant="danger" onPress={remove} /> : null}
      </View>
    </ScrollView>
  );
}

/** 入力値から tiers を組み立てる。不正・未完成なら null。 */
function buildTiers(
  mode: AmountMode,
  fixedCount: string,
  fixedAmount: string,
  segments: Segment[],
): { tiers: InstallmentTier[]; totalCount: number; totalAmount: number } | null {
  if (mode === "fixed") {
    const count = Number(fixedCount);
    const amount = Number(fixedAmount);
    if (!Number.isInteger(count) || count < 1) return null;
    if (!Number.isFinite(amount) || amount < 0) return null;
    return {
      tiers: [{ fromCount: 1, toCount: count, amount: Math.round(amount) }],
      totalCount: count,
      totalAmount: Math.round(amount) * count,
    };
  }

  const tiers: InstallmentTier[] = [];
  let cursor = 1;
  let totalAmount = 0;
  for (const seg of segments) {
    const count = Number(seg.count);
    const amount = Number(seg.amount);
    if (!Number.isInteger(count) || count < 1) return null;
    if (!Number.isFinite(amount) || amount < 0) return null;
    const rounded = Math.round(amount);
    tiers.push({ fromCount: cursor, toCount: cursor + count - 1, amount: rounded });
    totalAmount += rounded * count;
    cursor += count;
  }
  if (tiers.length === 0) return null;
  return { tiers, totalCount: cursor - 1, totalAmount };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  segmentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  times: { color: colors.textMuted, fontSize: 16 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: colors.danger, fontSize: 18, fontWeight: "700" },
  preview: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  error: { color: colors.danger, fontSize: 13 },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
