-- =====================================================================
-- QUIRAL POS — ESQUEMA MULTI-TENANT MODULAR, ÍNDICES AVANZADOS Y RLS ESTRICTO
-- =====================================================================

create extension if not exists "pgcrypto";

-- 1. TABLA TIENDAS (ORGANIZACIONES / TENANTS)
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi tienda' check (length(trim(name)) > 0),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. TABLA MIEMBROS DE TIENDA (COLABORACIÓN MULTIUSUARIO Y USERNAMES ÚNICOS)
create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null check (length(trim(username)) >= 2),
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id),
  unique (username),
  unique (store_id, username)
);

-- Migración segura si la tabla ya existía
alter table public.store_members add column if not exists username text;
alter table public.store_members add column if not exists created_at timestamptz not null default now();
update public.store_members
set username = lower(split_part((select email from auth.users where id = store_members.user_id), '@', 1))
where username is null;
alter table public.store_members alter column username set not null;

-- 3. TABLA CATEGORÍAS MODULARES (ORDEN ESTRICTO DE FILTROS Y ATRIBUTOS VINCULADOS)
create table if not exists public.categories (
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) > 0 and lower(trim(name)) <> 'todos'),
  display_order integer not null default 0,
  is_system_default boolean not null default false,
  attribute_keys jsonb not null default '[]'::jsonb check (jsonb_typeof(attribute_keys) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (store_id, name)
);

-- 4. TABLA BANCO MAESTRO DE ATRIBUTOS DINÁMICOS (OPCIONES EN ORDEN ESTRICTO)
create table if not exists public.attribute_bank (
  store_id uuid not null references public.stores(id) on delete cascade,
  key text not null check (length(trim(key)) > 0),
  label text not null check (length(trim(label)) > 0),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (store_id, key)
);

-- 5. TABLA CONFIGURACIÓN CONSOLIDADA DE CATÁLOGO POR TIENDA (SINCRONIZACIÓN REALTIME)
create table if not exists public.catalog_configs (
  store_id uuid primary key references public.stores(id) on delete cascade,
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  updated_at timestamptz not null default now()
);

-- 6. TABLA PROVEEDORES
create table if not exists public.suppliers (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null check (length(trim(id)) > 0),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (store_id, id)
);

-- 7. TABLA PRODUCTOS E INVENTARIO CON LOTES (BATCHES) Y METADATOS DE SUBTIPOS
create table if not exists public.products (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null check (length(trim(id)) > 0),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and (data ? 'name')
    and (data ? 'category')
    and (data ? 'price')
    and jsonb_typeof(data->'batches') = 'array'
  ),
  updated_at timestamptz not null default now(),
  primary key (store_id, id)
);

-- 8. TABLA VENTAS CON SNAPSHOTS DE COSTO Y GARANTÍAS
create table if not exists public.sales (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null check (length(trim(id)) > 0),
  sale_number bigint not null check (sale_number > 0),
  created_at timestamptz not null,
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and jsonb_typeof(data->'items') = 'array'
  ),
  updated_at timestamptz not null default now(),
  primary key (store_id, id),
  unique (store_id, sale_number)
);

-- 9. TABLA CIERRES DE CICLO (ARQUEOS Y MÉTRICAS CONGELADAS)
create table if not exists public.cycle_closings (
  store_id uuid not null references public.stores(id) on delete cascade,
  id text not null check (length(trim(id)) > 0),
  closed_at timestamptz not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (store_id, id)
);

-- 10. VISTA INDEXADA DE HISTORIAL DE VENTAS (SALES_HISTORY)
create or replace view public.sales_history with (security_invoker = true) as
select
  s.store_id,
  s.id,
  s.sale_number,
  s.created_at,
  coalesce(s.data->>'customerName', 'Cliente General') as customer_name,
  coalesce(s.data->>'paymentMethod', 'Efectivo') as payment_method,
  coalesce((s.data->>'totalAmount')::numeric, 0) as total_amount,
  jsonb_array_length(coalesce(s.data->'items', '[]'::jsonb)) as item_lines_count,
  s.data,
  s.updated_at
