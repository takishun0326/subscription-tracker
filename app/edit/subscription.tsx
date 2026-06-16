import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { DateField, FormField, Segmented, TextField } from "@/components/form";
import { AppButton } from "@/components/primitives";
import { todayISO } from "@/domain/date";
import type { BillingCycle, Subscription } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, subscriptions } = useData();
  const existing = data.subscriptions.find((s) => s.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [cycle, setCycle] = useState<BillingCycle>(existing?.cycle ?? "monthly");
  const [category, setCategory] = useState(existing?.category ?? "サブスク");
  const [startDate, setStartDate] = useState(existing?.startDate ?? todayISO());
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const amountNum = Number(amount);
    if (name.trim() === "") return setError("名前を入力してください");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError("金額を正しく入力してください");

    const payload: Omit<Subscription, "id"> = {
      name: name.trim(),
      amount: Math.round(amountNum),
      cycle,
      category: category.trim() || "サブスク",
      startDate,
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    };

    try {
      if (existing) {
        await subscriptions.update({ ...payload, id: existing.id });
      } else {
        await subscriptions.add(payload);
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
          await subscriptions.remove(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormField label="サービス名">
        <TextField value={name} onChangeText={setName} placeholder="Netflix など" />
      </FormField>

      <FormField label="金額（円）">
        <TextField value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="1490" />
      </FormField>

      <FormField label="課金サイクル">
        <Segmented
          value={cycle}
          onChange={setCycle}
          options={[
            { label: "月額", value: "monthly" },
            { label: "年額", value: "yearly" },
          ]}
        />
      </FormField>

      <FormField label="カテゴリ">
        <TextField value={category} onChangeText={setCategory} placeholder="動画 / 音楽 など" />
      </FormField>

      <FormField label="課金開始日">
        <DateField value={startDate} onChange={setStartDate} />
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
  error: { color: colors.danger, fontSize: 13 },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
