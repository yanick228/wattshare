import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatePropertyDialog } from "@/components/properties/create-property-dialog";
import { Building2, Users, Gauge, ArrowRight, MapPin, Sparkles, Plus } from "lucide-react";

export const instant = false;

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("*, tenants:tenants(id, is_active)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Propriétés & Maisons
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              {properties?.length || 0} gérée(s)
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Gérez vos compteurs principaux et les locataires rattachés à chaque bâtiment.
          </p>
        </div>
        <CreatePropertyDialog />
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const totalTenants = property.tenants?.length || 0;
            const activeTenants =
              property.tenants?.filter((t: { is_active: boolean }) => t.is_active).length || 0;

            return (
              <Card
                key={property.id}
                className="flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl group-hover:bg-emerald-200/60 transition-all duration-300 pointer-events-none" />

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0 transition-transform group-hover:scale-105">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant={activeTenants > 0 ? "success" : "secondary"} className="text-[11px] font-bold">
                      {activeTenants} sous-compteur(s) actif(s)
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-black text-slate-900 mt-3 tracking-tight">
                    {property.name}
                  </CardTitle>
                  {property.address ? (
                    <CardDescription className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{property.address}</span>
                    </CardDescription>
                  ) : (
                    <CardDescription className="text-xs text-slate-400/60 italic">
                      Aucune adresse précisée
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-sm">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Gauge className="h-3.5 w-3.5 text-emerald-500" />
                        Compteur Général :
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {property.meter_id || "Non renseigné"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="h-3.5 w-3.5 text-sky-500" />
                        Sous-compteurs :
                      </span>
                      <span className="font-bold text-slate-700">
                        {totalTenants} locataire(s)
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-100 pt-4 pb-5 px-6">
                  <Button
                    asChild
                    className="w-full bg-slate-50 hover:bg-emerald-500 hover:text-white text-slate-700 border border-slate-200 font-bold rounded-xl text-xs h-10 transition-all duration-200 group/btn"
                  >
                    <Link href={`/properties/${property.id}`} className="flex items-center justify-center gap-2">
                      <span>Gérer les locataires</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-20 border-dashed border-slate-300 bg-white/60">
          <CardContent className="space-y-5 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-200/60 shadow-sm">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-slate-800">
                Aucune propriété ajoutée
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ajoutez votre premier immeuble ou maison pour commencer à rattacher les résidents et leurs sous-compteurs kWh.
              </p>
            </div>
            <CreatePropertyDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