from public.sales s;

-- =====================================================================
-- ÍNDICES AVANZADOS (BTREE COMPUESTOS + EXPRESIONES + GIN JSONB_PATH_OPS)
-- =====================================================================

-- Índices de membresía y autenticación
create index if not exists store_members_username_user_idx on public.store_members(lower(username), user_id);
create index if not exists store_members_user_store_idx on public.store_members(user_id, store_id);

-- Índices de categorías y banco de atributos
create index if not exists categories_store_order_idx on public.categories(store_id, display_order asc);
create index if not exists categories_attr_keys_gin_idx on public.categories using gin(attribute_keys jsonb_path_ops);
create index if not exists attribute_bank_store_key_idx on public.attribute_bank(store_id, key);
create index if not exists attribute_bank_options_gin_idx on public.attribute_bank using gin(options jsonb_path_ops);
create index if not exists catalog_configs_config_gin_idx on public.catalog_configs using gin(config jsonb_path_ops);

-- Índices de productos para búsqueda instantánea por categoría, nombre, subtítulo y atributos JSONB
create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_store_updated_idx on public.products(store_id, updated_at desc);
create index if not exists products_store_category_idx on public.products(store_id, ((data->>'category')));
create index if not exists products_store_name_lower_idx on public.products(store_id, lower(data->>'name'));
create index if not exists products_store_subtitle_lower_idx on public.products(store_id, lower(coalesce(data->>'subtitle', '')));
create index if not exists products_data_gin_idx on public.products using gin(data);
create index if not exists products_data_path_gin_idx on public.products using gin(data jsonb_path_ops);
create index if not exists products_batches_gin_idx on public.products using gin((data->'batches') jsonb_path_ops);

-- Índices de ventas y cierres de ciclo para paginación y reportes multiusuario
create index if not exists sales_store_created_idx on public.sales(store_id, created_at desc);
create index if not exists sales_store_number_idx on public.sales(store_id, sale_number desc);
create index if not exists sales_store_customer_lower_idx on public.sales(store_id, lower(coalesce(data->>'customerName', '')));
create index if not exists sales_data_gin_idx on public.sales using gin(data);
create index if not exists sales_items_path_gin_idx on public.sales using gin((data->'items') jsonb_path_ops);
create index if not exists cycle_closings_store_created_idx on public.cycle_closings(store_id, closed_at desc);
create index if not exists cycle_closings_data_gin_idx on public.cycle_closings using gin(data);

-- =====================================================================
-- RLS (ROW LEVEL SECURITY) ESTRICTO Y FUNCIONES DE AISLAMIENTO MULTI-TENANT
-- =====================================================================

create or replace function public.is_store_member(target_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store and user_id = auth.uid()
  );
$$;

revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;

