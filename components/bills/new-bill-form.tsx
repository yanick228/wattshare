"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBillWithReadings } from "@/lib/actions/bills";
import { formatFCFA, formatKWh, formatPercent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Building2,
  Calendar,
  Receipt,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
  Sparkles,
  Gauge,
  TrendingDown,
  TrendingUp,
  Scale,
} from "lucide-react";

interface TenantData {
  id: string;
  full_name: string;
  sub_meter_id: string;
  property_id: string;
  last_reading?: number;
}

interface PropertyData {
  id: string;
  name: string;
  address: string | null;
  meter_id: string | null;
  tenants: TenantData[];
}

interface NewBillFormProps {
  properties: PropertyData[];
  initialPropertyId?: string;
}

export function NewBillForm({
  properties,
  initialPropertyId,
}: NewBillFormProps) {
  const router = useRouter();

  // 1. État de la propriété sélectionnée
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialPropertyId || (properties.length > 0 ? properties[0].id : "")
  );

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId);
  }, [properties, selectedPropertyId]);

  // 2. État des infos de la facture
  const today = new Date().toISOString().split("T")[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [periodStart, setPeriodStart] = useState(lastMonth);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [totalKwh, setTotalKwh] = useState<number | "">("");
  const [provider, setProvider] = useState("ENEO");
  const [billReference, setBillReference] = useState("");

  // 3. État des relevés de sous-compteurs par locataire
  const [readings, setReadings] = useState<
    Record<string, { previous: number; current: number }>
  >({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour les relevés si changement de propriété
  const activeTenants = selectedProperty?.tenants || [];

  const handleReadingChange = (
    tenantId: string,
    field: "previous" | "current",
    value: string
  ) => {
    const num = parseFloat(value) || 0;
    setReadings((prev) => ({
      ...prev,
      [tenantId]: {
        previous:
          field === "previous"
            ? num
            : prev[tenantId]?.previous ?? 0,
        current:
          field === "current"
            ? num
            : prev[tenantId]?.current ?? 0,
      },
    }));
  };

  // Calculs en temps réel
  const calculations = useMemo(() => {
    const tenantCalcs = activeTenants.map((t) => {
      const prev = readings[t.id]?.previous ?? (t.last_reading || 0);
      const curr = readings[t.id]?.current ?? prev;
      const conso = Math.max(0, curr - prev);
      const isValid = curr >= prev;
      return {
        tenantId: t.id,
        name: t.full_name,
        meterId: t.sub_meter_id,
        previous: prev,
        current: curr,
        conso,
        isValid,
      };
    });

    const totalSubMetersConso = tenantCalcs.reduce(
      (acc, c) => acc + c.conso,
      0
    );

    const billAmountNum = typeof totalAmount === "number" ? totalAmount : 0;
    const billKwhNum = typeof totalKwh === "number" ? totalKwh : 0;

    const tenantsWithShares = tenantCalcs.map((c) => {
      const percent =
        totalSubMetersConso > 0
          ? (c.conso / totalSubMetersConso) * 100
          : 0;
      const shareAmount =
        totalSubMetersConso > 0
          ? Math.round((c.conso / totalSubMetersConso) * billAmountNum)
          : 0;

      return {
        ...c,
        percent,
        shareAmount,
      };
    });

    const diffKwh = billKwhNum > 0 ? billKwhNum - totalSubMetersConso : 0;
    const diffPercent = billKwhNum > 0 ? (diffKwh / billKwhNum) * 100 : 0;

    return {
      tenants: tenantsWithShares,
      totalSubMetersConso,
      diffKwh,
      diffPercent,
    };
  }, [activeTenants, readings, totalAmount, totalKwh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPropertyId) {
      setError("Veuillez sélectionner une propriété.");
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError("Veuillez indiquer le montant total de la facture en FCFA.");
      return;
    }
    if (!totalKwh || Number(totalKwh) <= 0) {
      setError("Veuillez indiquer les kWh totaux du compteur principal.");
      return;
    }
    if (activeTenants.length === 0) {
      setError("Cette maison n'a pas encore de locataire. Veuillez en ajouter un d'abord.");
      return;
    }

    // Vérifier les index incohérents
    const invalidIndex = calculations.tenants.find((t) => !t.isValid);
    if (invalidIndex) {
      setError(`L'index actuel de ${invalidIndex.name} ne peut pas être inférieur à son ancien index.`);
      return;
    }

    setLoading(true);

    try {
      const readingsPayload = calculations.tenants.map((t) => ({
        tenantId: t.tenantId,
        previousReading: t.previous,
        currentReading: t.current,
      }));

      const res = await createBillWithReadings({
        propertyId: selectedPropertyId,
        periodStart,
        periodEnd,
        totalAmount: Number(totalAmount),
        totalKwh: Number(totalKwh),
        provider,
        billReference: billReference || undefined,
        readings: readingsPayload,
      });

      router.push(`/bills/${res.billId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de création de la facture");
      setLoading(false);
    }
  };

  if (properties.length === 0) {
    return (
      <Card className="text-center py-16 border-dashed border-border/80">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-foreground">
              Aucune propriété enregistrée
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vous devez créer au moins une propriété et y ajouter des locataires avant de pouvoir ventiler une facture.
            </p>
          </div>
          <Button
            onClick={() => router.push("/properties")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 font-bold rounded-xl h-10 px-5 shadow-md shadow-emerald-500/20"
          >
            Créer une propriété
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-200">
      {error && (
        <div className="flex items-center gap-3 p-4 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in zoom-in-95 duration-150">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modern Stepper Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-emerald-500/30 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
            1
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Facture Globale</p>
            <p className="text-[11px] text-muted-foreground truncate">Montant & Période</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-cyan-500/30 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/30 shrink-0">
            2
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Sous-compteurs</p>
            <p className="text-[11px] text-muted-foreground truncate">Saisie des index (kWh)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-purple-500/30 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center border border-purple-500/30 shrink-0">
            3
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Répartition Finale</p>
            <p className="text-[11px] text-muted-foreground truncate">Quotes-parts en FCFA</p>
          </div>
        </div>
      </div>

      {/* Étape 1 : Infos Facture Globale */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-foreground">
                  1. Facture du Fournisseur Principal
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Compteur ENEO
                </span>
              </div>
              <CardDescription>
                Renseignez le montant total et les kWh affichés sur votre reçu général
              </CardDescription>
            </div>
            <Receipt className="h-6 w-6 text-emerald-600/80 hidden sm:block" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Sélection Propriété */}
          <div className="space-y-1.5">
            <Label htmlFor="propertySelect" className="text-xs font-bold text-foreground">
              Maison ou Immeuble concerné *
            </Label>
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setReadings({});
              }}
              className="flex h-11 w-full rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2 text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              required
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name} {p.address ? `(${p.address})` : ""} — {p.tenants.length} locataire(s)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="totalAmount" className="text-xs font-bold text-foreground">
                Montant Total (FCFA) *
              </Label>
              <div className="relative">
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex: 50000"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                  className="font-black text-lg h-11 pl-3.5 pr-14 rounded-xl border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="totalKwh" className="text-xs font-bold text-foreground">
                Énergie Compteur Général (kWh) *
              </Label>
              <div className="relative">
                <Input
                  id="totalKwh"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 420"
                  value={totalKwh}
                  onChange={(e) =>
                    setTotalKwh(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                  className="font-black text-lg h-11 pl-3.5 pr-12 rounded-xl border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                  kWh
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="periodStart" className="text-xs font-bold text-foreground">
                Début de Période *
              </Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="h-11 rounded-xl border-border/80 bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="periodEnd" className="text-xs font-bold text-foreground">
                Fin de Période *
              </Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="h-11 rounded-xl border-border/80 bg-muted/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-xs font-bold text-foreground">
                Fournisseur d&apos;Énergie
              </Label>
              <Input
                id="provider"
                placeholder="Ex: ENEO, CIE, SBEE..."
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="billReference" className="text-xs font-bold text-foreground">
                N° de Référence / Reçu Facture (Optionnel)
              </Label>
              <Input
                id="billReference"
                placeholder="Ex: FAC-2026-0089"
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 2 : Saisie des Relevés des Locataires */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-foreground">
                  2. Relevés des Sous-compteurs
                </CardTitle>
                <Badge variant="outline" className="font-bold text-[11px] text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                  {activeTenants.length} résident(s)
                </Badge>
              </div>
              <CardDescription>
                Renseignez le nouvel index kWh de chaque résident. La quote-part et le montant en FCFA sont calculés instantanément.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeTenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider bg-muted/30 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Locataire & Compteur</th>
                    <th className="px-4 py-3.5 font-bold">Ancien Index</th>
                    <th className="px-4 py-3.5 font-bold">Nouvel Index</th>
                    <th className="px-4 py-3.5 font-bold text-center">Conso (kWh)</th>
                    <th className="px-4 py-3.5 font-bold text-center">Part (%)</th>
                    <th className="px-6 py-3.5 font-bold text-right">Montant Dû</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {calculations.tenants.map((t) => {
                    const initials = t.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={t.tenantId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                              {initials}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground text-sm">{t.name}</div>
                              <div className="text-[11px] font-mono font-medium text-emerald-600">
                                {t.meterId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 w-36">
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              defaultValue={t.previous}
                              onChange={(e) =>
                                handleReadingChange(t.tenantId, "previous", e.target.value)
                              }
                              className="h-9 rounded-xl border-border/80 bg-muted/20 text-xs font-semibold pl-3 pr-8"
                              required
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                              kWh
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 w-36">
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              defaultValue={t.current}
                              onChange={(e) =>
                                handleReadingChange(t.tenantId, "current", e.target.value)
                              }
                              className={`h-9 rounded-xl text-xs font-bold pl-3 pr-8 transition-colors ${
                                t.isValid
                                  ? "border-emerald-500/40 bg-emerald-500/5 focus-visible:ring-emerald-500/40 text-foreground"
                                  : "border-red-500/50 bg-red-500/10 focus-visible:ring-red-500/40 text-red-400"
                              }`}
                              required
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                              kWh
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center font-black text-emerald-600 text-sm">
                          {formatKWh(t.conso)}
                        </td>

                        <td className="px-4 py-4 text-center text-xs font-bold text-muted-foreground">
                          {formatPercent(t.percent)}
                        </td>

                        <td className="px-6 py-4 text-right font-black text-foreground text-base">
                          {formatFCFA(t.shareAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-foreground text-sm">Aucun locataire enregistré pour cette maison</p>
              <p className="text-xs text-muted-foreground mt-1">
                Allez dans l&apos;onglet Propriétés pour ajouter des locataires avant de continuer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Étape 3 : Jauge Dynamique de Comparaison & Récapitulatif */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-extrabold text-foreground">
                3. Équilibre & Vérification de Répartition
              </CardTitle>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Contrôle Automatique
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/70 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Sous-compteurs
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600">
                {formatKWh(calculations.totalSubMetersConso)}
              </p>
              <p className="text-[11px] text-muted-foreground">Somme réelle consommée</p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/70 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Compteur Principal ENEO
              </span>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {formatKWh(typeof totalKwh === "number" ? totalKwh : 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">Index facture générale</p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/70 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Écart (Communs / Pertes)
              </span>
              <p
                className={`text-xl sm:text-2xl font-black ${
                  calculations.diffKwh > 0
                    ? "text-amber-400"
                    : calculations.diffKwh < 0
                    ? "text-red-400"
                    : "text-emerald-600"
                }`}
              >
                {calculations.diffKwh > 0 ? "+" : ""}
                {formatKWh(calculations.diffKwh)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {calculations.diffKwh > 0
                  ? `+${calculations.diffPercent.toFixed(1)}% répartis au prorata`
                  : calculations.diffKwh === 0
                  ? "Équilibre parfait (0 écart)"
                  : "Attention : sous-compteurs > général"}
              </p>
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="space-y-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Couverture du Compteur Général :</span>
              <span className="text-emerald-600">
                {typeof totalKwh === "number" && totalKwh > 0
                  ? `${Math.min(100, Math.round((calculations.totalSubMetersConso / totalKwh) * 100))}%`
                  : "0%"}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    typeof totalKwh === "number" && totalKwh > 0
                      ? Math.min(100, (calculations.totalSubMetersConso / totalKwh) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 p-6 bg-card/60">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Tous les calculs en FCFA sont instantanés et proportionnels.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl font-bold text-xs h-11 px-5 border-border/80 w-1/2 sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs sm:text-sm h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 w-1/2 sm:w-auto"
              disabled={loading || activeTenants.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul & Génération...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Valider & Générer la Facture</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
