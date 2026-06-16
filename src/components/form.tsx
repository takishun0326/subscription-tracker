/** 入力フォーム用の部品 */
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import { formatYearMonthJa } from "@/domain/date";
import type { ISODate } from "@/domain/types";
import { colors, radius, spacing } from "@/lib/theme";

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? ""}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType ?? "default"}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 日付選択。ISODate 文字列で値を保持。過去日付も選べる。 */
export function DateField({
  value,
  onChange,
}: {
  value: ISODate;
  onChange: (v: ISODate) => void;
}) {
  const [show, setShow] = useState(Platform.OS === "ios");
  const date = parseISO(value);

  return (
    <View>
      {Platform.OS === "android" ? (
        <Pressable style={styles.input} onPress={() => setShow(true)}>
          <Text style={styles.dateText}>{formatYearMonthJa(value.slice(0, 7))}</Text>
        </Pressable>
      ) : null}
      {show ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant="dark"
          onChange={(_event, selected) => {
            if (Platform.OS === "android") setShow(false);
            if (selected) onChange(toISO(selected));
          }}
          style={Platform.OS === "ios" ? styles.iosPicker : undefined}
        />
      ) : null}
    </View>
  );
}

function parseISO(value: ISODate): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
}

function toISO(date: Date): ISODate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  dateText: { color: colors.text, fontSize: 16 },
  iosPicker: { alignSelf: "flex-start" },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
});
