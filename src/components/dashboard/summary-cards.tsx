import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface SummaryCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

export function SummaryCards({
  balance,
  totalIncome,
  totalExpense,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Saldo Atual",
      value: balance,
      icon: Wallet,
      color: "text-foreground",
      bg: "bg-card",
      iconBg: "bg-muted text-muted-foreground",
    },
    {
      label: "Total Entradas",
      value: totalIncome,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-card",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Saídas",
      value: totalExpense,
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-card",
      iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, color, bg, iconBg }) => (
        <div
          key={label}
          className={`${bg} rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm`}
        >
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>
              {formatCurrency(value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
