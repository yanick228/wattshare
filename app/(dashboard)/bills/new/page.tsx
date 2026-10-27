import { createClient } from "@/lib/supabase/server";
import { NewBillForm } from "@/components/bills/new-bill-form";


export const instant = false;

interface NewBillPageProps {
  searchParams: Promise<{ property?: string }>;
}

export default async function NewBillPage({ searchParams }: NewBillPageProps) {
  const { property: initialPropertyId } = await searchParams;
  const supabase = await createClient();

  // 1. Récupérer les propriétés
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address, meter_id")
    .order("name", { ascending: true });

  // 2. Récupérer tous les locataires actifs
  const propertyIds = properties?.map((p) => p.id) || [];
  const { data: tenants } = propertyIds.length
    ? await supabase
        .from("tenants")
        .select("id, full_name, sub_meter_id, property_id")
        .eq("is_active", true)
        .in("property_id", propertyIds)
        .order("full_name", { ascending: true })
    : { data: [] };

  // 3. Récupérer les derniers relevés pour chaque locataire afin de préremplir l'ancien index
  const tenantIds = tenants?.map((t) => t.id) || [];
  const { data: lastReadings } = tenantIds.length
    ? await supabase
        .from("meter_readings")
        .select("tenant_id, current_reading, reading_date")
        .in("tenant_id", tenantIds)
        .order("reading_date", { ascending: false })
    : { data: [] };

  const lastReadingMap = new Map<string, number>();
  lastReadings?.forEach((r) => {
    if (!lastReadingMap.has(r.tenant_id)) {
      lastReadingMap.set(r.tenant_id, Number(r.current_reading));
    }
  });

  // Associer les locataires à chaque propriété avec leur dernier index
  const formattedProperties = (properties || []).map((p) => ({
    ...p,
    tenants: (tenants || [])
      .filter((t) => t.property_id === p.id)
      .map((t) => ({
        ...t,
        last_reading: lastReadingMap.get(t.id) || 0,
      })),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nouvelle Facture d&apos;Électricité
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Saisissez les index des sous-compteurs pour ventiler automatiquement le montant entre les locataires.
        </p>
      </div>

      <NewBillForm
        properties={formattedProperties}
        initialPropertyId={initialPropertyId}
      />
    </div>
  );
}
