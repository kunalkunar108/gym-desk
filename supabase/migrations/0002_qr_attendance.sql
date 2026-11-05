-- GymDesk QR attendance support
-- QR values are random UUID tokens, not member IDs or personal data.

alter table public.members
  add column if not exists qr_token uuid not null default gen_random_uuid();

create unique index if not exists members_qr_token_uidx
  on public.members(qr_token);

create or replace function public.check_in_member_by_qr(p_qr_token uuid)
returns table (
  outcome text,
  member_id uuid,
  member_name text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members%rowtype;
  v_existing public.attendance%rowtype;
  v_checkin public.attendance%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_app_role() not in ('admin', 'staff') then
    raise exception 'Not authorized';
  end if;

  select * into v_member
  from public.members
  where qr_token = p_qr_token;

  if not found then
    return query select 'invalid_qr'::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_member.id::text, 0));

  if not v_member.is_active then
    return query select 'inactive_member'::text, v_member.id, v_member.full_name, null::timestamptz;
    return;
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.member_id = v_member.id
      and m.status = 'active'
      and m.start_date <= (now() at time zone 'Asia/Kolkata')::date
      and m.end_date >= (now() at time zone 'Asia/Kolkata')::date
  ) then
    return query select 'membership_expired'::text, v_member.id, v_member.full_name, null::timestamptz;
    return;
  end if;

  select * into v_existing
  from public.attendance a
  where a.member_id = v_member.id
    and (a.checked_in_at at time zone 'Asia/Kolkata')::date =
        (now() at time zone 'Asia/Kolkata')::date
  order by a.checked_in_at desc
  limit 1;

  if found then
    return query select 'already_checked_in'::text, v_member.id, v_member.full_name, v_existing.checked_in_at;
    return;
  end if;

  insert into public.attendance (member_id, checked_in_at, checked_in_by, notes)
  values (v_member.id, now(), auth.uid(), 'QR check-in')
  returning * into v_checkin;

  return query select 'checked_in'::text, v_member.id, v_member.full_name, v_checkin.checked_in_at;
end;
$$;

revoke all on function public.check_in_member_by_qr(uuid) from public;
grant execute on function public.check_in_member_by_qr(uuid) to authenticated;
