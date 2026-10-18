"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinan } from "@/components/finan-provider";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import { ExportImport } from "@/components/data/export-import";

const PAGE_SIZE = 20;

type PeriodKind =
  | "all"
  | "this_month"
  | "last_month"
  | "last30"
  | "this_year"
  | "last_year"
  | "custom";

const PERIOD_OPTIONS: Array<{ value: PeriodKind; label: string }> = [
  { value: "all", label: "Todo o período" },
  { value: "this_month", label: "Mês atual" },
  { value: "last_month", label: "Mês anterior" },
  { value: "last30", label: "Últimos 30 dias" },
  { value: "this_year", label: "Ano atual" },
  { value: "last_year", label: "Ano anterior" },
  { value: "custom", label: "Personalizado" },
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function periodBounds(
  today: string | null,
  kind: PeriodKind,
  customStart: string,
  customEnd: string
): { start: string; end: string } | null {
  if (!today) return null;
  const [y, m, d] = today.split("-").map(Number);
  const now = new Date(y, m - 1, d);
  switch (kind) {
    case "this_month":
      return {
        start: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "last_month":
      return {
        start: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "last30": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      return { start: isoDate(start), end: isoDate(now) };
    }
    case "this_year":
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      };
    case "last_year":
      return {
        start: `${now.getFullYear() - 1}-01-01`,
        end: `${now.getFullYear() - 1}-12-31`,
      };
    case "custom":
      if (!customStart || !customEnd) return null;
      return {
        start: customStart < customEnd ? customStart : customEnd,
        end: customStart < customEnd ? customEnd : customStart,
      };
    default:
      return null;
  }
}

export default function TransactionsPage() {
  const { hydrated, transactions, categories, today } = useFinan();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [periodKind, setPeriodKind] = useState<PeriodKind>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [page, setPage] = useState(1);

  const bounds = useMemo(
    () => periodBounds(today, periodKind, customStart, customEnd),
    [today, periodKind, customStart, customEnd]
  );

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const category = categories.find((c) => c.id === tx.categoryId);
        const haystack = `${tx.description.toLowerCase()} ${(
          category?.name ?? ""
        ).toLowerCase()}`;
        return haystack.includes(search.toLowerCase());
      })
      .filter((tx) =>
        bounds
          ? tx.date >= bounds.start && tx.date <= bounds.end
          : true
      )
      .filter((tx) => filter === "all" || tx.type === filter);
  }, [transactions, categories, search, bounds, filter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, periodKind, customStart, customEnd]);

  const periodLabel =
    bounds && periodKind !== "all"
      ? ` · ${bounds.start === bounds.end ? bounds.start : `${bounds.start} a ${bounds.end}`}`
      : "";

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            {periodKind === "all"
              ? `${total} transação(ões) encontrada(s)`
              : `${total} no período${periodLabel}`}
          </p>
        </div>
        <AddTransactionButton categories={categories} />
      </div>

      {/* Filtro por período */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={periodKind}
          onChange={(e) => setPeriodKind(e.target.value as PeriodKind)}
          aria-label="Filtrar por período"
          className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {periodKind === "custom" && (
          <div className="flex items-center gap-2 h-10">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Data inicial"
              className="px-2.5 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="Data final"
              className="px-2.5 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      <TransactionList
        transactions={slice}
        categories={categories}
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between pt-2 pb-4"
          aria-label="Paginação de transações"
        >
          {safePage > 1 ? (
            <button
              onClick={() => setPage(safePage - 1)}
              className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted transition-colors"
            >
              Anterior
            </button>
          ) : (
            <span className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium text-muted-foreground/50">
              Anterior
            </span>
          )}

          <span className="text-sm text-muted-foreground">
            Página {safePage} de {totalPages}
          </span>

          {safePage < totalPages ? (
            <button
              onClick={() => setPage(safePage + 1)}
              className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted transition-colors"
            >
              Próxima
            </button>
          ) : (
            <span className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium text-muted-foreground/50">
              Próxima
            </span>
          )}
        </nav>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground mb-2">
          {periodKind === "all"
            ? "A exportação inclui todas as transações."
            : "A exportação inclui apenas as transações do filtro atual (busca, tipo e período)."}
          {" "}A aba {"“Transações”"} usa as colunas{" Data, Descrição, Tipo, Valor, Categoria, Observações, ID"}; linhas existentes (mesmo ID) são atualizadas no import.
        </p>
        <ExportImport transactions={periodKind === "all" ? undefined : filtered} />
      </div>
    </div>
  );
}
