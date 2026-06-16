/** 月別推移の棒グラフ（react-native-svg で自前描画、ネイティブ追加依存なし） */
import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { colors } from "@/lib/theme";

export interface BarDatum {
  label: string;
  value: number;
  /** 強調表示（当月など） */
  highlight?: boolean;
}

export function BarChart({
  data,
  height = 180,
  barColor = colors.primary,
}: {
  data: BarDatum[];
  height?: number;
  barColor?: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const labelHeight = 18;
  const chartHeight = height - labelHeight;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = data.length > 0 ? width / data.length : 0;
  const barWidth = slot * 0.55;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const barH = max > 0 ? (d.value / max) * (chartHeight - 8) : 0;
            const x = i * slot + (slot - barWidth) / 2;
            const y = chartHeight - barH;
            return (
              <Rect
                key={d.label}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, barH)}
                rx={3}
                fill={d.highlight ? colors.installment : barColor}
                opacity={d.value === 0 ? 0.25 : 1}
              />
            );
          })}
          {data.map((d, i) => (
            <SvgText
              key={`label-${d.label}`}
              x={i * slot + slot / 2}
              y={height - 5}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
