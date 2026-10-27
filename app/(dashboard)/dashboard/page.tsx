import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA, formatKWh } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConsumptionChart } from "@/components/dashboard/consumption-chart";
import {
  Zap,
  Users,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Récupérer les propriétés du propriétaire
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address, meter_id")
    .order("created_at", { ascending: false });

  const propertyIds = properties?.map((p) => p.id) || [];

  // 2. Récupérer les locataires
  const { data: tenants } = propertyIds.length
    ? await supabase
        .from("tenants")
        .select("*")
        .in("property_id", propertyIds)
    : { data: [] };

  const activeTenants = tenants?.filter((t) => t.is_active) || [];

  // 3. Récupérer les factures
  const { data: bills } = propertyIds.length
    ? await supabase
        .from("bills")
        .select("*, property:properties(name)")
        .in("property_id", propertyIds)
        .order("period_end", { ascending: false })
        .limit(10)
    : { data: [] };

  const billIds = bills?.map((b) => b.id) || [];

  // 4. Récupérer les parts de factures pour les statistiques de paiement
  const { data: billShares } = billIds.length
    ? await supabase
        .from("bill_shares")
        .select("*, tenant:tenants(full_name)")
        .in("bill_id", billIds)
    : { data: [] };

  // Calculs statistiques
  const totalBillsAmount = bills?.reduce((acc, b) => acc + Number(b.total_amount || 0), 0) || 0;
  const totalKWh = bills?.reduce((acc, b) => acc + Number(b.total_kwh || 0), 0) || 0;
  
  const totalPaidShares = billShares?.filter((s) => s.payment_status === "paid").length || 0;
  const totalSharesCount = billShares?.length || 0;
  const paymentRate = totalSharesCount > 0 ? Math.round((totalPaidShares / totalSharesCount) * 100) : 100;

  // Données pour le graphique (par locataire sur la dernière facture ou global)
  const chartData = billShares?.slice(0, 7).map((s) => ({
    name: s.tenant?.full_name || "Locataire",
    kwh: Number(s.consumption_kwh) || 0,
    montant: Number(s.amount_due) || 0,
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Système de Sous-comptage Intelligent</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Bienvenue sur <span className="text-emerald-100">WattShare</span>
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Supervisez la consommation en kWh de vos sous-compteurs et automatisez la répartition exacte de vos factures d&apos;électricité en FCFA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              asChild
              className="bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold shadow-lg h-11 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link href="/bills/new" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Saisir une facture</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-11 px-5 rounded-xl font-semibold"
            >
              <Link href="/properties" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Mes maisons</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Facturé */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/60 rounded-full blur-2xl group-hover:bg-emerald-200/80 transition-all duration-300 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Facturé
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 transition-transform group-hover:scale-110">
              <Receipt className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {formatFCFA(totalBillsAmount)}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="font-semibold text-slate-600">{bills?.length || 0}</span> facture(s) ventilée(s)
            </p>
          </CardContent>
        </Card>

        {/* Consommation Totale */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-200/70 transition-all duration-300 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Énergie Totale
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 transition-transform group-hover:scale-110">
              <Zap className="h-5 w-5 fill-amber-200" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {formatKWh(totalKWh)}
            </div>
            <p className="text-xs text-slate-400">
              Relevé cumulé des sous-compteurs
            </p>
          </CardContent>
        </Card>

        {/* Locataires Actifs */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100/50 rounded-full blur-2xl group-hover:bg-sky-200/70 transition-all duration-300 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Locataires Actifs
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60 transition-transform group-hover:scale-110">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {activeTenants.length}
            </div>
            <p className="text-xs text-slate-400">
              Répartis dans <span className="font-semibold text-slate-600">{properties?.length || 0}</span> maison(s)
            </p>
          </CardContent>
        </Card>

        {/* Taux de Paiement */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-full blur-2xl group-hover:bg-violet-200/70 transition-all duration-300 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Recouvrement
            </CardTitle>
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-200/60 transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {paymentRate}%
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {totalPaidShares}/{totalSharesCount} réglées
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${paymentRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts & Quick Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consommation Graphique */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-slate-900">
                  Consommation par Locataire
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  Temps Réel
                </span>
              </div>
              <CardDescription className="text-slate-400">
                Énergie mesurée aux sous-compteurs individuels lors des derniers index
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ConsumptionChart data={chartData} />
          </CardContent>
        </Card>

        {/* Quick Guide Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-extrabold text-slate-900">
              Guide de Répartition
            </CardTitle>
            <CardDescription className="text-slate-400">
              3 étapes pour un calcul 100% équitable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm p-6">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/40">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-xs">Ajoutez vos maisons</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Renseignez l&apos;adresse et le compteur principal ENEO.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-sky-50/60 border border-sky-200/40">
              <div className="h-7 w-7 rounded-lg bg-sky-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-xs">Associez les locataires</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Chaque résident reçoit un numéro de sous-compteur unique.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-violet-50/60 border border-violet-200/40">
              <div className="h-7 w-7 rounded-lg bg-violet-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                3
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-xs">Saisie & Partage en 1 clic</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  WattShare calcule les montants en FCFA et génère le lien WhatsApp.
                </p>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 font-bold text-xs h-10 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors">
              <Link href="/properties">
                <Building2 className="h-4 w-4 mr-2 text-emerald-500" />
                Gérer les propriétés & locataires
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Bills Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-extrabold text-slate-900">
              Factures Récentes
            </CardTitle>
            <CardDescription className="text-slate-400">
              Historique des derniers décomptes répartis
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            <Link href="/bills" className="flex items-center gap-1">
              <span>Voir l&apos;historique complet</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {bills && bills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider bg-slate-50/80 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Propriété</th>
                    <th className="px-6 py-3.5 font-bold">Période Facturée</th>
                    <th className="px-6 py-3.5 font-bold">Montant Global</th>
                    <th className="px-6 py-3.5 font-bold">Énergie Totale</th>
                    <th className="px-6 py-3.5 font-bold">Statut</th>
                    <th className="px-6 py-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {bill.property?.name || "Maison"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                        Du {new Date(bill.period_start).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(bill.period_end).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">
                        {formatFCFA(Number(bill.total_amount))}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-bold text-xs">
                        {formatKWh(Number(bill.total_kwh))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            bill.status === "finalized"
                              ? "success"
                              : bill.status === "calculated"
                              ? "default"
                              : "secondary"
                          }
                          className="font-bold text-[11px]"
                        >
                          {bill.status === "finalized"
                            ? "Finalisée"
                            : bill.status === "calculated"
                            ? "Calculée"
                            : "Brouillon"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" variant="outline" className="rounded-lg font-bold text-xs h-8 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                          <Link href={`/bills/${bill.id}`} className="flex items-center gap-1">
                            <span>Détails</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-200/60">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-800 text-base">Aucune facture enregistrée pour l&apos;instant</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-5">
                Créez votre première maison, renseignez vos locataires et commencez à répartir vos factures simplement.
              </p>
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/15">
                <Link href="/bills/new">Créer ma première facture</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
