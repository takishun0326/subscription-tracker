/** カテゴリ別内訳のドーナツグラフ（react-native-svg で自前描画） */
import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { colors } from "@/lib/theme";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** 極座標 → 直交座標 */
function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** 円弧パスを生成 */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  slices,
  size = 160,
  strokeWidth = 26,
}: {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  if (total <= 0) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      </View>
    );
  }

  let cursor = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s) => {
            const angle = (s.value / total) * 360;
            const start = cursor;
            const end = cursor + angle;
            cursor = end;
            // 全周のときは Circle で描く（Path だと閉じない）
            if (angle >= 359.999) {
              return (
                <Circle
                  key={s.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              );
            }
            return (
              <Path
                key={s.label}
                d={arcPath(cx, cy, r, start, end)}
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
