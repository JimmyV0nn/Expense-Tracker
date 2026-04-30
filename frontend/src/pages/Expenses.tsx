import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import ExpenseFormModal from "../components/ExpenseFormModal";
import type { Expense, ExpensePayload } from "../types";


function money(n: number) {
  return `$${n.toFixed(2)}`;
}


export default function Expenses() {
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get<string[]>("/expenses/categories");
      setCategories(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Live search: refetch with a small debounce while the user types.
  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.q = search.trim();
        if (categoryFilter) params.category = categoryFilter;
        const { data } = await api.get<Expense[]>("/expenses/", { params });
        setItems(data);
      } catch {
        toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [search, categoryFilter]);

  const subtotal = useMemo(
    () => items.reduce((s, e) => s + e.amount, 0),
    [items]
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setModalOpen(true);
  }

  async function handleSubmit(payload: ExpensePayload) {
    try {
      if (editing) {
        const { data } = await api.put<Expense>(
          `/expenses/${editing.id}`,
          payload
        );
        setItems((prev) => prev.map((e) => (e.id === data.id ? data : e)));
        toast.success("Expense updated");
      } else {
        const { data } = await api.post<Expense>("/expenses/", payload);
        setItems((prev) => [data, ...prev]);
        toast.success("Expense added");
      }
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Save failed");
      throw err;
    }
  }

  async function handleDelete(e: Expense) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    try {
      await api.delete(`/expenses/${e.id}`);
      setItems((prev) => prev.filter((x) => x.id !== e.id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Expenses</h1>
        <button className="btn-primary" onClick={openCreate}>
          Add expense
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-[220px]"
          placeholder="Search by title, category, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[200px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm">
          <span className="text-slate-500">
            {loading
              ? "Loading..."
              : `${items.length} item${items.length === 1 ? "" : "s"}`}
          </span>
          <span className="font-semibold text-slate-700">
            Subtotal: {money(subtotal)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    No matching expenses.
                  </td>
                </tr>
              ) : (
                items.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{e.title}</div>
                      {e.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {e.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge">{e.category}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.spent_on}</td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-600">
                      {money(e.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        className="text-sm font-medium text-slate-600 hover:text-brand-600"
                        onClick={() => openEdit(e)}
                      >
                        Edit
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        className="text-sm font-medium text-rose-500 hover:text-rose-700"
                        onClick={() => handleDelete(e)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal
        open={modalOpen}
        initial={editing}
        knownCategories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
