/**
 * ReserveChart — monthly net revenue vs reserve accrued.
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

export interface ReserveMonthPoint {
  month: string; // "Jan"
  revenue: number;
  reserve: number;
}

export function ReserveChart({ data }: { data: ReserveMonthPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
          <XAxis dataKey="month" tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
          <YAxis tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.16 0.04 264)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 8,
              color: "white",
            }}
            formatter={(v: number) => `${v.toLocaleString("de-DE")} €`}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.7 0.02 260)" }} />
          <Bar
            dataKey="revenue"
            name="Net revenue"
            fill="oklch(0.55 0.10 250)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="reserve"
            name="Reserve accrued"
            fill="oklch(0.71 0.18 47)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
