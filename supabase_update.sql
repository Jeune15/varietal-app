-- Copia y pega este código en el Editor SQL de tu proyecto en Supabase
-- Esto creará la tabla necesaria para sincronizar el Inventario de Producción

create table if not exists "public"."productionInventory" (
    "id" text not null,
    "name" text not null,
    "type" text not null, -- 'rechargeable' | 'unit'
    "quantity" numeric not null default 0,
    "minThreshold" numeric not null default 0,
    "format" text, -- '250g', '500g', '1kg' o null
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key ("id")
);

-- Habilitar seguridad (RLS)
alter table "public"."productionInventory" enable row level security;

-- Crear políticas de acceso (Permite lectura/escritura pública con la API Key)
-- Nota: Ajusta esto si ya tienes autenticación de usuarios configurada
create policy "Public Access"
on "public"."productionInventory"
as permissive
for all
to public
using (true)
with check (true);
