/** 月別内訳の1行（種別バッジ・名前・分割進捗・金額） */
import { StyleSheet, Text, View } from "react-native";

import { formatYen } from "@/domain/money";
import type { MonthlyLineItem } from "@/domain/types";
import { colors, kindColor, kindLabel, radius, spacing } from "@/lib/theme";

export function ExpenseRow({ item }: { item: MonthlyLineItem }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: kindColor(item.kind) }]} />
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { borderColor: kindColor(item.kind) }]}>
            <Text style={[styles.badgeText, { color: kindColor(item.kind) }]}>
              {kindLabel(item.kind)}
            </Text>
          </View>
          {item.occurrence ? (
            <Text style={styles.occurrence}>
              {item.occurrence.count}/{item.occurrence.totalCount}回目
            </Text>
          ) : (
            <Text style={styles.occurrence}>{item.category}</Text>
          )}
        </View>
      </View>
      <Text style={styles.amount}>{formatYen(item.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  main: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 15, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  badge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  occurrence: { color: colors.textMuted, fontSize: 12 },
  amount: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
