/**
 * データコンテキスト。ログインユーザーの全データ（サブスク/分割/固定費）を
 * Firestore からリアルタイム購読し、CRUD を提供する。
 * 集計は domain/aggregation を使って各画面で行う。
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  ExpenseData,
  FixedCost,
  Installment,
  Subscription,
} from "@/domain/types";
import { useAuth } from "./AuthContext";
import {
  fixedCostsRepo,
  installmentsRepo,
  subscriptionsRepo,
  type WithoutId,
} from "./repositories";

interface DataContextValue {
  data: ExpenseData;
  loading: boolean;
  error: string | null;
  subscriptions: {
    add: (v: WithoutId<Subscription>) => Promise<string>;
    update: (v: Subscription) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  installments: {
    add: (v: WithoutId<Installment>) => Promise<string>;
    update: (v: Installment) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  fixedCosts: {
    add: (v: WithoutId<FixedCost>) => Promise<string>;
    update: (v: FixedCost) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const emptyData: ExpenseData = {
  subscriptions: [],
  installments: [],
  fixedCosts: [],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSubscriptions([]);
      setInstallments([]);
      setFixedCosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const onError = (e: Error) => setError(e.message);
    const unsubs = [
      subscriptionsRepo.subscribe(uid, setSubscriptions, onError),
      installmentsRepo.subscribe(uid, setInstallments, onError),
      fixedCostsRepo.subscribe(uid, setFixedCosts, onError),
    ];
    setLoading(false);
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const value = useMemo<DataContextValue>(() => {
    const requireUid = (): string => {
      if (!uid) throw new Error("ログインが必要です");
      return uid;
    };
    return {
      data: { subscriptions, installments, fixedCosts },
      loading,
      error,
      subscriptions: {
        add: (v) => subscriptionsRepo.add(requireUid(), v),
        update: (v) => subscriptionsRepo.set(requireUid(), v),
        remove: (id) => subscriptionsRepo.remove(requireUid(), id),
      },
      installments: {
        add: (v) => installmentsRepo.add(requireUid(), v),
        update: (v) => installmentsRepo.set(requireUid(), v),
        remove: (id) => installmentsRepo.remove(requireUid(), id),
      },
      fixedCosts: {
        add: (v) => fixedCostsRepo.add(requireUid(), v),
        update: (v) => fixedCostsRepo.set(requireUid(), v),
        remove: (id) => fixedCostsRepo.remove(requireUid(), id),
      },
    };
  }, [uid, subscriptions, installments, fixedCosts, loading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData は DataProvider の内側で使用してください");
  }
  return ctx;
}

export { emptyData };