create or replace function public.is_store_owner(target_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores
    where id = target_store and owner_id = auth.uid()
  ) or exists (
    select 1 from public.store_members
    where store_id = target_store and user_id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_store_owner(uuid) from public;
grant execute on function public.is_store_owner(uuid) to authenticated;

-- Resolución segura de email por username para el Login Dual
create or replace function public.get_email_by_username(input_username text)
returns text language sql stable security definer set search_path = public, auth as $$
  select u.email from auth.users u
  join public.store_members m on m.user_id = u.id
  where lower(m.username) = lower(trim(input_username))
  limit 1;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- Habilitar y forzar RLS en todas las tablas del dominio
alter table public.stores enable row level security;
alter table public.stores force row level security;

alter table public.store_members enable row level security;
alter table public.store_members force row level security;

alter table public.categories enable row level security;
alter table public.categories force row level security;

alter table public.attribute_bank enable row level security;
alter table public.attribute_bank force row level security;

alter table public.catalog_configs enable row level security;
alter table public.catalog_configs force row level security;

alter table public.suppliers enable row level security;
alter table public.suppliers force row level security;

alter table public.products enable row level security;
alter table public.products force row level security;

alter table public.sales enable row level security;
alter table public.sales force row level security;

alter table public.cycle_closings enable row level security;
alter table public.cycle_closings force row level security;

-- Políticas de Tiendas (stores)
drop policy if exists "members can read their stores" on public.stores;
create policy "members can read their stores"
  on public.stores for select
  to authenticated
  using (auth.uid() is not null and public.is_store_member(id));

drop policy if exists "owners can update their stores" on public.stores;
create policy "owners can update their stores"
  on public.stores for update
  to authenticated
  using (auth.uid() is not null and public.is_store_owner(id))
  with check (auth.uid() is not null and public.is_store_owner(id));

-- Políticas de Membresías (store_members)
drop policy if exists "members can read membership" on public.store_members;
create policy "members can read membership"
  on public.store_members for select
  to authenticated
  using (auth.uid() is not null and (user_id = auth.uid() or public.is_store_member(store_id)));

-- Políticas granulares (SELECT, INSERT, UPDATE, DELETE) para todas las tablas operativas de la tienda
do $$
declare
  table_name text;
  tables text[] := array[
    'categories',
    'attribute_bank',
    'catalog_configs',
    'suppliers',
    'products',
    'sales',
    'cycle_closings'
  ];
begin
  foreach table_name in array tables loop
    execute format('drop policy if exists "store members manage %1$s" on public.%1$s', table_name);
    execute format('drop policy if exists "store members select %1$s" on public.%1$s', table_name);
    execute format('drop policy if exists "store members insert %1$s" on public.%1$s', table_name);
    execute format('drop policy if exists "store members update %1$s" on public.%1$s', table_name);
    execute format('drop policy if exists "store members delete %1$s" on public.%1$s', table_name);

    execute format(
      'create policy "store members select %1$s" on public.%1$s for select to authenticated using (auth.uid() is not null and public.is_store_member(store_id))',
      table_name
    );
    execute format(
      'create policy "store members insert %1$s" on public.%1$s for insert to authenticated with check (auth.uid() is not null and public.is_store_member(store_id))',
      table_name
    );
    execute format(
      'create policy "store members update %1$s" on public.%1$s for update to authenticated using (auth.uid() is not null and public.is_store_member(store_id)) with check (auth.uid() is not null and public.is_store_member(store_id))',
      table_name
    );
    execute format(
      'create policy "store members delete %1$s" on public.%1$s for delete to authenticated using (auth.uid() is not null and public.is_store_member(store_id))',
      table_name
    );
  end loop;
end $$;

-- =====================================================================
-- SINCRONIZACIÓN ATÓMICA DE CATÁLOGO MODULAR Y CONSULTAS PAGINADAS (RPCs)
-- =====================================================================

-- Persistencia atómica del catálogo modular (actualiza catalog_configs, categories y attribute_bank en una sola transacción)
create or replace function public.upsert_catalog_config(
  target_store uuid,
  config_payload jsonb
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  cat_item jsonb;
  attr_key text;
  attr_val jsonb;
  ord_idx integer := 0;
  cat_name text;
begin
  if auth.uid() is null or not public.is_store_member(target_store) then
    raise exception 'No autorizado para modificar el catálogo de esta tienda';
  end if;

  if config_payload is null or jsonb_typeof(config_payload) <> 'object' then
    raise exception 'Configuración de catálogo inválida';
  end if;

  insert into public.catalog_configs(store_id, config, updated_at)
  values (target_store, config_payload, now())
  on conflict (store_id) do update
  set config = excluded.config, updated_at = now();

  -- Sincronizar tabla relacional de categorías y su orden de atributos
  if jsonb_typeof(config_payload->'categories') = 'array' then
    for cat_item in select * from jsonb_array_elements(config_payload->'categories') loop
      cat_name := trim(coalesce(cat_item->>'name', ''));
      if length(cat_name) > 0 and lower(cat_name) <> 'todos' then
        ord_idx := ord_idx + 1;
        insert into public.categories(store_id, name, display_order, is_system_default, attribute_keys, updated_at)
        values (
          target_store,
          cat_name,
          ord_idx,
          coalesce((cat_item->>'isSystemDefault')::boolean, false),
          coalesce(cat_item->'attributeKeys', '[]'::jsonb),
          now()
        )
        on conflict (store_id, name) do update
        set
          display_order = excluded.display_order,
          is_system_default = excluded.is_system_default,
          attribute_keys = excluded.attribute_keys,
          updated_at = now();
      end if;
    end loop;
  end if;

  -- Sincronizar banco maestro de atributos y el orden de sus opciones
  if jsonb_typeof(config_payload->'attributes') = 'object' then
    for attr_key, attr_val in select * from jsonb_each(config_payload->'attributes') loop
      insert into public.attribute_bank(store_id, key, label, options, updated_at)
      values (
        target_store,
        attr_key,
        coalesce(attr_val->>'label', attr_key),
        coalesce(attr_val->'options', '[]'::jsonb),
        now()
      )
      on conflict (store_id, key) do update
      set
        label = excluded.label,
        options = excluded.options,
        updated_at = now();
    end loop;
  end if;

  return config_payload;
end;
$$;

revoke all on function public.upsert_catalog_config(uuid, jsonb) from public;
grant execute on function public.upsert_catalog_config(uuid, jsonb) to authenticated;

-- Búsqueda paginada e indexada de productos para tiendas con alto volumen concurrente
create or replace function public.search_products_paginated(
  target_store uuid,
  search_query text default null,
  filter_category text default null,
  page_limit integer default 100,
  page_offset integer default 0
) returns setof jsonb language plpgsql stable security invoker set search_path = public as $$
declare
  clean_query text := lower(trim(coalesce(search_query, '')));
  clean_cat text := trim(coalesce(filter_category, ''));
  safe_limit integer := least(greatest(coalesce(page_limit, 100), 1), 500);
  safe_offset integer := greatest(coalesce(page_offset, 0), 0);
begin
  if auth.uid() is null or not public.is_store_member(target_store) then
    raise exception 'No autorizado en esta tienda';
  end if;

  return query
  select p.data
  from public.products p
  where p.store_id = target_store
    and (
      clean_cat = ''
      or lower(clean_cat) = 'todos'
      or lower(p.data->>'category') = lower(clean_cat)
    )
    and (
      clean_query = ''
      or lower(p.data->>'name') like '%' || clean_query || '%'
      or lower(coalesce(p.data->>'subtitle', '')) like '%' || clean_query || '%'
      or lower(coalesce(p.data->>'category', '')) like '%' || clean_query || '%'
    )
  order by p.updated_at desc
  limit safe_limit
  offset safe_offset;
end;
$$;

revoke all on function public.search_products_paginated(uuid, text, text, integer, integer) from public;
grant execute on function public.search_products_paginated(uuid, text, text, integer, integer) to authenticated;

-- Trigger para registrar automáticamente la tienda y membresía tras registrar un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_store uuid;
  requested_store uuid;
  requested_username text;
begin
  requested_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))));
  begin
    requested_store := (new.raw_user_meta_data->>'store_id')::uuid;
  exception when others then
    requested_store := null;
  end;

  if requested_store is not null and exists (select 1 from public.stores where id = requested_store) then
    insert into public.store_members(store_id, user_id, username, role)
    values (requested_store, new.id, requested_username, 'staff');
  else
    insert into public.stores(name, owner_id)
    values (coalesce(new.raw_user_meta_data->>'store_name', 'Mi tienda'), new.id)
    returning id into new_store;

    insert into public.store_members(store_id, user_id, username, role)
    values (new_store, new.id, requested_username, 'owner');
  end if;
  return new;
