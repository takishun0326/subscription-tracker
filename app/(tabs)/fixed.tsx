import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton, Card, EmptyState, Muted, SectionTitle } from "@/components/primitives";
import { currentYearMonth } from "@/domain/date";
import { fixedCosts as fcFn } from "@/domain/index";
import { formatYen, sumMoney } from "@/domain/money";
import type { FixedCost } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function FixedCostsScreen() {
  const { data } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = currentYearMonth();

  const monthlyNet = useMemo(
    () => sumMoney(data.fixedCosts.map((fc) => fcFn.amountInMonth(fc, now))),
    [data.fixedCosts, now],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Card style={styles.summary}>
        <Muted>今月の実負担合計（補助控除後）</Muted>
        <Text style={styles.summaryAmount}>{formatYen(monthlyNet)}</Text>
      </Card>

      <AppButton label="＋ 固定費を追加" onPress={() => router.push("/edit/fixed")} />

      {data.fixedCosts.length === 0 ? (
        <Card>
          <EmptyState
            title="まだ固定費がありません"
            hint="家賃などを登録できます。家賃補助があれば実負担額を自動計算します。"
          />
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          <SectionTitle>登録済み</SectionTitle>
          {data.fixedCosts.map((fc) => (
            <FixedCostCard
              key={fc.id}
              fc={fc}
              onPress={() => router.push({ pathname: "/edit/fixed", params: { id: fc.id } })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function FixedCostCard({ fc, onPress }: { fc: FixedCost; onPress: () => void }) {
  const net = fcFn.netAmount(fc);
  return (
    <Card onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{fc.name}</Text>
          <Muted>{fc.category}</Muted>
        </View>
        <View style={styles.cardAmount}>
          <Text style={styles.amount}>{formatYen(net)}</Text>
          {fc.subsidy > 0 ? (
            <Muted>
              {formatYen(fc.amount)} − 補助 {formatYen(fc.subsidy)}
            </Muted>
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
  summaryAmount: { color: colors.fixedCost, fontSize: 28, fontWeight: "800" },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardAmount: { alignItems: "flex-end", gap: 2 },
  amount: { color: colors.text, fontSize: 18, fontWeight: "700" },
});
