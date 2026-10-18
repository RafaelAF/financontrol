import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type {
  Category,
  Transaction,
  TransactionWithCategory,
} from "@/lib/storage";

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
    month: "short",
  }).format(parseLocalDate(date));
}

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-base">Transações Recentes</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="p-4 bg-muted rounded-full mb-3">
            <ArrowUpCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Nenhuma transação ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vá para Transações para adicionar sua primeira entrada ou saída.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
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
                <p className="font-medium text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.category?.name ?? "—"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`font-semibold text-sm tabular-nums ${
                    tx.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.date)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
