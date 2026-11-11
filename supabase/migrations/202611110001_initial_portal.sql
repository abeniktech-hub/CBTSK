create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('APPLICANT', 'REGISTRAR', 'ADMIN');
create type public.application_status as enum ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADMITTED', 'WAITLISTED', 'REJECTED');
create type public.matricule_status as enum ('PROVISIONAL', 'CONFIRMED');
create type public.step_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');
create type public.quote_status as enum ('DRAFT', 'APPROVED', 'ARCHIVED');
create type public.exam_status as enum ('NOT_SCHEDULED', 'SCHEDULED', 'DONE');
create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  role public.app_role not null default 'APPLICANT',
  lang text not null default 'en' check (lang in ('en', 'fr')),
  quote_categories text[] not null default array['biblical','theological','educational','moral','ministry/mission'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{2,6}$'),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  level text not null check (length(trim(level)) between 1 and 80),
  name text not null,
  department text not null default '',
  active boolean not null default true,
  required_referees text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (level, name, department)
);

create table public.admission_cycles (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ministry_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programme_document_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_level text not null,
  document_kind text not null,
  required boolean not null default true,
  requires_married boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(programme_level,document_kind,requires_married)
);

create table public.matricule_counters (
  year integer not null,
  campus_code text not null,
  last_seq integer not null default 0 check (last_seq >= 0),
  primary key (year, campus_code)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete set null,
  programme_id uuid references public.programmes(id) on delete set null,
  matricule text not null unique,
  matricule_status public.matricule_status not null default 'PROVISIONAL',
  matricule_confirmed_at timestamptz,
  matricule_confirmed_by uuid references public.profiles(id) on delete set null,
  status public.application_status not null default 'DRAFT',
  exam_score numeric(5,2),
  exam_status public.exam_status not null default 'NOT_SCHEDULED',
  exam_date date,
  exam_venue text,
  payment_status public.payment_status not null default 'PENDING',
  department text not null default '',
  year_of_entry integer,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_user_status_idx on public.applications(user_id, status);
create index applications_matricule_idx on public.applications(matricule);

create table public.step_progress (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  step_key text not null check (step_key in ('pick_course','personal_information','education','referees','credential_uploads','payment','entrance_exam','ministerial_interest','marital_status','pledge','christian_experience','finance','medical_clearance')),
  status public.step_status not null default 'NOT_STARTED',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (application_id, step_key)
);
create index step_progress_app_status_idx on public.step_progress(application_id,status);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  institution text not null,
  qualification text not null,
  year integer not null,
  grade text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index education_application_idx on public.education(application_id);

create table public.referees (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING','RECEIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index referees_application_status_idx on public.referees(application_id,status);

create table public.referee_responses (
  id uuid primary key default gen_random_uuid(),
  referee_id uuid not null unique references public.referees(id) on delete cascade,
  recommendation jsonb not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referee_invites (
  id uuid primary key default gen_random_uuid(),
  referee_id uuid not null references public.referees(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  scan_status text not null default 'PENDING' check (scan_status in ('PENDING','CLEAN','REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_application_kind_idx on public.documents(application_id,kind);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  programme_level text not null unique,
  amount bigint not null check (amount >= 0),
  currency text not null default 'CFA' check (currency = 'CFA'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  fee_id uuid not null references public.fees(id) on delete restrict,
  amount bigint not null check (amount >= 0),
  currency text not null default 'CFA',
  provider text not null,
  provider_reference text unique,
  provider_checkout_url text,
  status public.payment_status not null default 'PENDING',
  verified_at timestamptz,
  receipt_number text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_application_status_idx on public.payments(application_id,status);
create unique index payments_one_pending_per_application_idx on public.payments(application_id) where status='PENDING';

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author text,
  source text not null,
  translation text,
  category text not null check (category in ('biblical','theological','educational','moral','ministry/mission')),
  lang text not null default 'en' check (lang in ('en','fr')),
  rights_note text not null default '',
  status public.quote_status not null default 'DRAFT',
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotes_approved_category_lang_idx on public.quotes(status,category,lang);

create table public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  quote_id uuid references public.quotes(id) on delete set null,
  quote_seen_at timestamptz,
  shown_quote_ids uuid[] not null default '{}'
);
create index login_events_user_recent_idx on public.login_events(user_id,created_at desc);
create index login_events_user_quote_idx on public.login_events(user_id,quote_id);

create table public.quote_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,quote_id)
);

create table public.matricule_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  old_value text not null,
  new_value text not null unique,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  changed_at timestamptz not null default now()
);
create index matricule_history_old_value_idx on public.matricule_history(old_value);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_created_idx on public.audit_log(entity_type,entity_id,created_at desc);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null check (kind in ('SUBMISSION_CONFIRMATION')),
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','SENT')),
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id,kind)
);

create table public.verification_resend_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_sent_at timestamptz not null
);

create table public.portal_settings (
  key text primary key,
  value text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['profiles','campuses','programmes','admission_cycles','ministry_areas','programme_document_requirements','matricule_counters','applications','step_progress','education','referees','referee_responses','referee_invites','documents','fees','payments','quotes','login_events','quote_favorites','matricule_history','audit_log','email_outbox','verification_resend_limits','portal_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (p.role = required_role or p.role = 'ADMIN')
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer
set search_path = '' as $$
  select public.has_role('REGISTRAR') or public.has_role('ADMIN');
$$;
revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_staff() to authenticated;

create or replace function public.next_matricule(campus text default 'GEN')
returns text language plpgsql security definer
set search_path = '' as $$
declare
  yy integer := (extract(year from now())::integer % 100);
  seq integer;
begin
  insert into public.matricule_counters(year,campus_code,last_seq)
  values (yy,campus,1)
  on conflict (year,campus_code)
  do update set last_seq = public.matricule_counters.last_seq + 1
  returning last_seq into seq;
  return format('CBTS/%s/%s/%s', lpad(yy::text,2,'0'), campus, lpad(seq::text,4,'0'));
end;
$$;
revoke all on function public.next_matricule(text) from public, anon, authenticated;

create or replace function public.create_applicant_records()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles(id,first_name,last_name,phone,role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'),''),'Applicant'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'),''),''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    'APPLICANT'
  );
  insert into public.applications(user_id,matricule,matricule_status,status)
  values (new.id,public.next_matricule('GEN'),'PROVISIONAL','DRAFT');
  return new;
end;
$$;
create trigger on_auth_user_created_cbts
  after insert on auth.users
  for each row execute function public.create_applicant_records();

create or replace function public.protect_application_columns()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and current_user <> 'postgres' and (
    new.matricule is distinct from old.matricule or
    new.matricule_status is distinct from old.matricule_status or
    new.matricule_confirmed_at is distinct from old.matricule_confirmed_at or
    new.matricule_confirmed_by is distinct from old.matricule_confirmed_by or
    new.status is distinct from old.status or
    new.exam_score is distinct from old.exam_score or
    new.exam_status is distinct from old.exam_status or
    new.exam_date is distinct from old.exam_date or
    new.exam_venue is distinct from old.exam_venue or
    new.payment_status is distinct from old.payment_status or
    new.submitted_at is distinct from old.submitted_at
  ) then
    raise exception 'Protected application fields cannot be changed by applicants' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger protect_application_columns
  before update on public.applications
  for each row execute function public.protect_application_columns();

create or replace function public.protect_step_completion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and current_user <> 'postgres' and not public.is_staff() then
    if tg_op='UPDATE' then
      if new.status='COMPLETE' or old.status='COMPLETE' then
        raise exception 'Step completion is server-validated' using errcode='42501';
      end if;
    elsif new.status='COMPLETE' then
      raise exception 'Step completion is server-validated' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger protect_step_completion before insert or update on public.step_progress
  for each row execute function public.protect_step_completion();

create or replace function public.protect_profile_role()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and current_user <> 'postgres' and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by applicants' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger protect_profile_role before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.audit_privileged_action(
  p_action text, p_entity_type text, p_entity_id uuid, p_details jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log(actor_id,action,entity_type,entity_id,details)
  values ((select auth.uid()),p_action,p_entity_type,p_entity_id,coalesce(p_details,'{}'::jsonb));
$$;
revoke all on function public.audit_privileged_action(text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.complete_application_step(
  p_application_id uuid, p_step_key text, p_data jsonb
)
returns void language plpgsql security definer
set search_path = '' as $$
declare
  owns_application boolean;
  app_row record;
  required_referee text;
begin
  select a.id,a.user_id,a.status,a.programme_id,a.campus_id
    into app_row from public.applications a
    where a.id=p_application_id and a.user_id=(select auth.uid()) and a.status='DRAFT'
    for update;
  owns_application := found;
  if not owns_application then
    raise exception 'Application not available' using errcode='42501';
  end if;

  if p_step_key not in ('pick_course','personal_information','education','referees','credential_uploads','payment','entrance_exam','ministerial_interest','marital_status','pledge','christian_experience','finance','medical_clearance') then
    raise exception 'Unknown application step' using errcode='22023';
  end if;
  if jsonb_typeof(p_data) <> 'object' then
    raise exception 'Step data must be an object' using errcode='22023';
  end if;

  if p_step_key = 'pick_course' and (
    nullif(p_data->>'campus_id','') is null or nullif(p_data->>'programme_id','') is null or
    nullif(p_data->>'department','') is null or nullif(p_data->>'year_of_entry','') is null
  ) then raise exception 'Course selection is incomplete' using errcode='22023'; end if;
  if p_step_key='pick_course' and not exists(
    select 1 from public.campuses c
    cross join public.programmes pr
    join public.admission_cycles cy on cy.year=(p_data->>'year_of_entry')::integer and cy.active
    where c.id=(p_data->>'campus_id')::uuid and c.active
      and pr.id=(p_data->>'programme_id')::uuid and pr.active
      and pr.level=p_data->>'programme_level' and pr.department=p_data->>'department'
  ) then raise exception 'Select an active campus, programme and entry year' using errcode='22023'; end if;
  if p_step_key = 'personal_information' and (
    nullif(p_data->>'first_name','') is null or nullif(p_data->>'last_name','') is null or
    nullif(p_data->>'date_of_birth','') is null or nullif(p_data->>'nationality','') is null or
    nullif(p_data->>'gender','') is null or nullif(p_data->>'id_card_number','') is null or
    nullif(p_data->>'address','') is null or nullif(p_data->>'phone','') is null or
    nullif(p_data->>'emergency_contact','') is null
  ) then raise exception 'Personal information is incomplete' using errcode='22023'; end if;
  if p_step_key = 'education' and (
    jsonb_typeof(p_data->'entries') <> 'array' or jsonb_array_length(coalesce(p_data->'entries','[]'::jsonb)) = 0 or
    exists(select 1 from jsonb_array_elements(coalesce(p_data->'entries','[]'::jsonb)) x
      where nullif(x->>'institution','') is null or nullif(x->>'qualification','') is null or
      nullif(x->>'year','') is null or nullif(x->>'grade','') is null)
  ) then raise exception 'Education entries are incomplete' using errcode='22023'; end if;
  if p_step_key = 'referees' and (
    jsonb_typeof(p_data->'referees') <> 'array' or jsonb_array_length(coalesce(p_data->'referees','[]'::jsonb)) = 0 or
    exists(select 1 from jsonb_array_elements(coalesce(p_data->'referees','[]'::jsonb)) x
      where nullif(x->>'kind','') is null or nullif(x->>'name','') is null or
      nullif(x->>'email','') is null or nullif(x->>'phone','') is null)
  ) then raise exception 'Referee entries are incomplete' using errcode='22023'; end if;
  if p_step_key='referees' then
    for required_referee in
      select unnest(coalesce(pr.required_referees,'{}'::text[]))
      from public.programmes pr where pr.id=app_row.programme_id
    loop
      if not exists(select 1 from jsonb_array_elements(p_data->'referees') item where item->>'kind'=required_referee) then
        raise exception 'A required referee is missing' using errcode='22023';
      end if;
    end loop;
  end if;
  if p_step_key = 'ministerial_interest' and (
    jsonb_typeof(p_data->'areas') <> 'array' or jsonb_array_length(coalesce(p_data->'areas','[]'::jsonb)) = 0
  ) then raise exception 'Select at least one ministry area' using errcode='22023'; end if;
  if p_step_key = 'marital_status' and nullif(p_data->>'status','') is null then
    raise exception 'Marital status is required' using errcode='22023';
  end if;
  if p_step_key='marital_status' and p_data->>'status'='Married' and nullif(p_data->>'spouse_name','') is null then
    raise exception 'Spouse name is required when married' using errcode='22023';
  end if;
  if p_step_key = 'christian_experience' and (
    nullif(p_data->>'testimony','') is null or nullif(p_data->>'call_to_ministry','') is null or
    nullif(p_data->>'church','') is null or nullif(p_data->>'pastor','') is null or
    nullif(p_data->>'years','') is null or nullif(p_data->>'baptism','') is null
  ) then raise exception 'Christian experience details are incomplete' using errcode='22023'; end if;
  if p_step_key = 'finance' and nullif(p_data->>'source','') is null then
    raise exception 'Funding source is required' using errcode='22023';
  end if;
  if p_step_key = 'payment' and not exists(
    select 1 from public.payments pay where pay.application_id=p_application_id and pay.status='PAID'
  ) then raise exception 'Verified payment is required' using errcode='22023'; end if;
  if p_step_key = 'credential_uploads' and exists(
    select 1
    from public.applications a
    join public.programmes pr on pr.id=a.programme_id
    join public.programme_document_requirements r on r.programme_level=pr.level and r.required
      and (not r.requires_married or exists(
        select 1 from public.step_progress ms
        where ms.application_id=a.id and ms.step_key='marital_status' and ms.data->>'status'='Married'
      ))
    where a.id=p_application_id and not exists(
      select 1 from public.documents d
      where d.application_id=a.id and d.kind=r.document_kind and d.scan_status='CLEAN'
    )
  ) then raise exception 'Required cleared documents are missing' using errcode='22023'; end if;
  if p_step_key='entrance_exam' then
    raise exception 'Entrance exam status is maintained by authorized staff' using errcode='42501';
  end if;
  if p_step_key = 'medical_clearance' and not exists(
    select 1 from public.documents d where d.application_id=p_application_id and d.kind='medical_form' and d.scan_status='CLEAN'
  ) then raise exception 'A cleared medical form is required' using errcode='22023'; end if;
  if p_step_key = 'pledge' then
    p_data := p_data || jsonb_build_object(
      'signed_at',now(),
      'signature_ip',coalesce((nullif(current_setting('request.headers',true),'')::jsonb->>'x-forwarded-for'),'')
    );
  end if;

  if p_step_key='pick_course' then
    update public.applications set campus_id=(p_data->>'campus_id')::uuid,
      programme_id=(p_data->>'programme_id')::uuid,department=p_data->>'department',
      year_of_entry=(p_data->>'year_of_entry')::integer where id=p_application_id;
  elsif p_step_key='personal_information' then
    update public.profiles set first_name=p_data->>'first_name',last_name=p_data->>'last_name',
      phone=p_data->>'phone' where id=app_row.user_id;
  elsif p_step_key='education' then
    delete from public.education where application_id=p_application_id;
    insert into public.education(application_id,institution,qualification,year,grade)
      select p_application_id,item->>'institution',item->>'qualification',(item->>'year')::integer,item->>'grade'
      from jsonb_array_elements(p_data->'entries') item;
  elsif p_step_key='referees' then
    delete from public.referees where application_id=p_application_id;
    insert into public.referees(application_id,kind,name,email,phone)
      select p_application_id,item->>'kind',item->>'name',item->>'email',item->>'phone'
      from jsonb_array_elements(p_data->'referees') item;
  end if;
  if p_step_key = 'pledge' and (coalesce(p_data->>'agreed','false') <> 'true' or nullif(trim(p_data->>'signature'),'') is null) then
    raise exception 'Pledge agreement is required' using errcode='22023';
  end if;

  insert into public.step_progress(application_id,step_key,status,data)
  values (p_application_id,p_step_key,'COMPLETE',p_data)
  on conflict (application_id,step_key)
  do update set status='COMPLETE',data=excluded.data,updated_at=now();
end;
$$;
revoke all on function public.complete_application_step(uuid,text,jsonb) from public, anon;
grant execute on function public.complete_application_step(uuid,text,jsonb) to authenticated;

create or replace function public.record_login_and_pick_quote()
returns public.quotes language plpgsql security definer
set search_path = '' as $$
declare
  selected_quote public.quotes;
  event_id uuid;
  preferred text[];
  language_code text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select p.quote_categories,p.lang into preferred,language_code
    from public.profiles p where p.id=(select auth.uid());
  insert into public.login_events(user_id) values ((select auth.uid())) returning id into event_id;

  select q.* into selected_quote
  from public.quotes q
  where q.status='APPROVED' and q.lang=coalesce(language_code,'en')
    and q.category = any(coalesce(preferred,array['biblical']))
    and q.id not in (
      select shown.quote_id from (
        select unnest(le.shown_quote_ids) as quote_id
        from public.login_events le
        where le.user_id=(select auth.uid())
        order by le.created_at desc limit 20
      ) shown
    )
  order by random() limit 1;

  if selected_quote.id is null then
    select q.* into selected_quote
    from public.quotes q
    where q.status='APPROVED' and q.lang=coalesce(language_code,'en')
      and q.category = any(coalesce(preferred,array['biblical']))
    order by (
      select max(le.created_at) from public.login_events le
      where le.user_id=(select auth.uid()) and q.id=any(le.shown_quote_ids)
    ) asc nulls first
    limit 1;
  end if;

  if selected_quote.id is not null then
    update public.login_events set quote_id=selected_quote.id,shown_quote_ids=array[selected_quote.id],quote_seen_at=now() where id=event_id;
  end if;
  return selected_quote;
end;
$$;
revoke all on function public.record_login_and_pick_quote() from public, anon;
grant execute on function public.record_login_and_pick_quote() to authenticated;

create or replace function public.pick_another_login_quote()
returns public.quotes language plpgsql security definer
set search_path = '' as $$
declare
  picked public.quotes;
  recent_quotes uuid[];
  categories text[];
  language_code text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select quote_categories,lang into categories,language_code from public.profiles where id=(select auth.uid());
  select shown_quote_ids into recent_quotes from public.login_events
    where user_id=(select auth.uid()) order by created_at desc limit 1;
  if coalesce(cardinality(recent_quotes),0)>=4 then return picked; end if;
  select q.* into picked from public.quotes q
    where q.status='APPROVED' and q.lang=coalesce(language_code,'en')
      and q.category=any(coalesce(categories,array['biblical']))
      and not (q.id=any(coalesce(recent_quotes,'{}'::uuid[])))
    order by random() limit 1;
  if picked.id is not null then
    update public.login_events set quote_id=picked.id,shown_quote_ids=array_append(coalesce(shown_quote_ids,'{}'::uuid[]),picked.id),quote_seen_at=now()
      where id=(select id from public.login_events where user_id=(select auth.uid()) order by created_at desc limit 1);
  end if;
  return picked;
end;
$$;
revoke all on function public.pick_another_login_quote() from public, anon;
grant execute on function public.pick_another_login_quote() to authenticated;

create or replace function public.admin_change_matricule(
  p_application_id uuid,p_new_matricule text,p_reason text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  old_number text;
  pattern text;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'A reason is required' using errcode='22023'; end if;
  select value into pattern from public.portal_settings where key='matricule_regex';
  pattern := coalesce(pattern,'^CBTS/[0-9]{2}/[A-Z0-9]{2,6}/[0-9]{4,}$');
  if p_new_matricule !~ pattern then raise exception 'Matricule format is invalid' using errcode='22023'; end if;
  select matricule into old_number from public.applications where id=p_application_id for update;
  if old_number is null then raise exception 'Application not found' using errcode='P0002'; end if;
  update public.applications set matricule=p_new_matricule,matricule_status='CONFIRMED',
    matricule_confirmed_at=now(),matricule_confirmed_by=(select auth.uid())
    where id=p_application_id;
  insert into public.matricule_history(application_id,old_value,new_value,changed_by,reason)
    values(p_application_id,old_number,p_new_matricule,(select auth.uid()),p_reason);
  perform public.audit_privileged_action('matricule.change','application',p_application_id,
    jsonb_build_object('old',old_number,'new',p_new_matricule,'reason',p_reason));
end;
$$;
revoke all on function public.admin_change_matricule(uuid,text,text) from public, anon;
grant execute on function public.admin_change_matricule(uuid,text,text) to authenticated;

create or replace function public.admin_set_application_status(p_application_id uuid,p_status public.application_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  update public.applications set status=p_status,submitted_at=case when p_status='SUBMITTED' then now() else submitted_at end
    where id=p_application_id;
  perform public.audit_privileged_action('application.status','application',p_application_id,jsonb_build_object('status',p_status));
end;
$$;
revoke all on function public.admin_set_application_status(uuid,public.application_status) from public, anon;
grant execute on function public.admin_set_application_status(uuid,public.application_status) to authenticated;

create or replace function public.admin_update_exam(
  p_application_id uuid,p_score numeric,p_exam_status public.exam_status,p_exam_date date,p_exam_venue text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if p_score is not null and (p_score < 0 or p_score > 100) then raise exception 'Exam score must be between 0 and 100' using errcode='22023'; end if;
  update public.applications set exam_score=p_score,exam_status=p_exam_status,exam_date=p_exam_date,exam_venue=p_exam_venue
    where id=p_application_id;
  insert into public.step_progress(application_id,step_key,status,data)
    values(p_application_id,'entrance_exam',case when p_exam_status='DONE' then 'COMPLETE' else 'IN_PROGRESS' end,
      jsonb_build_object('status',p_exam_status,'date',p_exam_date,'venue',p_exam_venue,'score',p_score))
    on conflict(application_id,step_key) do update
      set status=excluded.status,data=excluded.data,updated_at=now();
  perform public.audit_privileged_action('application.exam_update','application',p_application_id,
    jsonb_build_object('exam_status',p_exam_status,'exam_date',p_exam_date));
end;
$$;
revoke all on function public.admin_update_exam(uuid,numeric,public.exam_status,date,text) from public, anon;
grant execute on function public.admin_update_exam(uuid,numeric,public.exam_status,date,text) to authenticated;

create or replace function public.submit_application(p_application_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare verified boolean;
declare complete_count integer;
begin
  select u.email_confirmed_at is not null into verified
    from auth.users u where u.id=(select auth.uid());
  if not coalesce(verified,false) then raise exception 'Email verification required' using errcode='42501'; end if;
  select count(*) into complete_count from public.step_progress
    where application_id=p_application_id and status='COMPLETE';
  if complete_count <> 13 then raise exception 'All application steps must be complete' using errcode='22023'; end if;
  if exists(
    select 1 from public.applications a
    join public.programmes pr on pr.id=a.programme_id
    join public.referees r on r.application_id=a.id
    where a.id=p_application_id and r.kind=any(pr.required_referees) and r.status<>'RECEIVED'
  ) then raise exception 'Required referee recommendations are pending' using errcode='22023'; end if;
  update public.applications set status='SUBMITTED',submitted_at=now()
    where id=p_application_id and user_id=(select auth.uid()) and status='DRAFT';
  if not found then raise exception 'Application not available' using errcode='42501'; end if;
  insert into public.email_outbox(application_id,kind)
    values(p_application_id,'SUBMISSION_CONFIRMATION')
    on conflict(application_id,kind) do nothing;
  perform public.audit_privileged_action('application.submit','application',p_application_id,'{}'::jsonb);
end;
$$;
revoke all on function public.submit_application(uuid) from public, anon;
grant execute on function public.submit_application(uuid) to authenticated;

create or replace function public.claim_submission_email(p_application_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claimed_id uuid;
begin
  update public.email_outbox set status='PROCESSING',attempts=attempts+1,last_error=null
  where application_id=p_application_id and kind='SUBMISSION_CONFIRMATION'
    and (status='PENDING' or (status='PROCESSING' and updated_at<now()-interval '10 minutes'))
  returning id into claimed_id;
  return claimed_id;
end;
$$;
revoke all on function public.claim_submission_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_submission_email(uuid) to service_role;

create or replace function public.claim_verification_resend(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare claimed_user uuid;
begin
  insert into public.verification_resend_limits(user_id,last_sent_at)
    values(p_user_id,now())
    on conflict(user_id) do update set last_sent_at=now()
      where public.verification_resend_limits.last_sent_at<=now()-interval '60 seconds'
    returning user_id into claimed_user;
  return claimed_user is not null;
end;
$$;
revoke all on function public.claim_verification_resend(uuid) from public, anon, authenticated;
grant execute on function public.claim_verification_resend(uuid) to service_role;

create or replace function public.submit_referee_response(p_token_hash text,p_recommendation jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target_referee uuid;
begin
  if jsonb_typeof(p_recommendation)<>'object'
    or nullif(trim(p_recommendation->>'recommendation'),'') is null then
    raise exception 'Recommendation is required' using errcode='22023';
  end if;
  select ri.referee_id into target_referee
  from public.referee_invites ri
  where ri.token_hash=p_token_hash and ri.consumed_at is null and ri.expires_at>now()
  for update;
  if target_referee is null then raise exception 'Recommendation link is invalid or expired' using errcode='42501'; end if;
  insert into public.referee_responses(referee_id,recommendation)
    values(target_referee,p_recommendation);
  update public.referees set status='RECEIVED' where id=target_referee;
  update public.referee_invites set consumed_at=now()
    where token_hash=p_token_hash and consumed_at is null;
end;
$$;
revoke all on function public.submit_referee_response(text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_referee_response(text,jsonb) to service_role;

create or replace function public.admin_upsert_quote(
 p_id uuid,p_text text,p_author text,p_source text,p_translation text,p_category text,p_lang text,p_rights_note text,p_status public.quote_status
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare qid uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if p_status='APPROVED' and not public.has_role('ADMIN') then raise exception 'Admin approval required' using errcode='42501'; end if;
  if nullif(trim(p_text),'') is null or length(p_text)>1000 or
    nullif(trim(p_source),'') is null or length(p_source)>250 then
    raise exception 'Quote text and source are required' using errcode='22023';
  end if;
  if p_category='biblical' and coalesce(p_translation,'') not in ('KJV','WEB') then
    raise exception 'Scripture quotes require a public-domain KJV or WEB translation' using errcode='22023';
  end if;
  if p_status='APPROVED' and p_category<>'biblical' and (
    nullif(trim(p_author),'') is null or nullif(trim(p_rights_note),'') is null
  ) then raise exception 'Approved non-Scripture quotes need an author and rights note' using errcode='22023'; end if;
  if p_id is null then
    insert into public.quotes(text,author,source,translation,category,lang,rights_note,status,created_by,approved_by,approved_at)
    values(p_text,p_author,p_source,p_translation,p_category,p_lang,p_rights_note,p_status,(select auth.uid()),
      case when p_status='APPROVED' then (select auth.uid()) end,case when p_status='APPROVED' then now() end)
    returning id into qid;
  else
    update public.quotes set text=p_text,author=p_author,source=p_source,translation=p_translation,
      category=p_category,lang=p_lang,rights_note=p_rights_note,status=p_status,
      approved_by=case when p_status='APPROVED' then (select auth.uid()) else approved_by end,
      approved_at=case when p_status='APPROVED' then now() else approved_at end
      where id=p_id returning id into qid;
  end if;
  if qid is null then raise exception 'Quote not found' using errcode='P0002'; end if;
  perform public.audit_privileged_action('quote.upsert','quote',qid,jsonb_build_object('status',p_status));
  return qid;
end;
$$;
revoke all on function public.admin_upsert_quote(uuid,text,text,text,text,text,text,text,public.quote_status) from public, anon;
grant execute on function public.admin_upsert_quote(uuid,text,text,text,text,text,text,text,public.quote_status) to authenticated;

create or replace function public.admin_upsert_campus(p_id uuid,p_code text,p_name text,p_active boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if p_code !~ '^[A-Z0-9]{2,6}$' or nullif(trim(p_name),'') is null then raise exception 'Invalid campus details' using errcode='22023'; end if;
  if p_id is null then insert into public.campuses(code,name,active) values(p_code,trim(p_name),p_active) returning id into saved_id;
  else update public.campuses set code=p_code,name=trim(p_name),active=p_active where id=p_id returning id into saved_id; end if;
  if saved_id is null then raise exception 'Campus not found' using errcode='P0002'; end if;
  perform public.audit_privileged_action('campus.upsert','campus',saved_id,jsonb_build_object('code',p_code,'active',p_active));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_campus(uuid,text,text,boolean) from public, anon;
grant execute on function public.admin_upsert_campus(uuid,text,text,boolean) to authenticated;

create or replace function public.admin_upsert_programme(
  p_id uuid,p_level text,p_name text,p_department text,p_active boolean,p_required_referees text[]
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if nullif(trim(p_level),'') is null or length(trim(p_level))>80 or nullif(trim(p_name),'') is null then
    raise exception 'Invalid programme details' using errcode='22023';
  end if;
  if exists(select 1 from unnest(coalesce(p_required_referees,'{}'::text[])) as rr(kind)
    where kind not in ('Pastor','Church leader','Association/Field','Professional/colleague')) then
    raise exception 'Invalid required referee category' using errcode='22023';
  end if;
  if p_id is null then
    insert into public.programmes(level,name,department,active,required_referees)
      values(p_level,trim(p_name),coalesce(trim(p_department),''),p_active,coalesce(p_required_referees,'{}'::text[]))
      returning id into saved_id;
  else
    update public.programmes set level=p_level,name=trim(p_name),department=coalesce(trim(p_department),''),
      active=p_active,required_referees=coalesce(p_required_referees,'{}'::text[])
      where id=p_id returning id into saved_id;
  end if;
  if saved_id is null then raise exception 'Programme not found' using errcode='P0002'; end if;
  perform public.audit_privileged_action('programme.upsert','programme',saved_id,jsonb_build_object('level',p_level,'active',p_active));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_programme(uuid,text,text,text,boolean,text[]) from public, anon;
grant execute on function public.admin_upsert_programme(uuid,text,text,text,boolean,text[]) to authenticated;

create or replace function public.admin_upsert_fee(p_programme_level text,p_amount bigint,p_active boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if nullif(trim(p_programme_level),'') is null or p_amount<0 then raise exception 'Invalid fee details' using errcode='22023'; end if;
  insert into public.fees(programme_level,amount,active) values(trim(p_programme_level),p_amount,p_active)
    on conflict(programme_level) do update set amount=excluded.amount,active=excluded.active
    returning id into saved_id;
  perform public.audit_privileged_action('fee.upsert','fee',saved_id,jsonb_build_object('programme_level',p_programme_level,'amount',p_amount));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_fee(text,bigint,boolean) from public, anon;
grant execute on function public.admin_upsert_fee(text,bigint,boolean) to authenticated;

create or replace function public.admin_upsert_admission_cycle(p_year integer,p_label text,p_active boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if p_year<2000 or p_year>2100 or nullif(trim(p_label),'') is null then raise exception 'Invalid admission cycle' using errcode='22023'; end if;
  insert into public.admission_cycles(year,label,active) values(p_year,trim(p_label),p_active)
    on conflict(year) do update set label=excluded.label,active=excluded.active returning id into saved_id;
  perform public.audit_privileged_action('admission_cycle.upsert','admission_cycle',saved_id,jsonb_build_object('year',p_year,'active',p_active));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_admission_cycle(integer,text,boolean) from public, anon;
grant execute on function public.admin_upsert_admission_cycle(integer,text,boolean) to authenticated;

create or replace function public.admin_upsert_ministry_area(p_id uuid,p_name text,p_active boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Ministry area name is required' using errcode='22023'; end if;
  if p_id is null then insert into public.ministry_areas(name,active) values(trim(p_name),p_active) returning id into saved_id;
  else update public.ministry_areas set name=trim(p_name),active=p_active where id=p_id returning id into saved_id; end if;
  if saved_id is null then raise exception 'Ministry area not found' using errcode='P0002'; end if;
  perform public.audit_privileged_action('ministry_area.upsert','ministry_area',saved_id,jsonb_build_object('active',p_active));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_ministry_area(uuid,text,boolean) from public, anon;
grant execute on function public.admin_upsert_ministry_area(uuid,text,boolean) to authenticated;

create or replace function public.admin_upsert_document_requirement(
  p_id uuid,p_programme_level text,p_document_kind text,p_required boolean,p_requires_married boolean
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if nullif(trim(p_programme_level),'') is null or p_document_kind !~ '^[a-z0-9_]{2,64}$' then raise exception 'Invalid document requirement' using errcode='22023'; end if;
  if p_id is null then
    insert into public.programme_document_requirements(programme_level,document_kind,required,requires_married)
      values(trim(p_programme_level),p_document_kind,p_required,p_requires_married)
      on conflict(programme_level,document_kind,requires_married) do update set required=excluded.required returning id into saved_id;
  else
    update public.programme_document_requirements set programme_level=trim(p_programme_level),document_kind=p_document_kind,
      required=p_required,requires_married=p_requires_married where id=p_id returning id into saved_id;
  end if;
  if saved_id is null then raise exception 'Document requirement not found' using errcode='P0002'; end if;
  perform public.audit_privileged_action('document_requirement.upsert','document_requirement',saved_id,
    jsonb_build_object('programme_level',p_programme_level,'document_kind',p_document_kind,'required',p_required));
  return saved_id;
end;
$$;
revoke all on function public.admin_upsert_document_requirement(uuid,text,text,boolean,boolean) from public, anon;
grant execute on function public.admin_upsert_document_requirement(uuid,text,text,boolean,boolean) to authenticated;

create policy "profiles read own or staff" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_staff());
create policy "profiles update own" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "campuses read active" on public.campuses for select to authenticated using (active or public.is_staff());
create policy "campuses staff read" on public.campuses for select to authenticated using (public.is_staff());
create policy "programmes read active" on public.programmes for select to authenticated using (active or public.is_staff());
create policy "programmes staff read" on public.programmes for select to authenticated using (public.is_staff());
create policy "cycles read active" on public.admission_cycles for select to authenticated using (active or public.is_staff());
create policy "cycles staff read" on public.admission_cycles for select to authenticated using (public.is_staff());
create policy "ministry areas read active" on public.ministry_areas for select to authenticated using (active or public.is_staff());
create policy "ministry areas staff read" on public.ministry_areas for select to authenticated using (public.is_staff());
create policy "document requirements read" on public.programme_document_requirements for select to authenticated using (true);
create policy "document requirements staff read" on public.programme_document_requirements for select to authenticated using (public.is_staff());
create policy "applications read owner staff" on public.applications for select to authenticated using (user_id=(select auth.uid()) or public.is_staff());
create policy "progress read own" on public.step_progress for select to authenticated using (exists(select 1 from public.applications a where a.id=application_id and (a.user_id=(select auth.uid()) or public.is_staff())));
create policy "progress write own draft" on public.step_progress for insert to authenticated with check (exists(select 1 from public.applications a where a.id=application_id and a.user_id=(select auth.uid()) and a.status='DRAFT'));
create policy "progress update own draft" on public.step_progress for update to authenticated using (exists(select 1 from public.applications a where a.id=application_id and a.user_id=(select auth.uid()) and a.status='DRAFT')) with check (exists(select 1 from public.applications a where a.id=application_id and a.user_id=(select auth.uid()) and a.status='DRAFT'));
create policy "progress staff manage" on public.step_progress for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "education own read" on public.education for select to authenticated using (exists(select 1 from public.applications a where a.id=application_id and (a.user_id=(select auth.uid()) or public.is_staff())));
create policy "education own draft write" on public.education for all to authenticated using (exists(select 1 from public.applications a where a.id=application_id and a.user_id=(select auth.uid()) and a.status='DRAFT')) with check (exists(select 1 from public.applications a where a.id=application_id and a.user_id=(select auth.uid()) and a.status='DRAFT'));
create policy "referees own metadata" on public.referees for select to authenticated using (exists(select 1 from public.applications a where a.id=application_id and (a.user_id=(select auth.uid()) or public.is_staff())));
create policy "referee response staff only" on public.referee_responses for select to authenticated using (public.is_staff());
create policy "referee invite no applicant access" on public.referee_invites for select to authenticated using (public.is_staff());
create policy "documents own read" on public.documents for select to authenticated using (owner_id=(select auth.uid()) or public.is_staff());
create policy "documents own draft delete" on public.documents for delete to authenticated using (owner_id=(select auth.uid()) and exists(select 1 from public.applications a where a.id=application_id and a.status='DRAFT'));
create policy "fees read active" on public.fees for select to authenticated using (active or public.is_staff());
create policy "fees staff read" on public.fees for select to authenticated using (public.is_staff());
create policy "payments own read" on public.payments for select to authenticated using (exists(select 1 from public.applications a where a.id=application_id and (a.user_id=(select auth.uid()) or public.is_staff())));
create policy "quotes approved read" on public.quotes for select to authenticated using (status='APPROVED');
create policy "quotes staff read" on public.quotes for select to authenticated using (public.is_staff());
create policy "login events own read" on public.login_events for select to authenticated using (user_id=(select auth.uid()) or public.is_staff());
create policy "favorites own manage" on public.quote_favorites for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "matricule history staff read" on public.matricule_history for select to authenticated using (public.is_staff());
create policy "audit staff read" on public.audit_log for select to authenticated using (public.has_role('ADMIN'));
create policy "portal settings staff read" on public.portal_settings for select to authenticated using (public.is_staff());

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger campuses_updated_at before update on public.campuses for each row execute function public.set_updated_at();
create trigger programmes_updated_at before update on public.programmes for each row execute function public.set_updated_at();
create trigger admission_cycles_updated_at before update on public.admission_cycles for each row execute function public.set_updated_at();
create trigger ministry_areas_updated_at before update on public.ministry_areas for each row execute function public.set_updated_at();
create trigger document_requirements_updated_at before update on public.programme_document_requirements for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications for each row execute function public.set_updated_at();
create trigger progress_updated_at before update on public.step_progress for each row execute function public.set_updated_at();
create trigger education_updated_at before update on public.education for each row execute function public.set_updated_at();
create trigger referees_updated_at before update on public.referees for each row execute function public.set_updated_at();
create trigger referee_responses_updated_at before update on public.referee_responses for each row execute function public.set_updated_at();
create trigger referee_invites_updated_at before update on public.referee_invites for each row execute function public.set_updated_at();
create trigger documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger fees_updated_at before update on public.fees for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();
create trigger email_outbox_updated_at before update on public.email_outbox for each row execute function public.set_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('application-documents','application-documents',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create policy "read own private application files" on storage.objects for select to authenticated using (
  bucket_id='application-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy "no direct applicant upload" on storage.objects for insert to authenticated with check (false);
create policy "no direct applicant overwrite" on storage.objects for update to authenticated using (false) with check (false);
create policy "no direct applicant file delete" on storage.objects for delete to authenticated using (false);
