/** アプリ共通のカラー・スペーシング。ダーク基調のシンプルな配色。 */
export const colors = {
  background: "#0f1115",
  surface: "#1a1d24",
  surfaceAlt: "#232733",
  border: "#2d323d",
  text: "#f2f4f8",
  textMuted: "#9aa3b2",
  primary: "#5b8cff",
  // 種別ごとの色（グラフ・バッジで共用）
  subscription: "#5b8cff",
  installment: "#ff9f5b",
  fixedCost: "#5bd6a8",
  danger: "#ff6b6b",
  // カテゴリ円グラフ用パレット
  palette: [
    "#5b8cff",
    "#ff9f5b",
    "#5bd6a8",
    "#c98bff",
    "#ffd15b",
    "#ff6b9d",
    "#5bd0ff",
    "#a3e635",
  ] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

/** 種別に対応する色 */
export function kindColor(kind: "subscription" | "installment" | "fixedCost"): string {
  return colors[kind];
}

/** 種別の日本語ラベル */
export function kindLabel(kind: "subscription" | "installment" | "fixedCost"): string {
  switch (kind) {
    case "subscription":
      return "サブスク";
    case "installment":
      return "分割払い";
    case "fixedCost":
      return "固定費";
  }
}
