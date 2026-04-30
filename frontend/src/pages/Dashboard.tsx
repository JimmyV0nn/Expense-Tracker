import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { CategorySummary, Expense, MonthlySummary } from "../types";


function money(n: number) {
  return `$${n.toFixed(2)}`;
}


export default function Dashboard() {
  const [recent, setRecent] = useState<Expense[]>([]);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);
  const [byMonth, setByMonth] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [r1, r2, r3] = await Promise.all([
          api.get<Expense[]>("/expenses/"),
          api.get<CategorySummary[]>("/expenses/summary/by-category"),
          api.get<MonthlySummary[]>("/expenses/summary/by-month"),
        ]);
        if (cancelled) return;
        setRecent(r1.data.slice(0, 5));
        setByCategory(r2.data);
        setByMonth(r3.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalAll = useMemo(
    () => byCategory.reduce((s, r) => s + r.total, 0),
    [byCategory]
  );

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const totalThisMonth =
    byMonth.find((m) => m.month === thisMonthKey)?.total ?? 0;

  const topCategory = byCategory[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total spent" value={money(totalAll)} />
        <StatCard label="This month" value={money(totalThisMonth)} />
        <StatCard
          label="Top category"
          value={
            topCategory
              ? `${topCategory.category} (${money(topCategory.total)})`
              : "-"
          }
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Recent expenses
          </h2>
          <Link
            to="/expenses"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        ) : recent.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No expenses yet. Add one from the Expenses page.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-slate-800">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {e.category} | {e.spent_on}
                  </p>
                </div>
                <span className="font-semibold text-brand-600">
                  {money(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-slate-800">
          Spending by category
        </h2>
        {byCategory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No data yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {byCategory.map((c) => {
              const pct = totalAll === 0 ? 0 : (c.total / totalAll) * 100;
              return (
                <li key={c.category}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{c.category}</span>
                    <span className="text-slate-500">
                      {money(c.total)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
