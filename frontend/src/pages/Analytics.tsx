import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import type { CategoryMonthlySummary, CategorySummary, MonthlySummary } from "../types";


const COLORS = [
  "#4f6df5",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#0ea5e9",
];
function weightedPrediction(months: number[]): number {
  if (months.length === 0) return 0;
  if (months.length === 1) return months[0];

  const weights = months.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = months.reduce((sum, val, i) => sum + val * weights[i], 0);
  return weighted / totalWeight;
}

export default function Analytics() {
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);
  const [byMonth, setByMonth] = useState<MonthlySummary[]>([]);
  const [byCategoryMonth, setByCategoryMonth] = useState<CategoryMonthlySummary[]>([]);
  useEffect(() => {
    api
      .get<CategorySummary[]>("/expenses/summary/by-category")
      .then(({ data }) => setByCategory(data));
    api
      .get<MonthlySummary[]>("/expenses/summary/by-month")
      .then(({ data }) => setByMonth(data));
    api
      .get<CategoryMonthlySummary[]>("/expenses/summary/by-category-month")
      .then(({ data }) => setByCategoryMonth(data));
  }, []);

    const predictions: Record<string, number> = {};
    const categories = [...new Set(byCategoryMonth.map((r) => r.category))];
    for (const cat of categories) {
      const monthlyTotals = byCategoryMonth
        .filter((r) => r.category === cat)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((r) => r.total);
      predictions[cat] = weightedPrediction(monthlyTotals);
    }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">By category</h2>
          <p className="text-xs text-slate-500">Total amount per category</p>
          <div className="mt-4 h-72">
            {byCategory.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => entry.category}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800">
            Monthly trend
          </h2>
          <p className="text-xs text-slate-500">Total spent per month</p>
          <div className="mt-4 h-72">
            {byMonth.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#4f6df5" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-slate-800">
          Category breakdown
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
        Predicted next month uses weighted moving average — recent months weighted higher
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Items</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 text-right">Predicted Next Month
                <div className="text-slate-400 normal-case font-normal tracking-normal">(based on monthly avg)</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {byCategory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No data yet.
                </td>
              </tr>
            ) : (
              byCategory.map((c) => (
                <tr
                  key={c.category}
                  className="border-t border-slate-100"
                >
                  <td className="py-2 text-slate-700">{c.category}</td>
                  <td className="py-2 text-right text-slate-600">{c.count}</td>
                  <td className="py-2 text-right font-semibold text-brand-600">
                    ${c.total.toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-semibold text-emerald-600">
                  ~${(predictions[c.category] ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      No data yet. Add some expenses first.
    </div>
  );
}
