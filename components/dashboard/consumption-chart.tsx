"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ChartDataPoint {
  name: string;
  kwh: number;
  montant: number;
}

interface ConsumptionChartProps {
  data: ChartDataPoint[];
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="font-semibold text-slate-600">Aucune donnée de consommation enregistrée.</p>
        <p className="text-xs text-slate-400 mt-1">
          Les statistiques détaillées apparaîtront dès votre première facture.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: -8, bottom: 4 }}
        >
          <defs>
            <linearGradient id="emeraldBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            className="text-[11px] font-medium"
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />

          <YAxis
            stroke="#94a3b8"
            className="text-[11px] font-medium"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value} kWh`}
          />

          <Tooltip
            cursor={{ fill: "#f1f5f9", radius: 8 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ChartDataPoint;
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-bold text-slate-800 flex items-center justify-between gap-4 border-b border-slate-100 pb-1.5">
                      <span>{label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200/60">
                        Sous-compteur
                      </span>
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      <p className="text-emerald-600 font-bold flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-normal">Consommation :</span>
                        <span>{item.kwh} kWh</span>
                      </p>
                      <p className="text-slate-700 font-semibold flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-normal">Montant estimé :</span>
                        <span>{new Intl.NumberFormat("fr-FR").format(item.montant)} FCFA</span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="kwh"
            fill="url(#emeraldBarGradient)"
            radius={[8, 8, 2, 2]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
