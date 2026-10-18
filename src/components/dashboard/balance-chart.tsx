"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProgressPoint = {
  label: string;
  title: string;
  income: number;
  expense: number;
  saldo: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const fullMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function BalanceChart({
  transactions,
  today,
}: {
  transactions: Array<{
    date: string;
    amount: number;
    type: "income" | "expense";
  }>;
  /** "yyyy-mm-dd" da hidratação (fonte única de relógio). */
  today: string | null;
}) {
  const [view, setView] = useState<string>("rolling");

  // Anos presentes nos dados (para o filtro por ano).
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const t of transactions) {
      const y = Number(t.date.slice(0, 4));
      if (Number.isFinite(y)) set.add(y);
    }
    if (today) set.add(Number(today.slice(0, 4)));
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, today]);

  // 12 janelas mensais: no modo móvel a corrente é a 9ª coluna (8 anteriores + 3 posteriores).
  const { data, title } = useMemo(() => {
    if (!today) return { data: [], title: "" };
    const ordered = [...transactions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const now = new Date(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)) - 1,
      Number(today.slice(8, 10))
    );
    const nowYear = now.getFullYear();

    let columns: Array<{ key: string; year: number; label: string; title: string }>;

    if (view === "rolling") {
      columns = [];
      for (let i = -8; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const y = d.getFullYear();
        const key = `${y}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const base = shortMonth.format(d).replace(".", "");
        columns.push({
          key,
          year: y,
          label: y === nowYear ? base : `${base}/${String(y).slice(2)}`,
          title: fullMonth.format(d),
        });
      }
      return { data: build(ordered, columns, nowYear), title: "Últimos 12 meses" };
    }

    const year = Number(view);
    columns = Array.from({ length: 12 }, (_, m) => {
      const d = new Date(year, m, 1);
      return {
        key: `${year}-${String(m + 1).padStart(2, "0")}`,
        year,
        label: shortMonth.format(d).replace(".", ""),
        title: fullMonth.format(d),
      };
    });
    return { data: build(ordered, columns, nowYear), title: String(year) };
    // build declarado abaixo (hoist): função pura local.
  }, [transactions, view, today]);

  const hasData = data.some(
    (p) => p.income !== 0 || p.expense !== 0 || p.saldo !== 0
  );

  const currentLabel = useMemo(() => {
    if (!today) return null;
    const now = new Date(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)) - 1,
      1
    );
    if (view === "rolling") {
      return shortMonth.format(now).replace(".", "");
    }
    return view === today.slice(0, 4)
      ? shortMonth.format(now).replace(".", "")
      : null;
  }, [view, today]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-base">Progressão — {title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            aria-label="Filtrar por ano"
            className="h-8 px-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="rolling">12 meses (móvel)</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                Ano {y}
              </option>
            ))}
          </select>
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
              Despesas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Saldo acumulado
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {!hasData ? (
          <div className="h-56 flex flex-col items-center justify-center text-center">
            <p className="font-medium text-sm">Sem transações no período</p>
            <p className="text-sm text-muted-foreground mt-1">
              Registre entradas ou saídas para acompanhar a progressão.
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 4, bottom: 0, left: -14 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(v)
                  }
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.25 }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                  labelFormatter={(_label, payload) => {
                    const p = payload?.[0]?.payload as
                      | { title?: string }
                      | undefined;
                    return p?.title ?? String(_label);
                  }}
                  formatter={((value: unknown, name: unknown) => {
                    const labels: Record<string, string> = {
                      income: "Receitas",
                      expense: "Despesas",
                      saldo: "Saldo acumulado",
                    };
                    return [
                      formatCurrency(Number(value ?? 0)),
                      labels[String(name)] ?? String(name),
                    ];
                  })}
                />
                {currentLabel && (
                  <ReferenceLine
                    x={currentLabel}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Hoje",
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }}
                  />
                )}
                <Bar
                  dataKey="income"
                  name="Receitas"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="expense"
                  name="Despesas"
                  fill="#ef4444"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/** Agrega transações por mês nas colunas da janela; saldo acumula desde o início dos dados. */
function build(
  ordered: Array<{ date: string; amount: number; type: string }>,
  columns: Array<{ key: string; label: string; title: string }>,
  _nowYear: number
): ProgressPoint[] {
  const windowStart = columns[0]?.key ?? "0000-00";
  let saldo = 0;
  for (const tx of ordered) {
    if (tx.date.slice(0, 7) < windowStart) {
      saldo += tx.type === "income" ? tx.amount : -tx.amount;
    }
  }

  const flows = new Map<string, { income: number; expense: number }>();
  for (const tx of ordered) {
    const month = tx.date.slice(0, 7);
    if (month < windowStart) continue;
    const f = flows.get(month) ?? { income: 0, expense: 0 };
    if (tx.type === "income") f.income += tx.amount;
    else f.expense += tx.amount;
    flows.set(month, f);
  }

  return columns.map(({ key, label, title }) => {
    const f = flows.get(key) ?? { income: 0, expense: 0 };
    saldo += f.income - f.expense;
    return {
      label,
      title,
      income: f.income,
      expense: f.expense,
      // Meses posteriores ao atual ficam vizuais de "projeção": linha plana.
      saldo: Math.round(saldo * 100) / 100,
    };
  });
}
