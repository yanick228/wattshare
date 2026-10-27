"use client";

import { useState } from "react";
import { togglePaymentStatus } from "@/lib/actions/bills";
import { formatFCFA, formatKWh, formatPercent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCircle2, Clock, Loader2, MessageSquare, Phone } from "lucide-react";

interface BillShareRowProps {
  share: {
    id: string;
    bill_id: string;
    amount_due: number;
    consumption_kwh: number;
    consumption_percent: number;
    payment_status: "unpaid" | "paid" | "partial";
    paid_at: string | null;
    tenant: {
      id: string;
      full_name: string;
      phone: string | null;
      sub_meter_id: string;
    };
  };
  billPeriod: string;
  reading?: {
    previous_reading: number;
    current_reading: number;
  };
}

export function BillShareRow({ share, billPeriod, reading }: BillShareRowProps) {
  const [loading, setLoading] = useState(false);
  const isPaid = share.payment_status === "paid";

  const handleToggle = async () => {
    setLoading(true);
    try {
      await togglePaymentStatus(share.id, share.payment_status, share.bill_id);
    } finally {
      setLoading(false);
    }
  };

  // Message WhatsApp prêt à l'emploi
  const whatsappMessage = encodeURIComponent(
    `Bonjour ${share.tenant.full_name},\n\n` +
    `⚡ Voici le relevé de votre sous-compteur (${share.tenant.sub_meter_id}) pour la période : ${billPeriod}.\n\n` +
    `• Ancien index : ${reading?.previous_reading || 0} kWh\n` +
    `• Nouvel index : ${reading?.current_reading || 0} kWh\n` +
    `• Votre consommation : ${share.consumption_kwh} kWh (${share.consumption_percent}% du total)\n\n` +
    `👉 Montant net à régler : ${formatFCFA(Number(share.amount_due))}\n\n` +
    `Merci de bien vouloir effectuer votre règlement.`
  );

  const cleanPhone = share.tenant.phone?.replace(/[^0-9+]/g, "");

  const initials = share.tenant.full_name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <tr className={`transition-colors ${isPaid ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]" : "hover:bg-muted/20"}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-xl font-black text-xs flex items-center justify-center border shrink-0 transition-transform ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            {initials}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="font-bold text-foreground text-sm truncate">
              {share.tenant.full_name}
            </div>
            <div className="text-[11px] font-mono font-medium text-emerald-600 flex items-center gap-1.5">
              <span>{share.tenant.sub_meter_id}</span>
              {share.tenant.phone && (
                <span className="text-muted-foreground/70 font-sans">
                  • {share.tenant.phone}
                </span>
              )}
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

      <td className="px-4 py-4 font-black text-emerald-600 text-sm">
        {formatKWh(Number(share.consumption_kwh))}
      </td>

      <td className="px-4 py-4 text-xs font-bold text-muted-foreground">
        {formatPercent(Number(share.consumption_percent))}
      </td>

      <td className="px-6 py-4 font-black text-foreground text-base">
        {formatFCFA(Number(share.amount_due))}
      </td>

      <td className="px-4 py-4">
        <Badge
          variant={isPaid ? "success" : "secondary"}
          className="font-bold text-[11px] inline-flex items-center gap-1.5"
        >
          {isPaid ? (
            <>
              <Check className="h-3 w-3" />
              <span>Réglé</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              <span>En attente</span>
            </>
          )}
        </Badge>
        {isPaid && share.paid_at && (
          <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
            Le {new Date(share.paid_at).toLocaleDateString("fr-FR")}
          </div>
        )}
      </td>

      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
        {cleanPhone && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-bold border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/50 transition-colors shadow-xs"
            title="Envoyer la notification par WhatsApp"
          >
            <a
              href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5 fill-current" />
              <span>WhatsApp</span>
            </a>
          </Button>
        )}

        <Button
          variant={isPaid ? "outline" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={loading}
          className={
            isPaid
              ? "h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground border-border/80"
              : "h-8 px-3 rounded-lg text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black shadow-xs transition-all duration-150"
          }
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPaid ? (
            "Annuler"
          ) : (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Marquer Payé</span>
            </span>
          )}
        </Button>
      </td>
    </tr>
  );
}
