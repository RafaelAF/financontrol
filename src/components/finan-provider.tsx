"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_CATEGORIES,
  type Category,
  type Transaction,
  type TransactionFormData,
  loadCategories,
  loadTransactions,
  saveCategories,
  saveTransactions,
  toLocalISO,
  uid,
} from "@/lib/storage";

export type ImportRow = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: Transaction["type"];
  categoryName: string;
  notes?: string;
};

export type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  createdCategories: number;
};

interface FinanContextValue {
  /** false até ler o localStorage (evita divergência render/hidratação). */
  hydrated: boolean;
  /** Data local "yyyy-mm-dd" definida na hidratação (fonte única de "relógio"). */
  today: string | null;
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (data: TransactionFormData) => void;
  updateTransaction: (id: string, data: TransactionFormData) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string) => Category | null;
  /** Mescla linhas/parseadas do XLSX: ID existente atualiza, duplicado exato ignora. */
  applyImport: (input: {
    rows: ImportRow[];
    categories: Array<{ id?: string; name: string }>;
  }) => ImportResult;
}

const FinanContext = createContext<FinanContextValue | null>(null);

export function useFinan(): FinanContextValue {
  const ctx = useContext(FinanContext);
  if (!ctx) {
    throw new Error("useFinan deve ser usado dentro de <FinanProvider>");
  }
  return ctx;
}

export function FinanProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Hidratação única: carrega do localStorage ou semeia categorias padrão.
  useEffect(() => {
    const loadedCats = loadCategories();
    setCategories(
      loadedCats.length > 0
        ? loadedCats
        : DEFAULT_CATEGORIES.map((name) => ({ id: uid(), name }))
    );
    setTransactions(loadTransactions());
    setToday(toLocalISO(new Date()));
    setHydrated(true);
  }, []);

  // Persistência reativa.
  useEffect(() => {
    if (hydrated) saveTransactions(transactions);
  }, [hydrated, transactions]);
  useEffect(() => {
    if (hydrated) saveCategories(categories);
  }, [hydrated, categories]);

  const addTransaction = useCallback((data: TransactionFormData) => {
    setTransactions((prev) => [
      { ...data, notes: data.notes || undefined, id: uid() },
      ...prev,
    ]);
  }, []);

  const updateTransaction = useCallback(
    (id: string, data: TransactionFormData) => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...data, notes: data.notes || undefined } : t
        )
      );
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback((name: string): Category | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    const existing = categories.find((c) => c.name.toLowerCase() === key);
    if (existing) return null;
    const created = { id: uid(), name: trimmed };
    setCategories((prev) => [...prev, created]);
    return created;
  }, [categories]);

  const applyImport = useCallback(
    ({
      rows,
      categories: incomingCats,
    }: {
      rows: ImportRow[];
      categories: Array<{ id?: string; name: string }>;
    }): ImportResult => {
      // Categorias: dedupe por nome (case-insensitive), preserva IDs existentes.
      const byName = new Map(
        categories.map((c) => [c.name.toLowerCase(), c] as const)
      );
      let createdCategories = 0;
      for (const incoming of incomingCats) {
        const name = incoming.name?.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (!byName.has(key)) {
          const created = { id: incoming.id || uid(), name };
          byName.set(key, created);
          createdCategories++;
        }
      }
      const finalCategories = Array.from(byName.values());

      // Transações: ID existente atualiza; idênticas (data+desc+valor+tipo) ignoram; demais inserem.
      const existingById = new Map(
        transactions.map((t) => [t.id, t] as const)
      );
      const next = [...transactions];
      const seenDraftKeys = new Set<string>();
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const row of rows) {
        const categoryId = byName.get(row.categoryName.toLowerCase())?.id;
        if (!categoryId) {
          skipped++;
          continue;
        }
        const draftKey = `${row.date}|${row.description.toLowerCase()}|${row.amount}|${row.type}`;
        if (row.id && existingById.has(row.id)) {
          const idx = next.findIndex((t) => t.id === row.id);
          next[idx] = { ...next[idx], ...row, categoryId };
          updated++;
          continue;
        }
        if (seenDraftKeys.has(draftKey)) {
          skipped++;
          continue;
        }
        seenDraftKeys.add(draftKey);
        next.unshift({
          id: row.id && !existingById.has(row.id) ? row.id : uid(),
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          notes: row.notes || undefined,
          categoryId,
        });
        added++;
        // preserva o ID do arquivo para idempotência entre importações
        existingById.set(next[0].id, next[0]);
      }

      setTransactions(next);
      setCategories(finalCategories);
      return { added, updated, skipped, createdCategories };
    },
    [categories, transactions]
  );

  const value = useMemo<FinanContextValue>(
    () => ({
      hydrated,
      today,
      transactions,
      categories,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      applyImport,
    }),
    [
      hydrated,
      today,
      transactions,
      categories,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      applyImport,
    ]
  );

  return <FinanContext.Provider value={value}>{children}</FinanContext.Provider>;
}
