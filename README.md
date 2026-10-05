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

4. Crea el administrador en `Authentication → Users → Add user` (elige **Create a new user**, no Invite). Marca **Auto Confirm User**, pon correo y contraseña, y guarda. En `Authentication → URL Configuration` deja:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** `http://localhost:5173/**`
   Desactiva el registro público en Email si puedes.

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

`/scan` abre la cámara del celular. La cámara exige HTTPS.

En la PC:

```bash
npm run dev
```

En el celular, misma Wi‑Fi, abre la URL **Network** que imprime Vite, por ejemplo:

`https://192.168.68.107:5173/scan`

Acepta el aviso del certificado (es local). Si la página no carga, en Windows permite el puerto 5173 en el firewall privado.

## Qué protege el QR

El código solo contiene un UUID (`qr_token`). El nombre y el correo viven en la base. Al escanear, `validate_ticket` marca el boleto como usado en una sola sentencia `UPDATE ... WHERE status = 'unused'`, así dos teléfonos no pueden aceptar la misma entrada a la vez.
