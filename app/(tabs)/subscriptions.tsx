import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton, Card, EmptyState, Muted, SectionTitle } from "@/components/primitives";
import { currentYearMonth } from "@/domain/date";
import { formatYen, sumMoney } from "@/domain/money";
import { subscriptions as subFn } from "@/domain/index";
import type { Subscription } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function SubscriptionsScreen() {
  const { data } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = currentYearMonth();

  const monthlyTotal = useMemo(
    () =>
      sumMoney(
        data.subscriptions
          .filter((s) => subFn.isActive(s, now))
          .map((s) => subFn.monthlyEquivalent(s)),
      ),
    [data.subscriptions, now],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Card style={styles.summary}>
        <Muted>月額換算の合計（有効なサブスク）</Muted>
        <Text style={styles.summaryAmount}>{formatYen(monthlyTotal)}</Text>
      </Card>

      <AppButton label="＋ サブスクを追加" onPress={() => router.push("/edit/subscription")} />

      {data.subscriptions.length === 0 ? (
        <Card>
          <EmptyState title="まだサブスクがありません" hint="月額・年額のサービスを登録しましょう。" />
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          <SectionTitle>登録済み</SectionTitle>
          {data.subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onPress={() => router.push({ pathname: "/edit/subscription", params: { id: sub.id } })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SubscriptionCard({ sub, onPress }: { sub: Subscription; onPress: () => void }) {
  const active = subFn.isActive(sub, currentYearMonth());
  return (
    <Card onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={styles.cardMain}>
          <Text style={styles.name}>{sub.name}</Text>
          <Muted>
            {sub.category} ・ {sub.cycle === "monthly" ? "月額" : "年額"}
            {!active ? " ・ 停止中" : ""}
          </Muted>
        </View>
        <View style={styles.cardAmount}>
          <Text style={styles.amount}>{formatYen(sub.amount)}</Text>
          {sub.cycle === "yearly" ? (
            <Muted>月換算 {formatYen(subFn.monthlyEquivalent(sub))}</Muted>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  summary: { gap: spacing.xs },
  summaryAmount: { color: colors.text, fontSize: 28, fontWeight: "800" },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardMain: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardAmount: { alignItems: "flex-end", gap: 2 },
  amount: { color: colors.text, fontSize: 18, fontWeight: "700" },
});
