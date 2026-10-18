"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import type {
  Category,
  Transaction,
  TransactionWithCategory,
} from "@/lib/storage";
import { useFinan } from "@/components/finan-provider";
import { TransactionModal } from "./transaction-modal";

/** "yyyy-mm-dd" -> Date ao meio-dia local: evita deslocamento de timezone. */
function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseLocalDate(date));
}

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  search: string;
  onSearchChange: (value: string) => void;
  filter: "all" | "income" | "expense";
  onFilterChange: (value: "all" | "income" | "expense") => void;
}

export function TransactionList({
  transactions,
  categories,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: TransactionListProps) {
  const { deleteTransaction } = useFinan();
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(
    null
  );

  const filtered = transactions.filter((tx) => {
    const haystack = `${tx.description.toLowerCase()} ${(
      tx.category?.name ?? ""
    ).toLowerCase()}`;
    const matchSearch = haystack.includes(search.toLowerCase());
    const matchFilter = filter === "all" || tx.type === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    if (editingTx?.id === id) setEditingTx(null);
    deleteTransaction(id);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex rounded-lg border border-input overflow-hidden bg-background text-sm">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "Todos" : f === "income" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 bg-muted rounded-full mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Tente um termo diferente."
                : "Clique em \"Nova Transação\" para começar."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <div
                  className={`p-2 rounded-full shrink-0 ${
                    tx.type === "income"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowUpCircle className="h-4 w-4" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category?.name ?? "—"} · {formatDate(tx.date)}
                  </p>
                </div>

                <p
                  className={`font-semibold text-sm tabular-nums shrink-0 ${
                    tx.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingTx(tx)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit modal */}
      {editingTx && (
        <TransactionModal
          open={!!editingTx}
          onClose={() => setEditingTx(null)}
          categories={categories}
          mode="edit"
          initialData={{
            id: editingTx.id,
            description: editingTx.description,
            amount: editingTx.amount,
            type: editingTx.type,
            categoryId: editingTx.categoryId,
            date: editingTx.date,
            notes: editingTx.notes,
          }}
        />
      )}
    </>
  );
}
