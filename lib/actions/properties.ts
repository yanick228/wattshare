"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non autorisé");
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const meter_id = formData.get("meter_id") as string;

  if (!name) {
    throw new Error("Le nom de la propriété est requis.");
  }

  const { error } = await supabase.from("properties").insert({
    owner_id: user.id,
    name,
    address: address || null,
    meter_id: meter_id || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
}
