import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BarChart, type BarDatum } from "@/components/charts/BarChart";
import { DonutChart, type DonutSlice } from "@/components/charts/DonutChart";
import { AppButton, Card, EmptyState, Muted, SectionTitle } from "@/components/primitives";
import {
  categoryBreakdownForYear,
  yearlyByMonth,
  yearlyTotal,
} from "@/domain/aggregation";
import { currentYearMonth } from "@/domain/date";
import { formatYen } from "@/domain/money";
import { useAuth } from "@/lib/AuthContext";
import { useData } from "@/lib/DataContext";
import { colors, radius, spacing } from "@/lib/theme";

export default function AnalysisScreen() {
  const { data } = useData();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const thisYear = Number(currentYearMonth().slice(0, 4));
  const [year, setYear] = useState(thisYear);

  const monthly = useMemo(() => yearlyByMonth(data, year), [data, year]);
  const total = useMemo(() => yearlyTotal(data, year), [data, year]);
  const categories = useMemo(() => categoryBreakdownForYear(data, year), [data, year]);

  const currentMonthIdx = year === thisYear ? Number(currentYearMonth().slice(5, 7)) - 1 : -1;
  const bars: BarDatum[] = monthly.map((p, i) => ({
    label: String(i + 1),
    value: p.total,
    highlight: i === currentMonthIdx,
  }));

  const slices: DonutSlice[] = categories.map((c, i) => ({
    label: c.category,
    value: c.amount,
    color: colors.palette[i % colors.palette.length] as string,
  }));

  const hasData = total > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.yearRow}>
        <Pressable onPress={() => setYear(year - 1)} hitSlop={8} style={styles.yearArrow}>
          <Text style={styles.yearArrowText}>‹</Text>
        </Pressable>
        <Text style={styles.year}>{year}年</Text>
        <Pressable onPress={() => setYear(year + 1)} hitSlop={8} style={styles.yearArrow}>
          <Text style={styles.yearArrowText}>›</Text>
        </Pressable>
      </View>

      <Card style={styles.totalCard}>
        <Muted>{year}年の年間支出</Muted>
        <Text style={styles.total}>{formatYen(total)}</Text>
        <Muted>月平均 {formatYen(Math.round(total / 12))}</Muted>
      </Card>

      <Card>
        <SectionTitle>月別推移</SectionTitle>
        {hasData ? (
          <BarChart data={bars} />
        ) : (
          <EmptyState title="データがありません" hint="支出を登録するとグラフが表示されます。" />
        )}
      </Card>

      <Card>
        <SectionTitle>カテゴリ別内訳</SectionTitle>
        {hasData ? (
          <View style={styles.donutRow}>
            <DonutChart slices={slices} />
            <View style={styles.legend}>
              {categories.map((c, i) => (
                <View key={c.category} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.palette[i % colors.palette.length] },
                    ]}
                  />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {c.category}
                  </Text>
                  <Text style={styles.legendAmount}>{formatYen(c.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState title="データがありません" />
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle>アカウント</SectionTitle>
        <Muted>
          {user?.isAnonymous ? "ゲスト（この端末のみ）" : (user?.email ?? "ログイン中")}
        </Muted>
        <AppButton label="ログアウト" variant="ghost" onPress={() => void signOut()} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xl },
  yearArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  yearArrowText: { color: colors.text, fontSize: 20, fontWeight: "700" },
  year: { color: colors.text, fontSize: 18, fontWeight: "700" },
  totalCard: { gap: spacing.xs },
  total: { color: colors.text, fontSize: 32, fontWeight: "800" },
  donutRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.sm },
  legend: { flex: 1, gap: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.text, fontSize: 13, flex: 1 },
  legendAmount: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
});
