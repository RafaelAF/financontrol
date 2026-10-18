"use client";

import { useRef, useState } from "react";
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { useFinan } from "@/components/finan-provider";
import type { Transaction, TransactionType } from "@/lib/storage";

const TX_HEADER = [
  "Data",
  "Descrição",
  "Tipo",
  "Valor",
  "Categoria",
  "Observações",
  "ID",
];

type Busy = "export" | "import" | null;

type Message = { tone: "ok" | "warn" | "error"; text: string } | null;

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.trim().replace(/[^\d,.-]/g, "");
    if (!cleaned) return null;
    const normalized = cleaned.includes(",")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned;
    const n = parseFloat(normalized);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function parseType(raw: unknown): TransactionType | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (["receita", "entrada", "income", "deposito", "depósito"].some((p) => s.startsWith(p)))
    return "income";
  if (["despesa", "saída", "saida", "expense", "gasto"].some((p) => s.startsWith(p)))
    return "expense";
  return null;
}

function parseDate(raw: unknown): string | null {
  if (raw instanceof Date && !isNaN(raw.getTime()))
    return raw.toISOString().slice(0, 10);
  if (typeof raw === "number") {
    // Número serial do Excel (base 1900): 25569 = 1970-01-01.
    const d = new Date(Math.round((raw - 25569) * 86400000));
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (br) {
      const [, dd, mm, yy] = br;
      const year = yy.length === 2 ? `20${yy}` : yy;
      return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
  }
  return null;
}

function cellText(raw: unknown): string {
  if (raw == null) return "";
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "object") return String((raw as { text?: string }).text ?? "");
  return String(raw).trim();
}

export function ExportImport({
  transactions,
}: {
  /** Recorte do filtro atual; sem prop exporta tudo. */
  transactions?: Transaction[];
}) {
  const { transactions: allTransactions, categories, applyImport } = useFinan();
  const list = transactions ?? allTransactions;
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setBusy("export");
    setMessage(null);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();

      const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
      const txSheet = wb.addWorksheet("Transações");
      txSheet.addRow(TX_HEADER);
      txSheet.getRow(1).font = { bold: true };
      for (const tx of sorted) {
        const category = categories.find((c) => c.id === tx.categoryId);
        const row = txSheet.addRow([
          new Date(`${tx.date}T12:00:00`),
          tx.description,
          tx.type === "income" ? "Receita" : "Despesa",
          tx.amount,
          category?.name ?? "",
          tx.notes ?? "",
          tx.id,
        ]);
        row.getCell(1).numFmt = "dd/mm/yyyy";
        row.getCell(4).numFmt = '"R$" #,##0.00';
      }
      txSheet.columns.forEach((col) => {
        let maxWidth = 10;
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          maxWidth = Math.max(maxWidth, cellText(cell.value).length + 2);
        });
        col.width = maxWidth;
      });

      if (categories.length > 0) {
        const catSheet = wb.addWorksheet("Categorias");
        catSheet.addRow(["Nome", "ID"]);
        catSheet.getRow(1).font = { bold: true };
        for (const cat of categories) catSheet.addRow([cat.name, cat.id]);
        catSheet.columns.forEach((col) => {
          col.width = 24;
        });
      }
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `financontrol-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ tone: "ok", text: "Arquivo XLSX gerado." });
    } catch {
      setMessage({ tone: "error", text: "Não foi possível gerar o arquivo." });
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    setBusy("import");
    setMessage(null);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await wb.xlsx.load(buffer);

      const txSheet =
        wb.getWorksheet("Transações") ?? wb.worksheets[0];
      if (!txSheet) {
        setMessage({
          tone: "error",
          text: "Arquivo sem aba de dados (esperado: “Transações”).",
        });
        return;
      }

      const rows: Parameters<typeof applyImport>[0]["rows"] = [];
      let invalid = 0;

      for (const excelRow of txSheet.getRows(2, txSheet.rowCount) ?? []) {
        const values = excelRow.values as unknown[];
        const date = parseDate(values[1]);
        const description = cellText(values[2]);
        const type = parseType(values[3]);
        const amount = parseAmount(values[4]);
        const categoryName = cellText(values[5]);
        const notes = cellText(values[6]) || undefined;
        const id = cellText(values[7]) || undefined;

        if (!date || !description || !type || !amount) {
          if (values.slice(1).some((v) => cellText(v) !== "")) invalid++;
          continue;
        }

        rows.push({ id, date, description, type, amount, categoryName, notes });
      }

      if (rows.length === 0) {
        setMessage({
          tone: "error",
          text: invalid > 0
            ? "Nenhuma linha válida encontrada (verifique Data, Descrição, Tipo e Valor)."
            : "Nenhuma linha encontrada.",
        });
        return;
      }

      const catSheet = wb.getWorksheet("Categorias");
      const importCats: Array<{ id?: string; name: string }> = [];
      if (catSheet) {
        for (const excelRow of catSheet.getRows(2, catSheet.rowCount) ?? []) {
          const values = excelRow.values as unknown[];
          const name = cellText(values[1]);
          const id = cellText(values[2]) || undefined;
          if (name) importCats.push({ name, id });
        }
      }

      const result = applyImport({ rows, categories: importCats });
      setMessage({
        tone: result.added + result.updated === 0 ? "warn" : "ok",
        text: [
          `${result.added} nova(s)`,
          `${result.updated} atualizada(s)`,
          `${result.createdCategories} categoria(s) criada(s)`,
          result.skipped + invalid > 0
            ? `${result.skipped + invalid} ignorada(s)`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    } catch {
      setMessage({ tone: "error", text: "Arquivo ilegível ou corrompido." });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleExport}
        disabled={busy !== null || list.length === 0}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        title="Baixa todas as transações em uma planilha"
      >
        {busy === "export" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Exportar XLSX
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        title="Importa um XLSX no formato de exportação"
      >
        {busy === "import" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Importar XLSX
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />

      {message && (
        <p
          role="status"
          className={`w-full text-xs rounded-lg px-3 py-2 border ${
            message.tone === "ok"
              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50"
              : message.tone === "warn"
                ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50"
                : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50"
          }`}
        >
          <FileSpreadsheet className="inline h-3.5 w-3.5 mr-1" />
          {message.text}
        </p>
      )}
    </div>
  );
}
