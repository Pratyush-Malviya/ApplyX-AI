-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create resumes table
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  parsed_text text,
  parsed_sections jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.resumes enable row level security;

create policy "Users can view own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Create applications table
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company text not null,
  position text not null,
  job_url text,
  job_description text,
  status text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  resume_id uuid references public.resumes on delete set null,
  cover_letter text,
  notes text,
  salary_range text,
  location text,
  applied_at timestamp with time zone,
  interview_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.applications enable row level security;

create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Create cover_letters table
create table if not exists public.cover_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  application_id uuid references public.applications on delete cascade,
  content text not null,
  company text,
  position text,
  created_at timestamp with time zone default now() not null
);

alter table public.cover_letters enable row level security;

create policy "Users can view own cover letters"
  on public.cover_letters for select
  using (auth.uid() = user_id);

create policy "Users can insert own cover letters"
  on public.cover_letters for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own cover letters"
  on public.cover_letters for delete
  using (auth.uid() = user_id);

-- Create job_analyses table
create table if not exists public.job_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  job_url text,
  job_title text,
  company text,
  raw_text text not null,
  analysis jsonb not null,
  created_at timestamp with time zone default now() not null
);

alter table public.job_analyses enable row level security;

create policy "Users can view own job analyses"
  on public.job_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own job analyses"
  on public.job_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own job analyses"
  on public.job_analyses for delete
  using (auth.uid() = user_id);

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create storage bucket for resumes
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage policy: users can view own resume files
create policy "Users can view own resume files"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: users can upload own resume files
create policy "Users can upload own resume files"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: users can delete own resume files
create policy "Users can delete own resume files"
  on storage.objects for delete
  using (auth.uid()::text = (storage.foldername(name))[1]);