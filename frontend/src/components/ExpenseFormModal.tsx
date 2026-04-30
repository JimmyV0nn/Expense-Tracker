import { useEffect, useState } from "react";
import type { Expense, ExpensePayload } from "../types";


const PRESET_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}


interface Props {
  open: boolean;
  initial?: Expense | null;
  knownCategories: string[];
  onClose: () => void;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
}

export default function ExpenseFormModal({
  open,
  initial,
  knownCategories,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setCategory(initial?.category ?? "Food");
    setAmount(initial?.amount != null ? String(initial.amount) : "");
    setSpentOn(initial?.spent_on ?? todayISO());
    setDescription(initial?.description ?? "");
  }, [open, initial]);

  if (!open) return null;

  const categories = Array.from(
    new Set([...PRESET_CATEGORIES, ...knownCategories])
  ).sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        amount: Number(amount),
        spent_on: spentOn,
        description: description.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800">
          {initial ? "Edit expense" : "Add expense"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Amount</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Saving..." : initial ? "Save changes" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
