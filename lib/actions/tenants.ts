"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTenant(formData: FormData) {
  const supabase = await createClient();

  const property_id = formData.get("property_id") as string;
  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const sub_meter_id = formData.get("sub_meter_id") as string;
  const move_in_date = (formData.get("move_in_date") as string) || new Date().toISOString().split("T")[0];

  if (!property_id || !full_name || !sub_meter_id) {
    throw new Error("Veuillez renseigner le nom et le numéro de sous-compteur.");
  }

  const { error } = await supabase.from("tenants").insert({
    property_id,
    full_name,
    phone: phone || null,
    email: email || null,
    sub_meter_id,
    move_in_date,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${property_id}`);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

export async function toggleTenantStatus(tenantId: string, propertyId: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tenants")
    .update({
      is_active: !currentStatus,
      move_out_date: currentStatus ? new Date().toISOString().split("T")[0] : null,
    })
    .eq("id", tenantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}

export async function deleteTenant(tenantId: string, propertyId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}
