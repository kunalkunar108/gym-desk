# GymDesk

Single-gym management software built with Next.js, TypeScript, Tailwind CSS and Supabase.

## MVP scope
- Admin and staff authentication with role-based access
- Member records and membership plans
- Membership renewals and expiry tracking
- Phone-number based attendance check-in
- Payment records and printable receipts
- Basic operational reports and gym settings

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable/anon key.

## Database
Apply `supabase/migrations/0001_initial_schema.sql` to a new Supabase project. The first account registered is assigned the admin role; subsequent accounts are staff. Review and change this bootstrap policy before public launch.

## Current status
The initial light-theme dashboard scaffold and database schema are committed. Dashboard figures and activity are illustrative UI placeholders and are not connected to live data yet.
