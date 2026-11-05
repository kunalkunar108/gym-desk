import Link from "next/link";
import { addMember } from "./actions";
import { createClient } from "@/lib/supabase/server";

type Member = {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select("id, member_code, full_name, phone, email, is_active, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,member_code.ilike.%${q}%`);
  const { data, error } = await query;
  const members = (data || []) as Member[];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div><Link href="/" className="text-sm font-medium text-blue-600">← Dashboard</Link><h1 className="mt-2 text-2xl font-bold text-slate-900">Members</h1><p className="mt-1 text-sm text-slate-500">Add, search and manage your gym members.</p></div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{members.length} members</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 p-5 sm:p-8 lg:grid-cols-[340px_1fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Add new member</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">Name and phone number are required.</p>
          <form action={addMember} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Full name<input name="full_name" required maxLength={100} placeholder="e.g. Rahul Kumar" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Phone number<input name="phone" required inputMode="tel" maxLength={20} placeholder="10-digit mobile number" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Email (optional)<input name="email" type="email" placeholder="member@email.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Gender (optional)<select name="gender" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
            <label className="block text-sm font-medium text-slate-700">Address (optional)<textarea name="address" rows={2} placeholder="Member address" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save member</button>
          </form>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">All members</h2><p className="mt-1 text-sm text-slate-500">Live records from your GymDesk database.</p></div>
            <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name, phone or ID" className="w-52 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">Search</button></form>
          </div>
          {params.success && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p>}
          {params.error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p>}
          {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : members.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center"><p className="font-semibold text-slate-700">No members found</p><p className="mt-1 text-sm text-slate-400">Add your first member using the form.</p></div> :
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="pb-3 pr-4">Member</th><th className="pb-3 pr-4">Phone</th><th className="pb-3 pr-4">Member ID</th><th className="pb-3">Status</th></tr></thead><tbody>{members.map((m) => <tr key={m.id} className="border-b border-slate-50 last:border-0"><td className="py-4 pr-4"><p className="font-semibold text-slate-800">{m.full_name}</p><p className="text-xs text-slate-400">{m.email || "No email"}</p></td><td className="py-4 pr-4 text-slate-600">{m.phone}</td><td className="py-4 pr-4 font-mono text-xs text-slate-500">{m.member_code}</td><td className="py-4"><span className={m.is_active ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"}>{m.is_active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}
