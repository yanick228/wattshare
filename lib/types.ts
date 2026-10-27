export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

export type Property = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  meter_id: string | null;
  created_at: string;
};

export type Tenant = {
  id: string;
  property_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  sub_meter_id: string;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  created_at: string;
};

export type Bill = {
  id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_kwh: number;
  provider: string;
  bill_reference: string | null;
  status: "draft" | "calculated" | "finalized";
  created_at: string;
};

export type MeterReading = {
  id: string;
  tenant_id: string;
  bill_id: string;
  previous_reading: number;
  current_reading: number;
  consumption: number; // Colonne calculée (current - previous)
  reading_date: string;
};

export type BillShare = {
  id: string;
  bill_id: string;
  tenant_id: string;
  consumption_kwh: number;
  consumption_percent: number;
  amount_due: number;
  payment_status: "unpaid" | "paid" | "partial";
  paid_at: string | null;
};

// Types utilitaires pour les formulaires
export type PropertyInsert = Omit<Property, "id" | "created_at">;
export type TenantInsert = Omit<Tenant, "id" | "created_at">;
export type BillInsert = Omit<Bill, "id" | "created_at">;
export type MeterReadingInsert = Omit<MeterReading, "id" | "consumption" | "reading_date">;
export type BillShareInsert = Omit<BillShare, "id" | "paid_at">;

// Types enrichis pour les vues (avec jointures)
export type BillWithShares = Bill & {
  bill_shares: (BillShare & { tenant: Tenant })[];
};

export type PropertyWithTenants = Property & {
  tenants: Tenant[];
};

// Formatage des montants en FCFA
export function formatFCFA(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))} FCFA`;
}

// Formatage des kWh
export function formatKWh(kwh: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(kwh)} kWh`;
}

// Formatage des pourcentages
export function formatPercent(percent: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent)}%`;
}
