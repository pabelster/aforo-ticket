# Aforo

Venta de boletos y validación en puerta con un QR de un solo uso.

## Requisitos

- Node.js 20 o superior
- Un proyecto en [Supabase](https://supabase.com)

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Copia el entorno y pega la URL y la anon key (`Project Settings → API`):

```bash
cp .env.example .env
```

3. En el editor SQL de Supabase, ejecuta `supabase/migrations/20260929120000_init.sql`.

4. Crea el administrador en `Authentication → Users → Add user` y desactiva el registro público.

5. Autoriza esa cuenta como staff. Sustituye el correo:

```sql
insert into public.staff (user_id)
select id from auth.users where email = 'tu-correo@ejemplo.com'
on conflict (user_id) do nothing;
```

6. Arranca la app:

```bash
npm run dev
```

Entra en `/login`. Cualquier usuario autenticado que no esté en `staff` queda fuera del panel y del escáner.

## Escáner

`/scan` abre la cámara del celular. Funciona en `localhost` o por HTTPS. Una dirección IP en HTTP no puede usar la cámara.

## Qué protege el QR

El código solo contiene un UUID (`qr_token`). El nombre y el correo viven en la base. Al escanear, `validate_ticket` marca el boleto como usado en una sola sentencia `UPDATE ... WHERE status = 'unused'`, así dos teléfonos no pueden aceptar la misma entrada a la vez.
