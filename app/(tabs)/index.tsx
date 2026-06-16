import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExpenseRow } from "@/components/ExpenseRow";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Card, EmptyState, Muted, SectionTitle } from "@/components/primitives";
import {
  monthlyBreakdown,
  remainingThisYear,
} from "@/domain/aggregation";
import { currentYearMonth, formatYearMonthJa } from "@/domain/date";
import { formatYen } from "@/domain/money";
import type { YearMonth } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, kindColor, kindLabel, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState<YearMonth>(currentYearMonth());

  const breakdown = useMemo(() => monthlyBreakdown(data, month), [data, month]);
  const remaining = useMemo(() => remainingThisYear(data), [data]);
  const year = Number(month.slice(0, 4));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <MonthSwitcher value={month} onChange={setMonth} />

      <Card style={styles.totalCard}>
        <Muted>{formatYearMonthJa(month)}の支出</Muted>
        <Text style={styles.total}>{formatYen(breakdown.total)}</Text>
        <View style={styles.kindRow}>
          <KindChip kind="subscription" amount={breakdown.byKind.subscription} />
          <KindChip kind="installment" amount={breakdown.byKind.installment} />
          <KindChip kind="fixedCost" amount={breakdown.byKind.fixedCost} />
        </View>
      </Card>

      <Card style={styles.remainingCard}>
        <Muted>{year}年に今後かかる合計（当月〜年末）</Muted>
        <Text style={styles.remaining}>{formatYen(remaining)}</Text>
      </Card>

      <View>
        <SectionTitle>内訳</SectionTitle>
        {breakdown.items.length === 0 ? (
          <Card>
            <EmptyState
              title="この月の支出はありません"
              hint="各タブからサブスク・分割払い・固定費を登録してみましょう。"
            />
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {breakdown.items.map((item, i) => (
              <View key={`${item.kind}-${item.sourceId}`}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <ExpenseRow item={item} />
              </View>
            ))}
          </Card>
        )}
      </View>

      <View style={{ height: insets.bottom + spacing.lg }} />
    </ScrollView>
  );
}

function KindChip({
  kind,
  amount,
}: {
  kind: "subscription" | "installment" | "fixedCost";
  amount: number;
}) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: kindColor(kind) }]} />
      <View>
        <Text style={styles.chipLabel}>{kindLabel(kind)}</Text>
        <Text style={styles.chipAmount}>{formatYen(amount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  totalCard: { gap: spacing.sm },
  total: { color: colors.text, fontSize: 36, fontWeight: "800" },
  kindRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { color: colors.textMuted, fontSize: 11 },
  chipAmount: { color: colors.text, fontSize: 14, fontWeight: "700" },
  remainingCard: { gap: spacing.xs },
  remaining: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  listCard: { paddingVertical: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
