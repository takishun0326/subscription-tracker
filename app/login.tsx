import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton, Muted } from "@/components/primitives";
import { useAuth } from "@/lib/AuthContext";
import { colors, radius, spacing } from "@/lib/theme";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const { signInEmail, signUpEmail, signInGuest } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInEmail(email.trim(), password);
      } else {
        await signUpEmail(email.trim(), password);
      }
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGuest();
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>サブスク管理</Text>
            <Muted>サブスク・分割払い・固定費をまとめて把握</Muted>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード（6文字以上）"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              label={mode === "signin" ? "ログイン" : "新規登録"}
              onPress={submit}
              disabled={busy || email.length === 0 || password.length < 6}
            />
            <AppButton
              label={mode === "signin" ? "新規登録に切り替え" : "ログインに切り替え"}
              variant="ghost"
              onPress={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
            />
          </View>

          <View style={styles.guest}>
            <Muted style={{ textAlign: "center" }}>または</Muted>
            <AppButton label="ゲストとして始める" variant="ghost" onPress={guest} disabled={busy} />
            <Muted style={{ textAlign: "center" }}>
              ※ゲストはこの端末のみ。後でアカウント登録すると同期できます。
            </Muted>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function toMessage(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.includes("invalid-credential")) return "メールまたはパスワードが違います";
    if (e.message.includes("email-already-in-use")) return "このメールは登録済みです";
    if (e.message.includes("weak-password")) return "パスワードは6文字以上にしてください";
    if (e.message.includes("invalid-email")) return "メールアドレスの形式が不正です";
    return e.message;
  }
  return "不明なエラーが発生しました";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: "center", gap: spacing.sm },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  form: { gap: spacing.md },
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
  error: { color: colors.danger, fontSize: 13 },
  guest: { gap: spacing.sm },
});
