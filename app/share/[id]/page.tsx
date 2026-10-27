import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA, formatKWh, formatPercent } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Receipt, Building2, Calendar, CheckCircle, Clock, ShieldCheck, Printer } from "lucide-react";
import { SharePrintButton } from "./print-button";

export const instant = false;

interface ShareBillPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShareBillPage({ params }: ShareBillPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Récupérer la facture avec la propriété
  const { data: bill } = await supabase
    .from("bills")
    .select("*, property:properties(name, address, meter_id)")
    .eq("id", id)
    .single();

  if (!bill) {
    notFound();
  }

  // 2. Récupérer les parts de facture
  const { data: shares } = await supabase
    .from("bill_shares")
    .select(`
      *,
      tenant:tenants(id, full_name, sub_meter_id)
    `)
    .eq("bill_id", id)
    .order("amount_due", { ascending: false });

  // 3. Récupérer les relevés
  const { data: readings } = await supabase
    .from("meter_readings")
    .select("*")
    .eq("bill_id", id);

  const readingsMap = new Map<string, { previous_reading: number; current_reading: number }>();
  readings?.forEach((r) => {
    readingsMap.set(r.tenant_id, {
      previous_reading: Number(r.previous_reading),
      current_reading: Number(r.current_reading),
    });
  });

  const periodFormatted = `Du ${new Date(bill.period_start).toLocaleDateString("fr-FR")} au ${new Date(bill.period_end).toLocaleDateString("fr-FR")}`;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md">
              <Zap className="h-5 w-5 fill-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-foreground">
                  Watt<span className="text-emerald-600">Share</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Décompte Officiel
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Note de Répartition des Sous-compteurs d&apos;Électricité
              </p>
            </div>
          </div>

          <SharePrintButton />
        </div>

        {/* Invoice Card */}
        <Card className="border border-border/80 shadow-2xl bg-card overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 p-6 sm:p-8 border-b border-slate-200 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-[11px] uppercase tracking-widest text-emerald-600 font-extrabold">
                    Certificat de Répartition Transparente
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {bill.property?.name || "Maison"}
                </h1>
                {bill.property?.address && (
                  <p className="text-sm text-slate-500">
                    {bill.property.address}
                  </p>
                )}
                <div className="inline-flex items-center gap-2 pt-2 text-xs font-semibold text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Période facturée : {periodFormatted}</span>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Montant Global Facture
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatFCFA(Number(bill.total_amount))}
                </div>
                <div className="text-xs text-emerald-600 font-semibold">
                  {formatKWh(Number(bill.total_kwh))} au compteur général ({bill.provider || "ENEO"})
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  Quotes-parts individuelles par locataire
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chaque résident règle sa part exacte calculée proportionnellement à son relevé.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-border/70 rounded-2xl">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider bg-muted/40 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Locataire & Compteur</th>
                    <th className="px-4 py-3.5 font-bold">Ancien Index</th>
                    <th className="px-4 py-3.5 font-bold">Nouvel Index</th>
                    <th className="px-4 py-3.5 font-bold text-center">Consommation</th>
                    <th className="px-4 py-3.5 font-bold text-center">Part (%)</th>
                    <th className="px-6 py-3.5 font-bold text-right">Montant Dû</th>
                    <th className="px-4 py-3.5 font-bold text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {shares?.map((share) => {
                    const isPaid = share.payment_status === "paid";
                    const reading = readingsMap.get(share.tenant_id);

                    const initials = (share.tenant?.full_name || "L")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={share.id}
                        className={`transition-colors ${isPaid ? "bg-emerald-500/[0.04]" : "hover:bg-muted/20"}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">
                                {share.tenant.full_name}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-600 font-semibold">
                                {share.tenant.sub_meter_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-muted-foreground font-mono">
                          {reading?.previous_reading ?? "-"} kWh
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-foreground font-mono">
                          {reading?.current_reading ?? "-"} kWh
                        </td>

                        <td className="px-4 py-4 text-center font-black text-emerald-600 text-sm">
                          {formatKWh(Number(share.consumption_kwh))}
                        </td>

                        <td className="px-4 py-4 text-center text-xs font-bold text-muted-foreground">
                          {formatPercent(Number(share.consumption_percent))}
                        </td>

                        <td className="px-6 py-4 text-right font-black text-foreground text-base">
                          {formatFCFA(Number(share.amount_due))}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Badge
                            variant={isPaid ? "success" : "secondary"}
                            className="font-bold text-[11px]"
                          >
                            {isPaid ? "Réglé" : "À régler"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Garantie de transparence et méthode de calcul</span>
              </p>
              <p className="leading-relaxed">
                Le montant dû par chaque locataire est obtenu en appliquant la formule :
                <span className="font-mono text-foreground font-bold mx-1">
                  (Consommation sous-compteur / Somme totale des sous-compteurs) × Montant total facture
                </span>.
                Ce calcul garantit une équité absolue entre tous les résidents.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
