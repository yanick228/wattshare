"use client";

import { useState } from "react";
import { createTenant } from "@/lib/actions/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, Loader2, X, Gauge } from "lucide-react";

interface CreateTenantDialogProps {
  propertyId: string;
}

export function CreateTenantDialog({ propertyId }: CreateTenantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("property_id", propertyId);

    try {
      await createTenant(formData);
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-2 rounded-xl text-xs h-9 px-4 transition-all duration-200 hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        <span>Ajouter un locataire</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/80 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5 text-foreground font-extrabold text-lg">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                  <UserPlus className="h-5 w-5" />
                </div>
                <span>Nouveau Locataire</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-bold text-foreground">
                  Nom complet du locataire *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Ex: Alain Nkono"
                  required
                  disabled={loading}
                  className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sub_meter_id" className="text-xs font-bold text-foreground">
                    N° ou Réf. du Sous-compteur *
                  </Label>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Sous-compteur
                  </span>
                </div>
                <Input
                  id="sub_meter_id"
                  name="sub_meter_id"
                  placeholder="Ex: SC-01 (Chambre 2), CPT-104..."
                  required
                  disabled={loading}
                  className="rounded-xl h-10 border-border/80 bg-muted/20 font-mono text-sm focus-visible:ring-emerald-500/40"
                />
                <p className="text-[11px] text-muted-foreground">
                  Référence physique gravée sur le sous-compteur individuel
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-foreground">
                    Téléphone (WhatsApp)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Ex: +237 699 00 00 00"
                    disabled={loading}
                    className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="move_in_date" className="text-xs font-bold text-foreground">
                    Date d&apos;entrée
                  </Label>
                  <Input
                    id="move_in_date"
                    name="move_in_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    disabled={loading}
                    className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-foreground">
                  E-mail (facultatif)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="locataire@exemple.com"
                  disabled={loading}
                  className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="rounded-xl font-semibold text-xs h-10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold rounded-xl text-xs h-10 px-5 shadow-md shadow-emerald-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Ajouter le locataire"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
