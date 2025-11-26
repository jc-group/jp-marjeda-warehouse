# JP Marjeda Warehouse

Guía rápida para personas de negocio y operaciones. Aquí encuentras qué hace el sistema, qué roles existen y cómo usarlo día a día.

## ¿Para qué sirve?

- Controlar inventario en Supabase: productos, ubicaciones y movimientos.
- Registrar productos nuevos y, opcionalmente, darles ingreso inicial.
- Crear ubicaciones (racks, pasillos, zonas) y usuarios con roles.
- Consultar datos clave desde navegador, con sesión segura.

## Acceso y roles

- **Inicio de sesión:** usa tu correo y contraseña de Supabase Auth en `/login`.
- **Roles:** `admin` (todo acceso), `operador` (operaciones diarias), `auditor` (solo lectura).
- **Protección:** todas las páginas requieren sesión; si no la tienes, el sistema redirige a `/login`.
- **Invitaciones:** enlaces de invitación confirman correo y piden definir contraseña en `/update-password`.

## Secciones disponibles

- **Dashboard / Inventario actual:** lista productos con cantidades y ubicaciones. Si tu dispositivo lo soporta, puedes escanear códigos para movimientos.
- **Movimientos:** historial (en preparación).
- **Registrar producto:** alta de SKU, costos, divisa, proveedor e imagen; permite mover stock inicial a una ubicación.
- **Ubicaciones:** crea códigos de ubicación con su tipo (rack, floor, dock, quarantine).
- **Proveedores, Reportes, Configuración:** placeholders por ahora.
- **Usuarios y roles:** alta rápida de cuentas (solo Admin).
- **Perfil:** actualiza nombre, usuario interno, rol visible y estado activo.

## Flujos principales

- **Entrar al sistema:** ve a `/login`, ingresa credenciales; si son válidas, irás a Inventario.
- **Registrar producto:** completa SKU, nombre, costos y divisa; adjunta foto si quieres. Si defines ubicación y cantidad inicial, se genera movimiento de entrada.
- **Registrar movimiento:** desde Inventario pulsa “+ Nuevo ingreso”, escribe o escanea SKU, ubicación y cantidad; guarda para crear el movimiento (solo admin/operador).
- **Crear ubicación:** en “Ubicaciones” define código y tipo; guarda.
- **Crear usuario:** en “Usuarios y Roles” ingresa email, contraseña y rol; el usuario recibirá invitación y podrá definir su contraseña.

## Requisitos previos (setup del entorno)

Si administras la instancia (no es necesario para usuarios finales):

- Tener proyecto Supabase con tablas `products`, `inventory`, `locations`, `movements`, `user_profiles`, `suppliers`, `currency_rates`, y RPC `move_inventory`.
- Variables de entorno configuradas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (para uso diario) y `SUPABASE_SERVICE_ROLE_KEY` (solo para creación de usuarios).
- Bucket de storage `products` para subir imágenes; existe una imagen por defecto `default.webp`.

## Ayuda

- Problemas de acceso: valida correo/contraseña o pide a un Admin que confirme tu rol en `user_profiles`.
- Si no ves datos o recibes “Acceso denegado”, revisa tu rol o vuelve a iniciar sesión.
- Para soporte técnico, comparte la hora y la acción que estabas realizando y cualquier mensaje de error mostrado.***
