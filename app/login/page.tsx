import { Dumbbell, LockKeyhole } from "lucide-react";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><Dumbbell size={24}/></div>
          <div><h1 className="text-xl font-bold tracking-tight text-slate-900">GymDesk</h1><p className="text-sm text-slate-500">Gym management workspace</p></div>
        </div>
        <div className="mb-7"><h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to manage your gym.</p></div>
        {params.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p>}
        <form action={signIn} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Email address<input required name="email" type="email" autoComplete="email" placeholder="admin@yourgym.com" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/></label>
          <label className="block text-sm font-medium text-slate-700">Password<input required name="password" type="password" autoComplete="current-password" placeholder="Enter your password" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"/></label>
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"><LockKeyhole size={16}/> Sign in</button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">Access is limited to accounts created by your gym administrator.</p>
      </section>
    </main>
  );
}
