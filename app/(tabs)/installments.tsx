import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { AppButton, Card, EmptyState, Muted, SectionTitle } from "@/components/primitives";
import { formatYearMonthJa } from "@/domain/date";
import { installments as instFn } from "@/domain/index";
import { formatYen, sumMoney } from "@/domain/money";
import type { Installment } from "@/domain/types";
import { useData } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function InstallmentsScreen() {
  const { data } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const active = data.installments.filter((i) => !instFn.computeStatus(i).isCompleted);
  const completed = data.installments.filter((i) => instFn.computeStatus(i).isCompleted);

  const remainingTotal = useMemo(
    () => sumMoney(active.map((i) => instFn.computeStatus(i).remainingAmount)),
    [active],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Card style={styles.summary}>
        <Muted>支払い残額の合計（支払い中の分割）</Muted>
        <Text style={styles.summaryAmount}>{formatYen(remainingTotal)}</Text>
      </Card>

      <AppButton label="＋ 分割払いを追加" onPress={() => router.push("/edit/installment")} />

      {data.installments.length === 0 ? (
        <Card>
          <EmptyState
            title="まだ分割払いがありません"
            hint="スマホ端末代など、購入月（過去日付でも可）から登録できます。"
          />
        </Card>
      ) : (
        <>
          {active.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              <SectionTitle>支払い中</SectionTitle>
              {active.map((inst) => (
                <InstallmentCard
                  key={inst.id}
                  inst={inst}
                  onPress={() =>
                    router.push({ pathname: "/edit/installment", params: { id: inst.id } })
                  }
                />
              ))}
            </View>
          ) : null}

          {completed.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              <SectionTitle>完済</SectionTitle>
              {completed.map((inst) => (
                <InstallmentCard
                  key={inst.id}
                  inst={inst}
                  onPress={() =>
                    router.push({ pathname: "/edit/installment", params: { id: inst.id } })
                  }
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function InstallmentCard({ inst, onPress }: { inst: Installment; onPress: () => void }) {
  const status = instFn.computeStatus(inst);
  const ratio = status.totalCount > 0 ? status.paidCount / status.totalCount : 0;

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{inst.name}</Text>
          <Muted>{inst.category}</Muted>
        </View>
        <View style={styles.cardAmount}>
          <Text style={styles.amount}>{formatYen(status.remainingAmount)}</Text>
          <Muted>残額</Muted>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressCount}>
            {status.paidCount} / {status.totalCount}回 完了
          </Text>
          <Muted>
            {status.isCompleted
              ? "完済"
              : `次回 ${
                  status.nextOccurrence
                    ? `${formatYearMonthJa(status.nextOccurrence.yearMonth)} ${formatYen(status.nextOccurrence.amount)}`
                    : "-"
                }`}
          </Muted>
        </View>
        <ProgressBar ratio={ratio} />
        <View style={styles.progressFooter}>
          <Muted>総額 {formatYen(status.totalAmount)}</Muted>
          <Muted>完済予定 {formatYearMonthJa(status.finalYearMonth)}</Muted>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  summary: { gap: spacing.xs },
  summaryAmount: { color: colors.installment, fontSize: 28, fontWeight: "800" },
  cardHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardAmount: { alignItems: "flex-end" },
  amount: { color: colors.text, fontSize: 18, fontWeight: "700" },
  progressBlock: { gap: spacing.sm },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressCount: { color: colors.text, fontSize: 13, fontWeight: "600" },
  progressFooter: { flexDirection: "row", justifyContent: "space-between" },
});
