/** 前月・次月を切り替える月セレクタ。過去・未来どちらにも移動できる。 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { addMonths, currentYearMonth, formatYearMonthJa } from "@/domain/date";
import type { YearMonth } from "@/domain/types";
import { colors, radius, spacing } from "@/lib/theme";

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  const isCurrent = value === currentYearMonth();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(addMonths(value, -1))}
        style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange(currentYearMonth())}
        style={styles.center}
        hitSlop={8}
      >
        <Text style={styles.month}>{formatYearMonthJa(value)}</Text>
        {!isCurrent ? <Text style={styles.today}>今月に戻る</Text> : null}
      </Pressable>

      <Pressable
        onPress={() => onChange(addMonths(value, 1))}
        style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: colors.text, fontSize: 22, fontWeight: "700", lineHeight: 24 },
  pressed: { opacity: 0.6 },
  center: { alignItems: "center", gap: 2 },
  month: { color: colors.text, fontSize: 18, fontWeight: "700" },
  today: { color: colors.primary, fontSize: 11 },
});
