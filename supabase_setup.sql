-- Execute este SQL no Supabase > SQL Editor
-- Este script pode ser executado quantas vezes for necessário (idempotente).

-- Tabela de marcações de ponto
create table if not exists public.marcacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  tipo text check (tipo in ('entrada', 'saida')) not null,
  created_at timestamptz default now() not null
);

-- Índices para performance
create index if not exists marcacoes_user_id_idx on public.marcacoes(user_id);
create index if not exists marcacoes_created_at_idx on public.marcacoes(created_at);

-- RLS (Row Level Security)
alter table public.marcacoes enable row level security;

-- Remove policies antigas antes de recriar
drop policy if exists "colaborador_select" on public.marcacoes;
drop policy if exists "colaborador_insert" on public.marcacoes;
drop policy if exists "master_select_all" on public.marcacoes;
drop policy if exists "master_insert_all" on public.marcacoes;
drop policy if exists "master_update_all" on public.marcacoes;
drop policy if exists "master_delete_all" on public.marcacoes;

-- Colaborador pode ver e inserir apenas suas próprias marcações
create policy "colaborador_select" on public.marcacoes
  for select using (auth.uid() = user_id);

create policy "colaborador_insert" on public.marcacoes
  for insert with check (auth.uid() = user_id);

-- Master (danifreiman44@gmail.com) pode ver, inserir, editar e excluir tudo
create policy "master_select_all" on public.marcacoes
  for select using (
    (select email from auth.users where id = auth.uid()) = 'danifreiman44@gmail.com'
  );

create policy "master_insert_all" on public.marcacoes
  for insert with check (
    (select email from auth.users where id = auth.uid()) = 'danifreiman44@gmail.com'
  );

create policy "master_update_all" on public.marcacoes
  for update using (
    (select email from auth.users where id = auth.uid()) = 'danifreiman44@gmail.com'
  );

create policy "master_delete_all" on public.marcacoes
  for delete using (
    (select email from auth.users where id = auth.uid()) = 'danifreiman44@gmail.com'
  );
