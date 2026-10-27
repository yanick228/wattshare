import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA, formatKWh } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillShareRow } from "@/components/bills/bill-share-row";
import { CopyShareButton } from "@/components/bills/copy-share-button";
import {
  ArrowLeft,
  Receipt,
  Building2,
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  FileText,
  Share2,
} from "lucide-react";

export const instant = false;

interface BillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Récupérer la facture avec sa propriété
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
      tenant:tenants(id, full_name, phone, sub_meter_id)
    `)
    .eq("bill_id", id)
    .order("amount_due", { ascending: false });

  // 3. Récupérer les relevés de compteurs
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

  const paidSharesCount = shares?.filter((s) => s.payment_status === "paid").length || 0;
  const totalSharesCount = shares?.length || 0;
  const totalCollected = shares
    ?.filter((s) => s.payment_status === "paid")
    .reduce((acc, s) => acc + Number(s.amount_due), 0) || 0;

  const totalSubMetersKwh = shares?.reduce(
    (acc, s) => acc + Number(s.consumption_kwh),
    0
  ) || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
          <Link href="/bills" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Toutes les factures</span>
          </Link>
        </Button>
        <CopyShareButton billId={bill.id} />
      </div>

      {/* Bill Summary Banner */}
      <Card className="relative overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0 shadow-md">
              <Receipt className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Décompte Facture
                </h1>
                {bill.bill_reference && (
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-emerald-700 border border-slate-200">
                    {bill.bill_reference}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-semibold text-foreground/90">{bill.property?.name}</span>
                <span>•</span>
                <span>{periodFormatted}</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-0.5 border-t sm:border-t-0 pt-4 sm:pt-0 border-border/60">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Montant Global Facture
            </span>
            <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {formatFCFA(Number(bill.total_amount))}
            </div>
            <span className="text-xs font-semibold text-emerald-600 block">
              Fournisseur : {bill.provider || "ENEO"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-border/60">
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Compteur Principal
            </span>
            <p className="font-black text-foreground text-base">
              {formatKWh(Number(bill.total_kwh))}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Sous-compteurs
            </span>
            <p className="font-black text-emerald-600 text-base">
              {formatKWh(totalSubMetersKwh)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Recouvrement
            </span>
            <p className="font-black text-foreground text-base">
              {paidSharesCount} / {totalSharesCount} locataires
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Total Encaissé
            </span>
            <p className="font-black text-emerald-600 text-base">
              {formatFCFA(totalCollected)}
            </p>
          </div>
        </div>
      </Card>

      {/* Tenant Breakdown Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-extrabold text-foreground">
              Quotes-parts Détaillées par Locataire
            </CardTitle>
            <CardDescription>
              Ventilation calculée selon la consommation individuelle en kWh de chaque sous-compteur
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-wider bg-muted/30 text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Locataire & Compteur</th>
                  <th className="px-4 py-3.5 font-bold">Ancien Index</th>
                  <th className="px-4 py-3.5 font-bold">Nouvel Index</th>
                  <th className="px-4 py-3.5 font-bold text-center">Consommation</th>
                  <th className="px-4 py-3.5 font-bold text-center">Quote-part (%)</th>
                  <th className="px-6 py-3.5 font-bold">Montant Dû</th>
                  <th className="px-4 py-3.5 font-bold">Statut</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {shares?.map((share) => (
                  <BillShareRow
                    key={share.id}
                    share={share}
                    billPeriod={periodFormatted}
                    reading={readingsMap.get(share.tenant_id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
