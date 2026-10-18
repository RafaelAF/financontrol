// Camada de dados local (local-first): sem login e sem banco.
// Persistência em localStorage do navegador; export/import XLSX = backup e integração manual.

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  /** Date-only no formato "yyyy-mm-dd" (independe de timezone). */
  date: string;
  notes?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type TransactionWithCategory = Transaction & {
  category?: Category;
};

export type TransactionFormData = Pick<
  Transaction,
  "description" | "amount" | "type" | "categoryId" | "date"
> & { notes?: string };

const TRANSACTIONS_KEY = "financontrol:transactions";
const CATEGORIES_KEY = "financontrol:categories";

export const DEFAULT_CATEGORIES = [
  "Salário",
  "Freelance",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Investimentos",
  "Outros",
] as const;

export function uid(): string {
  return crypto.randomUUID();
}

/** Data local "yyyy-mm-dd" (evita new Date() durante o prerender SSR). */
export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(list: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Category[]) : [];
  } catch {
    return [];
  }
}

export function saveCategories(list: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
}
