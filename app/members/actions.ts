"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addMember(formData: FormData) {
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const gender = String(formData.get("gender") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!full_name || !phone) redirect("/members?error=Name%20and%20phone%20are%20required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member_code = `GD-${Date.now().toString().slice(-8)}`;
  const { error } = await supabase.from("members").insert({
    member_code,
    full_name,
    phone,
    email: email || null,
    gender: gender || null,
    address: address || null,
  });

  if (error) redirect(`/members?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/members");
  revalidatePath("/");
  redirect("/members?success=Member%20added%20successfully");
}