exception when unique_violation then
  raise exception 'El nombre de usuario ya está registrado';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Actualización de credenciales con verificación
create or replace function public.update_my_credentials(current_password text, new_username text, new_password text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  current_email text;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sesión requerida';
  end if;

  select email into current_email from auth.users where id = current_user_id;

  if not exists (select 1 from public.store_members where user_id = current_user_id) then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  if new_username is not null and length(trim(new_username)) > 0 then
    update public.store_members
    set username = lower(trim(new_username))
    where user_id = current_user_id;
  end if;

  if new_password is not null and length(new_password) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;
end;
$$;

revoke all on function public.update_my_credentials(text, text, text) from public;
grant execute on function public.update_my_credentials(text, text, text) to authenticated;

-- =====================================================================
-- TRANSACCIÓN ATÓMICA DE VENTA CONCURRENTE (FOR UPDATE)
-- =====================================================================
create or replace function public.complete_sale(
  target_store uuid,
  sale_id text,
  sale_number bigint,
  sale_created_at timestamptz,
  sale_data jsonb,
  lines jsonb
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  line jsonb;
  product_row jsonb;
  batch jsonb;
  product_id text;
  batch_id text;
  quantity integer;
begin
  if auth.uid() is null or not public.is_store_member(target_store) then
    raise exception 'No autorizado en esta tienda';
  end if;

  for line in select * from jsonb_array_elements(lines) loop
    product_id := line->>'productId';
    batch_id := line->>'batchId';
    quantity := (line->>'quantity')::integer;

    if quantity is null or quantity <= 0 then
      raise exception 'Cantidad inválida para venta';
    end if;

    -- Bloqueo pesimista para evitar condiciones de carrera en ventas concurrentes
    select data into product_row
    from public.products
    where store_id = target_store and id = product_id
    for update;

    if product_row is null then
      raise exception 'Producto no encontrado: %', product_id;
    end if;

    batch := (select value from jsonb_array_elements(product_row->'batches') value where value->>'id' = batch_id);

    if batch is null or coalesce((batch->>'stock')::integer, 0) < quantity then
      raise exception 'Stock insuficiente en el lote seleccionado de %', coalesce(product_row->>'name', product_id);
    end if;

    -- Descontar stock del lote de manera atómica
    product_row := jsonb_set(product_row, '{batches}', (
      select jsonb_agg(
        case when value->>'id' = batch_id
          then jsonb_set(value, '{stock}', to_jsonb((value->>'stock')::integer - quantity))
          else value
        end
      )
      from jsonb_array_elements(product_row->'batches') value
    ));

    update public.products
    set data = product_row, updated_at = now()
    where store_id = target_store and id = product_id;
  end loop;

  insert into public.sales(store_id, id, sale_number, created_at, data)
  values (target_store, sale_id, sale_number, sale_created_at, sale_data);

  return sale_data;
end;
$$;

revoke all on function public.complete_sale(uuid, text, bigint, timestamptz, jsonb, jsonb) from public;
grant execute on function public.complete_sale(uuid, text, bigint, timestamptz, jsonb, jsonb) to authenticated;

-- =====================================================================
-- SIMULACIÓN DE 1 MES (30 DÍAS) DE OPERACIÓN REALISTA (SEED DEMO STORE)
-- =====================================================================
create or replace function public.seed_demo_store(p_store_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  supplier_names text[] := array[
    'Distribuidora Apple Miami',
    'Importadora Shenzhen Direct',
    'Mayorista Audio & Cases Cartagena',
    'Anker & Ugreen Oficial Colombia',
    'Perfumería Árabe & Diseñador',
    'Proveedora Digital Streaming'
  ];
  supplier_colors text[] := array[
    '#007AFF', '#AF52DE', '#28CD41', '#5AC8FA', '#FF9500', '#FF3B30'
  ];
  product_names text[] := array[
    'Cubo iPhone 20W', 'Cubo Anker 30W', 'Cubo Samsung 25W', 'Cubo Ugreen 65W',
    'Cable iPhone (Trenzado) 1 Metro', 'Cable Anker (Trenzado) 2 Metros',
    'Cargador Completo iPhone 20W (Normal)', 'Cargador Completo 1Hora 35W (Trenzado)',
    'Forro Silicona Líquida (iPhone 15 Pro Max)', 'Forro Transparente Anti-amarilleo (iPhone 15 Pro)',
    'Forro Lujo (iPhone 16 Pro Max)', 'Forro Silicona Líquida (iPhone 13 / 14)',
    'AirPods Pro 2da Generación (USB-C)', 'AirPods Serie 4 (USB-C)', 'AirPods Serie 3 (Lightning)',
    'Power Bank 10000mAh (MagSafe Inalámbrico) Anker 20W', 'Power Bank 20000mAh (Dual USB-C PD) Ugreen 45W',
    'iPhone 16 Pro Max 256GB Titanio Natural', 'iPhone 15 Pro Max 256GB Titanio Negro',
    'iPhone 15 128GB Azul', 'iPhone 13 128GB Negro Medianoche',
    'Sauvage Dior 100ml Eau de Parfum (EDP)', 'Lattafa Khamrah 100ml Eau de Parfum (EDP)',
    'Netflix 4K Ultra HD 1 Mes (1 Pantalla / Perfil)', 'Spotify Premium 3 Meses (1 Pantalla / Perfil)'
  ];
  customer_names text[] := array[
    'Carlos Andrés Restrepo', 'Valentina Gómez', 'Sebastián Morales', 'Camila Andrea Torres',
    'Mateo Rodríguez', 'Daniela Ospina', 'Alejandro Vargas', 'Sofía Hernández',
    'Juan Pablo Mejía', 'Mariana Castro', 'Santiago Ríos', 'Cliente General'
  ];
  supplier_ids text[] := array[]::text[];
  product_ids text[] := array[]::text[];
  p jsonb; s jsonb; i integer; sale_items jsonb; sale_data jsonb; sale_date timestamptz;
  price numeric; cost numeric; category text; subtitle text; p_idx integer; s_idx integer;
begin
  if auth.uid() is not null and not public.is_store_member(p_store_id) then
    raise exception 'No autorizado para poblar esta tienda';
  end if;

  if exists (select 1 from public.products where store_id = p_store_id) then
    return jsonb_build_object('seeded', false, 'reason', 'store_not_empty');
  end if;

  -- 1. Insertar Proveedores
  for i in 1..array_length(supplier_names, 1) loop
    supplier_ids := array_append(supplier_ids, 'demo-sup-' || i);
    s := jsonb_build_object(
      'id', 'demo-sup-' || i,
      'name', supplier_names[i],
      'phone', '+57 3' || (10 + i) || ' 555 ' || lpad((i * 123)::text, 4, '0'),
      'color', supplier_colors[i]
    );
    insert into public.suppliers(store_id, id, data) values (p_store_id, 'demo-sup-' || i, s);
  end loop;

  -- 2. Insertar Productos con Categorías y Atributos Modulares
  for i in 1..array_length(product_names, 1) loop
    product_ids := array_append(product_ids, 'demo-prod-' || i);
    if i <= 8 then
      category := 'Cargadores y Cables';
      price := 45000 + (i * 12000);
      cost := round(price * 0.48);
      subtitle := 'Cubo · Carga rápida';
    elsif i <= 12 then
      category := 'Forros / Fundas';
      price := 32000 + ((i - 8) * 6000);
      cost := round(price * 0.40);
      subtitle := 'Forro · Protección MagSafe';
    elsif i <= 15 then
      category := 'Audio';
      price := 580000 + ((i - 12) * 120000);
      cost := round(price * 0.70);
      subtitle := 'Audio · USB-C';
    elsif i <= 17 then
      category := 'Power Banks / Baterías portatiles';
      price := 195000 + ((i - 15) * 45000);
      cost := round(price * 0.60);
      subtitle := '10000mAh · MagSafe Inalámbrico';
    elsif i <= 21 then
      category := 'Celulares';
      price := 2250000 + ((i - 17) * 800000);
      cost := round(price * 0.82);
      subtitle := '256GB · Equipo libre';
    elsif i <= 23 then
      category := 'Perfumes';
      price := 185000 + ((i - 21) * 165000);
      cost := round(price * 0.62);
      subtitle := '100ml · Eau de Parfum (EDP)';
    else
      category := 'Streaming';
      price := 22000 + ((i - 23) * 20000);
      cost := round(price * 0.50);
      subtitle := '1 Mes · 1 Pantalla / Perfil';
    end if;

    p := jsonb_build_object(
      'id', 'demo-prod-' || i,
      'name', product_names[i],
      'category', category,
      'subtitle', subtitle,
      'price', price,
      'warrantyDays', case when category = 'Celulares' then 90 else 30 end,
      'createdAt', (now() - interval '31 days')::text,
      'batches', jsonb_build_array(
        jsonb_build_object(
          'id', 'demo-batch-' || i || '-a',
          'supplierId', supplier_ids[((i - 1) % 6) + 1],
          'cost', cost,
          'stock', 12 + (i % 8)
        ),
        jsonb_build_object(
          'id', 'demo-batch-' || i || '-b',
          'supplierId', supplier_ids[(i % 6) + 1],
          'cost', round(cost * 1.04),
          'stock', 5 + (i % 5)
        )
      )
    );
    insert into public.products(store_id, id, data) values (p_store_id, 'demo-prod-' || i, p);
  end loop;

  -- 3. Insertar 30 días de Ventas Realistas con numeración limpia (#1..#36)
  for i in 1..36 loop
    sale_date := now() - ((36 - i) * interval '20 hours');
    p_idx := ((i - 1) % array_length(product_names, 1)) + 1;
    s_idx := ((i - 1) % array_length(customer_names, 1)) + 1;

    sale_items := jsonb_build_array(
      jsonb_build_object(
        'id', 'sim-item-' || i || '-1',
        'productId', product_ids[p_idx],
        'productName', product_names[p_idx],
        'qty', 1 + (i % 2),
        'unitPrice', 65000 + (p_idx * 15000),
        'unitCostSnapshot', 34000 + (p_idx * 8000),
        'batchId', 'demo-batch-' || p_idx || '-a',
        'warrantyDays', 30,
        'warrantyClaimed', (i in (12, 27)),
        'warrantyClaimNote', case when i in (12, 27) then 'Reemplazo en garantía verificado en tienda.' else null end
      )
    );

    sale_data := jsonb_build_object(
      'id', 'sim-sale-' || i,
      'saleNumber', i,
      'customerName', customer_names[s_idx],
      'paymentMethod', case when i % 3 = 0 then 'Nequi' when i % 3 = 1 then 'Efectivo' else 'Bancolombia' end,
      'totalAmount', (1 + (i % 2)) * (65000 + (p_idx * 15000)),
      'createdAt', sale_date,
      'items', sale_items
    );

    insert into public.sales(store_id, id, sale_number, created_at, data)
    values (p_store_id, 'sim-sale-' || i, i, sale_date, sale_data);
  end loop;

  return jsonb_build_object(
    'seeded', true,
    'suppliers', array_length(supplier_names, 1),
    'products', array_length(product_names, 1),
    'sales', 36
  );
end;
$$;

revoke all on function public.seed_demo_store(uuid) from public;
grant execute on function public.seed_demo_store(uuid) to authenticated;

-- =====================================================================
-- PUBLICACIÓN DE REALTIME PARA SINCRONIZACIÓN MULTIDISPOSITIVO
-- =====================================================================
do $$
begin
  alter publication supabase_realtime add table public.suppliers;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sales;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.cycle_closings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.catalog_configs;
exception when duplicate_object then null;
end $$;
