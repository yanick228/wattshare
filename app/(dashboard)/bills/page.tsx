import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA, formatKWh } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  PlusCircle,
  Building2,
  Calendar,
  Share2,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function BillsPage() {
  const supabase = await createClient();

  // 1. Récupérer les propriétés du propriétaire
  const { data: properties } = await supabase
    .from("properties")
    .select("id");

  const propertyIds = properties?.map((p) => p.id) || [];

  // 2. Récupérer les factures
  const { data: bills } = propertyIds.length
    ? await supabase
        .from("bills")
        .select(`
          *,
          property:properties(name),
          bill_shares(id, payment_status, amount_due)
        `)
        .in("property_id", propertyIds)
        .order("period_end", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Factures & Répartitions
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {bills?.length || 0} enregistrée(s)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Historique complet des décomptes répartis par maison et suivi du recouvrement des paiements.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-2 rounded-xl h-10 px-4 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Link href="/bills/new">
            <PlusCircle className="h-4 w-4" />
            <span>Nouvelle facture</span>
          </Link>
        </Button>
      </div>

      {bills && bills.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground">
                  Toutes les factures réparties
                </CardTitle>
                <CardDescription>
                  Tableau chronologique des factures émises
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider bg-muted/30 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Maison</th>
                    <th className="px-6 py-3.5 font-bold">Période</th>
                    <th className="px-6 py-3.5 font-bold">Montant Facture</th>
                    <th className="px-6 py-3.5 font-bold">Énergie Totale</th>
                    <th className="px-6 py-3.5 font-bold">Recouvrement</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bills.map((bill) => {
                    const shares = bill.bill_shares || [];
                    const paidShares = shares.filter(
                      (s: { payment_status: string }) => s.payment_status === "paid"
                    ).length;
                    const allPaid = shares.length > 0 && paidShares === shares.length;

                    return (
                      <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          {bill.property?.name || "Maison"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                          Du {new Date(bill.period_start).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(bill.period_end).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 font-black text-foreground">
                          {formatFCFA(Number(bill.total_amount))}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-bold text-xs">
                          {formatKWh(Number(bill.total_kwh))}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={allPaid ? "success" : paidShares > 0 ? "warning" : "secondary"}
                            className="font-bold text-[11px]"
                          >
                            {paidShares}/{shares.length} réglé(s)
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button asChild size="sm" variant="outline" className="rounded-lg font-bold text-xs h-8">
                            <Link href={`/bills/${bill.id}`} className="flex items-center gap-1.5">
                              <span>Détails & Parts</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-20 border-dashed border-border/80 bg-card/40">
          <CardContent className="space-y-5 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-foreground">
                Aucune facture enregistrée
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Commencez dès maintenant en saisissant votre première facture pour générer les quotes-parts de vos locataires.
              </p>
            </div>
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold rounded-xl text-xs h-10 px-5 shadow-md shadow-emerald-500/20">
              <Link href="/bills/new">Saisir une facture</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
