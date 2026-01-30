-- Chats por usuario para el asistente de recomendaciones (Chaty).
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_user_id_idx on public.chats (user_id);
create index if not exists chats_updated_at_idx on public.chats (updated_at desc);

alter table public.chats enable row level security;

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own"
on public.chats for select
using (auth.uid() = user_id);

drop policy if exists "chats_insert_own" on public.chats;
create policy "chats_insert_own"
on public.chats for insert
with check (auth.uid() = user_id);

drop policy if exists "chats_update_own" on public.chats;
create policy "chats_update_own"
on public.chats for update
using (auth.uid() = user_id);

drop policy if exists "chats_delete_own" on public.chats;
create policy "chats_delete_own"
on public.chats for delete
using (auth.uid() = user_id);

-- Mensajes de cada chat.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_id_idx on public.chat_messages (chat_id);
create index if not exists chat_messages_chat_id_created_at_idx on public.chat_messages (chat_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages for select
using (
  exists (
    select 1 from public.chats c
    where c.id = chat_messages.chat_id and c.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages for insert
with check (
  exists (
    select 1 from public.chats c
    where c.id = chat_messages.chat_id and c.user_id = auth.uid()
  )
);

-- Actualizar updated_at del chat cuando se inserta un mensaje.
create or replace function public.chat_messages_updated_at()
returns trigger as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists chat_messages_updated_at_trigger on public.chat_messages;
create trigger chat_messages_updated_at_trigger
after insert on public.chat_messages
for each row execute function public.chat_messages_updated_at();
