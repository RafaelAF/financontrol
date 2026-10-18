"use client";

import { useFinan } from "@/components/finan-provider";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";

export default function DashboardPage() {
  const { hydrated, transactions, categories, today } = useFinan();

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-muted/60 animate-pulse"
            />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const sorted = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const totalIncome = sorted
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = sorted
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const recent = sorted.slice(0, 10).map((t) => ({
    ...t,
    category: categories.find((c) => c.id === t.categoryId),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {sorted.length} transação(ões) registrada(s)
          </p>
        </div>
        <AddTransactionButton categories={categories} />
      </div>

      <SummaryCards
        balance={balance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <BalanceChart transactions={sorted} today={today} />

      <RecentTransactions transactions={recent} />
    </div>
  );
}
