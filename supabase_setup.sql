-- Execute este SQL no Supabase > SQL Editor
-- Este script é incremental/idempotente: pode ser executado quantas vezes
-- for necessário sem gerar erro de "já existe".

-- Tabela de marcações de ponto (não recria se já existir)
create table if not exists public.marcacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  tipo text check (tipo in ('entrada', 'saida')) not null,
  created_at timestamptz default now() not null
);

-- Índices (não recria se já existirem)
create index if not exists marcacoes_user_id_idx on public.marcacoes(user_id);
create index if not exists marcacoes_created_at_idx on public.marcacoes(created_at);

-- RLS
alter table public.marcacoes enable row level security;

-- Remove TODAS as policies existentes na tabela, seja qual for o nome,
-- para garantir que a recriação abaixo nunca falhe por duplicidade.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'marcacoes'
  loop
    execute format('drop policy if exists %I on public.marcacoes', pol.policyname);
  end loop;
end $$;

-- Colaborador pode ver e inserir apenas suas próprias marcações
create policy "colaborador_select" on public.marcacoes
  for select using (auth.uid() = user_id);

create policy "colaborador_insert" on public.marcacoes
  for insert with check (auth.uid() = user_id);

-- Master (danifreiman44@gmail.com) pode ver, inserir, editar e excluir tudo.
-- Usa auth.jwt() (claims do token) em vez de consultar auth.users diretamente,
-- pois o papel "authenticated" não tem permissão de SELECT em auth.users.
create policy "master_select_all" on public.marcacoes
  for select using (
    (auth.jwt() ->> 'email') = 'danifreiman44@gmail.com'
  );

create policy "master_insert_all" on public.marcacoes
  for insert with check (
    (auth.jwt() ->> 'email') = 'danifreiman44@gmail.com'
  );

create policy "master_update_all" on public.marcacoes
  for update using (
    (auth.jwt() ->> 'email') = 'danifreiman44@gmail.com'
  );

create policy "master_delete_all" on public.marcacoes
  for delete using (
    (auth.jwt() ->> 'email') = 'danifreiman44@gmail.com'
  );
