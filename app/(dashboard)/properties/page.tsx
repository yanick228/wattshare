import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CreatePropertyDialog } from "@/components/properties/create-property-dialog";
import { Building2, Users, Gauge, ArrowRight, MapPin, Zap } from "lucide-react";

export const instant = false;

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("*, tenants:tenants(id, is_active)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 shadow-xl shadow-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 text-white/90 border border-white/20">
                {properties?.length || 0} propriété(s) gérée(s)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Propriétés &amp; Maisons
            </h1>
            <p className="text-sm text-white/70 max-w-md">
              Gérez vos compteurs principaux et les locataires rattachés à chaque bâtiment.
            </p>
          </div>
          <CreatePropertyDialog />
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      {properties && properties.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              {/* Head */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80">
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Propriété</th>
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Adresse</th>
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Compteur principal</th>
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Locataires</th>
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Occupation</th>
                  <th className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => {
                  const totalTenants = property.tenants?.length || 0;
                  const activeTenants =
                    property.tenants?.filter((t: { is_active: boolean }) => t.is_active).length || 0;
                  const occupancyPct = totalTenants > 0
                    ? Math.round((activeTenants / totalTenants) * 100)
                    : 0;

                  return (
                    <tr
                      key={property.id}
                      className="group hover:bg-emerald-50/40 transition-colors duration-150"
                    >
                      {/* Propriété */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                            <Building2 className="h-4.5 w-4.5 h-4 w-4" />
                          </div>
                          <span className="font-black text-slate-900 tracking-tight">
                            {property.name}
                          </span>
                        </div>
                      </td>

                      {/* Adresse */}
                      <td className="px-6 py-4 max-w-[180px]">
                        {property.address ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{property.address}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Non précisée</span>
                        )}
                      </td>

                      {/* Compteur */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-emerald-700 border border-slate-200">
                          <Gauge className="h-3 w-3" />
                          {property.meter_id || <span className="text-slate-400 font-normal not-italic">—</span>}
                        </span>
                      </td>

                      {/* Locataires */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Users className="h-3.5 w-3.5 text-sky-500" />
                          {activeTenants} / {totalTenants}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">actif(s) / total</span>
                      </td>

                      {/* Occupation */}
                      <td className="px-6 py-4 w-36">
                        {totalTenants > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500">{occupancyPct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                                style={{ width: `${occupancyPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <Badge
                          variant={activeTenants > 0 ? "success" : "secondary"}
                          className="text-[10px] font-bold"
                        >
                          {activeTenants > 0 ? `${activeTenants} actif${activeTenants > 1 ? "s" : ""}` : "Vide"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/properties/${property.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-600 text-slate-600 hover:text-white border border-slate-200 hover:border-transparent font-bold text-xs transition-all duration-200 group/btn"
                        >
                          <span>Gérer</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {properties.length} propriété(s) au total
            </span>
            <CreatePropertyDialog />
          </div>
        </div>
      ) : (
        /* ── Empty state ─────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-500 flex items-center justify-center border border-emerald-200/60 shadow-xl shadow-emerald-100">
              <Building2 className="h-12 w-12" />
            </div>
            <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-black text-slate-900">Aucune propriété ajoutée</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ajoutez votre premier immeuble ou maison pour commencer à rattacher les résidents et leurs sous-compteurs kWh.
            </p>
          </div>
          <CreatePropertyDialog />
        </div>
      )}
    </div>
  );
}
