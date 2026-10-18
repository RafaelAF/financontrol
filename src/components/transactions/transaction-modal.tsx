"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import type { TransactionFormData } from "@/lib/storage";
import { useFinan } from "@/components/finan-provider";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  categories: {
    id: string;
    name: string;
  }[];
  mode: "create" | "edit";
  initialData?: Partial<TransactionFormData> & { id?: string };
}

export function TransactionModal({
  open,
  onClose,
  categories,
  mode,
  initialData,
}: TransactionModalProps) {
  const { addTransaction, updateTransaction, addCategory } = useFinan();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o estado quando o modal é reaberto.
  useEffect(() => {
    if (!open) {
      setError(null);
      setNewCategoryName("");
      setIsSaving(false);
      setSelectedCategoryId(initialData?.categoryId ?? "");
      setType(initialData?.type ?? "expense");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const today = new Date().toISOString().split("T")[0];

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = addCategory(name);
    if (!created) {
      setError("Essa categoria já existe.");
      return;
    }
    setError(null);
    setNewCategoryName("");
    setSelectedCategoryId(created.id);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: TransactionFormData = {
      description: (fd.get("description") as string).trim(),
      amount: parseFloat(fd.get("amount") as string),
      type,
      categoryId: selectedCategoryId,
      date: fd.get("date") as string,
      notes: (fd.get("notes") as string) || undefined,
    };

    if (!data.description || !Number.isFinite(data.amount)) {
      setError("Preencha descrição e valor.");
      return;
    }
    if (!data.categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      if (mode === "edit" && initialData?.id) {
        updateTransaction(initialData.id, data);
      } else {
        addTransaction(data);
      }
      onClose();
      formRef.current?.reset();
      setSelectedCategoryId("");
    } catch {
      setError("Falha ao salvar no navegador (limite atingido?).");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-base">
              {mode === "create" ? "Nova Transação" : "Editar Transação"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              {(["income", "expense"] as const).map((t) => {
                const selected = type === t;
                const Icon = t === "income" ? ArrowUpCircle : ArrowDownCircle;
                return (
                  <label
                    key={t}
                    className={`relative flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                      t === "income"
                        ? selected
                          ? "border-emerald-600 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "border-border text-muted-foreground hover:border-emerald-500/50"
                        : selected
                          ? "border-red-600 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                          : "border-border text-muted-foreground hover:border-red-500/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={selected}
                      onChange={() => setType(t)}
                      className="sr-only"
                    />
                    <Icon className="h-4 w-4" />
                    {t === "income" ? "Receita" : "Despesa"}
                    {selected && <Check className="h-4 w-4" />}
                  </label>
                );
              })}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="description">
                Descrição
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                defaultValue={initialData?.description}
                placeholder="Ex: Supermercado"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="amount">
                  Valor (R$)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={initialData?.amount}
                  placeholder="0,00"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="date">
                  Data
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={initialData?.date ?? today}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="categoryId">
                Categoria
              </label>
              <div className="flex gap-2">
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nova categoria"
                  aria-label="Nova categoria"
                  className="w-32 px-2.5 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={newCategoryName.trim() === ""}
                  className="shrink-0 inline-flex items-center px-2.5 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  aria-label="Adicionar categoria"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="notes">
                Observações{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={initialData?.notes}
                placeholder="Alguma nota adicional..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Erro de validação/localstorage */}
            {error && (
              <p
                role="alert"
                className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || categories.length === 0}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Adicionar" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
