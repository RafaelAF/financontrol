"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Category } from "@/lib/storage";
import { TransactionModal } from "./transaction-modal";

interface AddTransactionButtonProps {
  categories: Category[];
}

export function AddTransactionButton({ categories }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="add-transaction-btn"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Nova Transação
      </button>

      <TransactionModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        mode="create"
      />
    </>
  );
}
