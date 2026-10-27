"use client";

import { useState } from "react";
import { createProperty } from "@/lib/actions/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Loader2, X, Sparkles } from "lucide-react";

export function CreatePropertyDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await createProperty(formData);
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-2 rounded-xl h-10 px-4 transition-all duration-200 hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        <span>Ajouter une propriété</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/80 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5 text-foreground font-extrabold text-lg">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <span>Nouvelle Propriété</span>
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
                <Label htmlFor="name" className="text-xs font-bold text-foreground">
                  Nom de la maison ou de l&apos;immeuble *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Villa Bonapriso, Résidence Akwa..."
                  required
                  disabled={loading}
                  className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-bold text-foreground">
                  Adresse ou Quartier
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Ex: Douala, Rue des Palmiers..."
                  disabled={loading}
                  className="rounded-xl h-10 border-border/80 bg-muted/20 focus-visible:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meter_id" className="text-xs font-bold text-foreground">
                  N° Compteur Principal (ENEO / Fournisseur)
                </Label>
                <Input
                  id="meter_id"
                  name="meter_id"
                  placeholder="Ex: ENEO-8849201"
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
                      Création...
                    </>
                  ) : (
                    "Enregistrer la maison"
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
