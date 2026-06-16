/** 分割払いの進捗バー */
import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/lib/theme";

export function ProgressBar({
  ratio,
  color = colors.installment,
  height = 8,
}: {
  /** 0〜1 の進捗率 */
  ratio: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
});
