/**
 * Monthly revenue vs expenses bar chart for the selected quarter.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyChart, SectionHeading } from "./TaxToolsUi";

interface Props {
  chartData: Array<{ month: string; Umsatz: number; Ausgaben: number }>;
  periodLabel: string;
}

export function TaxQuarterlyChart({ chartData, periodLabel }: Props) {
  const empty = chartData.every((d) => d.Umsatz === 0 && d.Ausgaben === 0);
  return (
    <section className="px-6 pt-5">
      <SectionHeading icon={TrendingUp}>Revenue vs expenses — {periodLabel}</SectionHeading>
      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        {empty ? (
          <EmptyChart />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.75 0.02 260)", fontSize: 10 }} />
                <YAxis tick={{ fill: "oklch(0.75 0.02 260)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.04 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v.toLocaleString("de-DE")} €`}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "oklch(0.75 0.02 260)" }} />
                <Bar
                  dataKey="Umsatz"
                  name="Revenue"
                  fill="oklch(0.72 0.16 155)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Ausgaben"
                  name="Expenses"
                  fill="oklch(0.71 0.18 47)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
