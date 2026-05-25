-- Habilitar extensión UUID si no existe
create extension if not exists "uuid-ossp";

-- 1. Tabla: custom_roles
create table if not exists public.custom_roles (
    id text primary key,
    name text not null,
    key text not null unique,
    description text,
    "privilegeLevel" int default 1,
    "createdAt" timestamp with time zone default now()
);

-- Insertar roles por defecto
insert into public.custom_roles (id, name, key, description, "privilegeLevel") values
('role-admin', 'Administrador', 'admin', 'Acceso total al sistema y gestión de usuarios (Nivel 1).', 5),
('role-moderator', 'Moderador', 'moderator', 'Gestión de accesos y monitoreo SIEM (Nivel 2).', 3),
('role-user', 'Usuario', 'user', 'Usuario estándar con privilegios de lectura básica (Nivel 3).', 1)
on conflict (key) do nothing;

-- 2. Tabla: users
-- Relacionada con auth.users de Supabase
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    username text unique not null,
    "fullName" text not null,
    role text references public.custom_roles(key) default 'user',
    "avatarUrl" text,
    "isLocked" boolean default false,
    "lockedUntil" timestamp with time zone,
    "failedAttempts" int default 0,
    "activeSessionId" text,
    "activeSessionBrowser" text,
    "activeSessionIp" text,
    "activeSessionStartedAt" timestamp with time zone,
    "authType" text default 'local',
    "createdAt" timestamp with time zone default now()
);

-- 3. Tabla: audit_logs
create table if not exists public.audit_logs (
    id text primary key,
    timestamp timestamp with time zone default now(),
    "userId" uuid references public.users(id) on delete set null,
    username text,
    action text not null,
    status text not null,
    "ipAddress" text,
    "userAgent" text,
    details text,
    location text,
    "countryCode" text
);

-- 4. Tabla: security_logs
create table if not exists public.security_logs (
    id text primary key,
    "userId" uuid references public.users(id) on delete set null,
    username text,
    "eventType" text not null,
    "ipAddress" text,
    "createdAt" timestamp with time zone default now()
);

-- 5. Tabla: notifications
create table if not exists public.notifications (
    id text primary key,
    timestamp timestamp with time zone default now(),
    type text not null,
    title text not null,
    message text not null,
    read boolean default false
);

-- 6. Opcional: Tabla email_sandbox_items si tu app la necesita
create table if not exists public.email_sandbox_items (
    id text primary key,
    "to" text not null,
    subject text not null,
    body text not null,
    token text,
    timestamp timestamp with time zone default now(),
    used boolean default false
);

-- 7. Trigger para crear automáticamente el perfil de usuario en public.users 
-- cuando un usuario se registra por Google o Correo a través de Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
declare
    generated_username text;
    full_name text;
    avatar_url text;
begin
    -- Extraer nombre y avatar desde los metadatos si vienen de Google OAuth
    full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://api.dicebear.com/7.x/initials/svg?seed=' || full_name);
    
    -- El username no puede ser nulo en nuestra tabla, generamos uno a partir del email
    generated_username := split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4);

    insert into public.users (id, email, username, "fullName", "avatarUrl", "authType")
    values (
        new.id, 
        new.email, 
        generated_username, 
        full_name,
        avatar_url,
        case when new.raw_app_meta_data->>'provider' = 'google' then 'google' else 'local' end
    );
    return new;
end;
$$ language plpgsql security definer;

-- Ligar el trigger a la tabla auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Deshabilitar Row Level Security (RLS) para simplificar la migración inicial 
-- ya que Express manejará la seguridad.
alter table public.users disable row level security;
alter table public.audit_logs disable row level security;
alter table public.security_logs disable row level security;
alter table public.notifications disable row level security;
alter table public.custom_roles disable row level security;
alter table public.email_sandbox_items disable row level security;
