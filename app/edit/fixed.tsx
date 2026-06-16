import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { DateField, FormField, TextField } from "@/components/form";
import { AppButton, Muted } from "@/components/primitives";
import { todayISO } from "@/domain/date";
import { formatYen } from "@/domain/money";
import type { FixedCost } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function EditFixedCostScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, fixedCosts } = useData();
  const existing = data.fixedCosts.find((f) => f.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "固定費");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [subsidy, setSubsidy] = useState(existing ? String(existing.subsidy) : "0");
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom ?? todayISO());
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount) || 0;
  const subsidyNum = Number(subsidy) || 0;
  const net = Math.max(0, amountNum - subsidyNum);

  const save = async () => {
    setError(null);
    if (name.trim() === "") return setError("名前を入力してください");
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return setError("請求額を正しく入力してください");
    if (subsidyNum < 0) return setError("補助額は0以上にしてください");

    const payload: Omit<FixedCost, "id"> = {
      name: name.trim(),
      category: category.trim() || "固定費",
      amount: Math.round(amountNum),
      subsidy: Math.round(subsidyNum),
      effectiveFrom,
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    };

    try {
      if (existing) {
        await fixedCosts.update({ ...payload, id: existing.id });
      } else {
        await fixedCosts.add(payload);
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
          await fixedCosts.remove(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormField label="名前">
        <TextField value={name} onChangeText={setName} placeholder="家賃 など" />
      </FormField>

      <FormField label="カテゴリ">
        <TextField value={category} onChangeText={setCategory} placeholder="住居 など" />
      </FormField>

      <FormField label="請求額（円）">
        <TextField value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="80000" />
      </FormField>

      <FormField label="補助額（円・家賃補助など）">
        <TextField value={subsidy} onChangeText={setSubsidy} keyboardType="number-pad" placeholder="20000" />
      </FormField>

      <View style={styles.netBox}>
        <Muted>実負担額</Muted>
        <Text style={styles.net}>{formatYen(net)}</Text>
      </View>

      <FormField label="適用開始日">
        <DateField value={effectiveFrom} onChange={setEffectiveFrom} />
      </FormField>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  netBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  net: { color: colors.fixedCost, fontSize: 20, fontWeight: "800" },
  error: { color: colors.danger, fontSize: 13 },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
