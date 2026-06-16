import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Muted, SectionTitle } from "@/components/primitives";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { DataProvider } from "@/lib/DataContext";
import { colors, spacing } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user, initializing, configured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing || !configured) return;
    const inAuthGroup = segments[0] === "login";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, initializing, configured, segments, router]);

  if (!configured) return <ConfigNotice />;
  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit/subscription"
        options={{ presentation: "modal", title: "サブスク" }}
      />
      <Stack.Screen
        name="edit/installment"
        options={{ presentation: "modal", title: "分割払い" }}
      />
      <Stack.Screen name="edit/fixed" options={{ presentation: "modal", title: "固定費" }} />
    </Stack>
  );
}

/** Firebase 未設定時のガイド画面 */
function ConfigNotice() {
  return (
    <View style={styles.centered}>
      <ScrollView contentContainerStyle={styles.noticeContent}>
        <SectionTitle>Firebase の設定が必要です</SectionTitle>
        <Muted>
          クラウド同期を使うには Firebase の設定が必要です。次の手順で設定してください。
        </Muted>
        <View style={styles.steps}>
          <Text style={styles.step}>1. Firebase コンソールでプロジェクトを作成</Text>
          <Text style={styles.step}>2. Authentication でメール/パスワードと匿名を有効化</Text>
          <Text style={styles.step}>3. Firestore データベースを作成</Text>
          <Text style={styles.step}>
            4. プロジェクト直下の .env.example を .env にコピーし、設定値を記入
          </Text>
          <Text style={styles.step}>5. アプリを再起動</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  noticeContent: { gap: spacing.md, maxWidth: 420 },
  steps: { gap: spacing.sm, marginTop: spacing.md },
  step: { color: colors.text, fontSize: 14, lineHeight: 22 },
});
