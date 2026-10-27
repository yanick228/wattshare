"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TenantReadingInput {
  tenantId: string;
  previousReading: number;
  currentReading: number;
}

export interface CreateBillPayload {
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number; // En FCFA
  totalKwh: number;    // Compteur principal ENEO
  provider?: string;
  billReference?: string;
  readings: TenantReadingInput[];
}

export async function createBillWithReadings(payload: CreateBillPayload) {
  const supabase = await createClient();

  const {
    propertyId,
    periodStart,
    periodEnd,
    totalAmount,
    totalKwh,
    provider = "ENEO",
    billReference,
    readings,
  } = payload;

  if (!propertyId || !periodStart || !periodEnd || !totalAmount || !totalKwh) {
    throw new Error("Veuillez renseigner tous les champs obligatoires de la facture.");
  }

  if (!readings || readings.length === 0) {
    throw new Error("Au moins un relevé de locataire est nécessaire.");
  }

  // 1. Calculer les consommations individuelles
  const tenantCalculations = readings.map((r) => {
    const consumption = Math.max(0, r.currentReading - r.previousReading);
    return {
      tenantId: r.tenantId,
      previousReading: r.previousReading,
      currentReading: r.currentReading,
      consumption,
    };
  });

  const totalSubMetersKwh = tenantCalculations.reduce(
    (acc, curr) => acc + curr.consumption,
    0
  );

  // 2. Insérer la facture
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      property_id: propertyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: totalAmount,
      total_kwh: totalKwh,
      provider,
      bill_reference: billReference || null,
      status: "calculated",
    })
    .select("id")
    .single();

  if (billError || !bill) {
    throw new Error(billError?.message || "Erreur lors de la création de la facture");
  }

  const billId = bill.id;

  // 3. Insérer les relevés de compteurs
  const meterReadingsRows = tenantCalculations.map((c) => ({
    bill_id: billId,
    tenant_id: c.tenantId,
    previous_reading: c.previousReading,
    current_reading: c.currentReading,
  }));

  const { error: readingsError } = await supabase
    .from("meter_readings")
    .insert(meterReadingsRows);

  if (readingsError) {
    throw new Error(readingsError.message);
  }

  // 4. Insérer les parts de facture (bill_shares)
  const billSharesRows = tenantCalculations.map((c) => {
    const percent =
      totalSubMetersKwh > 0
        ? Number(((c.consumption / totalSubMetersKwh) * 100).toFixed(2))
        : 0;

    const amountDue =
      totalSubMetersKwh > 0
        ? Math.round((c.consumption / totalSubMetersKwh) * totalAmount)
        : 0;

    return {
      bill_id: billId,
      tenant_id: c.tenantId,
      consumption_kwh: c.consumption,
      consumption_percent: percent,
      amount_due: amountDue,
      payment_status: "unpaid" as const,
    };
  });

  const { error: sharesError } = await supabase
    .from("bill_shares")
    .insert(billSharesRows);

  if (sharesError) {
    throw new Error(sharesError.message);
  }

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return { billId };
}

export async function togglePaymentStatus(shareId: string, currentStatus: "unpaid" | "paid" | "partial", billId: string) {
  const supabase = await createClient();

  const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
  const paidAt = newStatus === "paid" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("bill_shares")
    .update({
      payment_status: newStatus,
      paid_at: paidAt,
    })
    .eq("id", shareId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/bills/${billId}`);
  revalidatePath(`/share/${billId}`);
  revalidatePath("/bills");
  revalidatePath("/dashboard");
}

export async function deleteBill(billId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("bills").delete().eq("id", billId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/bills");
  revalidatePath("/dashboard");
}
