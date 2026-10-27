import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTenantDialog } from "@/components/properties/create-tenant-dialog";
import { TenantRowActions } from "@/components/properties/tenant-row-actions";
import {
  ArrowLeft,
  Building2,
  Gauge,
  MapPin,
  Users,
  Phone,
  Mail,
  Calendar,
  Receipt,
  PlusCircle,
  Sparkles,
} from "lucide-react";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Récupérer la propriété
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) {
    notFound();
  }

  // 2. Récupérer les locataires
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: true });

  const activeTenants = tenants?.filter((t) => t.is_active) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
          <Link href="/properties" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Toutes les propriétés</span>
          </Link>
        </Button>
      </div>

      {/* Property Overview Card */}
      <Card className="relative overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0 shadow-md">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {property.name}
                </h1>
                <Badge variant={activeTenants.length > 0 ? "success" : "secondary"} className="text-[11px] font-bold">
                  {activeTenants.length} actif(s)
                </Badge>
              </div>
              {property.address && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{property.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold rounded-xl text-xs h-10 px-4 shadow-md shadow-emerald-500/20"
            >
              <Link href={`/bills/new?property=${property.id}`} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>Créer une facture pour cette maison</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold">Compteur Principal</p>
              <p className="font-mono font-bold text-foreground text-sm">
                {property.meter_id || "Non spécifié"}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold">Sous-compteurs Actifs</p>
              <p className="font-bold text-foreground text-sm">
                {activeTenants.length} sur {tenants?.length || 0} résident(s)
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold">Date d&apos;enregistrement</p>
              <p className="font-bold text-foreground text-sm">
                {new Date(property.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tenants Management Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-extrabold text-foreground">
              Locataires & Sous-compteurs rattachés
            </CardTitle>
            <CardDescription>
              Liste des résidents disposant d&apos;un sous-compteur individuel dans cette propriété
            </CardDescription>
          </div>
          <CreateTenantDialog propertyId={property.id} />
        </CardHeader>
        <CardContent className="p-0">
          {tenants && tenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider bg-muted/30 text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Nom du Locataire</th>
                    <th className="px-6 py-3.5 font-bold">N° Sous-compteur</th>
                    <th className="px-6 py-3.5 font-bold">Coordonnées</th>
                    <th className="px-6 py-3.5 font-bold">Date d&apos;entrée</th>
                    <th className="px-6 py-3.5 font-bold">Statut</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenants.map((tenant) => {
                    const initials = (tenant.full_name || "L")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={tenant.id}
                        className={`transition-colors ${
                          tenant.is_active ? "hover:bg-muted/20" : "opacity-50 bg-muted/10"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                              {initials}
                            </div>
                            <span className="font-bold text-foreground text-sm">
                              {tenant.full_name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-emerald-700 border border-slate-200">
                            {tenant.sub_meter_id}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground space-y-0.5">
                          {tenant.phone ? (
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <Phone className="h-3 w-3 text-emerald-600" />
                              <span>{tenant.phone}</span>
                            </div>
                          ) : null}
                          {tenant.email ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{tenant.email}</span>
                            </div>
                          ) : null}
                          {!tenant.phone && !tenant.email && (
                            <span className="text-muted-foreground/60 italic">Non renseigné</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                          {new Date(tenant.move_in_date).toLocaleDateString("fr-FR")}
                        </td>

                        <td className="px-6 py-4">
                          <Badge
                            variant={tenant.is_active ? "success" : "secondary"}
                            className="font-bold text-[11px]"
                          >
                            {tenant.is_active ? "Actif" : "Sorti"}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <TenantRowActions
                            tenantId={tenant.id}
                            propertyId={property.id}
                            isActive={tenant.is_active}
                            tenantName={tenant.full_name}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-bold text-foreground text-sm">Aucun locataire enregistré pour cette maison</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                Ajoutez chaque locataire avec son numéro de sous-compteur pour pouvoir ventiler vos factures.
              </p>
              <CreateTenantDialog propertyId={property.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
