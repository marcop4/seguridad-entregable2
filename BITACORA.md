# 📓 Bitácora del Sistema Sentinel (Memoria Principal)

> **⚠️ INSTRUCCIÓN PARA LA IA (CONTEXTO DE RESTAURACIÓN):**
> Si estás leyendo esto, significa que el contexto anterior se ha reiniciado o "has perdido la memoria". **No te preocupes.** Estás trabajando en el proyecto **Sentinel**, un sistema web de grado empresarial centrado en ciberseguridad, gestión de identidades y monitoreo (SOC - Security Operations Center). Lee cuidadosamente este documento para retomar tu rol como Desarrollador Senior y continuar asistiendo a Marco.

---

## 🏗️ 1. Arquitectura y Stack Tecnológico
- **Frontend:** React + TypeScript, empaquetado con Vite.
- **Estilos:** Tailwind CSS (diseño *Mobile-First*, tema oscuro por defecto, estética *Glassmorphism* y SOC corporativo).
- **Íconos:** `lucide-react`.
- **Backend:** Node.js con Express (todo centralizado en `server.ts`).
- **Base de Datos:** Local en formato JSON (`database.json`), lo cual permite portabilidad rápida en la fase de desarrollo. (No se trackea en Git por seguridad).
- **Despliegue Temporal:** `localtunnel` (puerto 3000) para pruebas en vivo.

---

## 🔐 2. Características Core Implementadas (El Entregable de la Unidad II)

Sentinel no es un CRUD básico, es un sistema con rigurosos estándares de seguridad informática.

### A. Autenticación y Criptografía
- **Credenciales Locales:** Almacenamiento de contraseñas usando **BCrypt con factor de costo 10**. 
- **SSO Google (Federado):** Integración activa con OAuth 2.0 (`@react-oauth/google`). Los usuarios federados no almacenan hash local y el sistema sabe distinguirlos en las tablas de auditoría (etiqueta `OAUTH2_FEDERATED`).
- **Control de Sesión Única:** Se implementó un sistema de **Server-Sent Events (SSE)**. Si un usuario (ej. Chrome) tiene sesión activa y se inicia otra sesión con la misma cuenta (ej. Celular), el servidor mata el token de la sesión antigua y le envía un evento de revocación en tiempo real, expulsándolo del sistema con una alerta en pantalla.

### B. Control de Acceso Basado en Roles (RBAC)
El sistema cuenta con un modelo jerárquico estricto (del 1 al 5):
1. **Nivel 1 (Usuario):** Acceso estándar.
2. **Nivel 2 (Soporte):** Acceso limitado a herramientas de ayuda.
3. **Nivel 3 (Auditor):** Solo lectura de logs, SIEM, consola de pruebas y auditoría criptográfica. (Añadido recientemente).
4. **Nivel 4 (Moderador):** Puede gestionar usuarios básicos pero no puede ver hashes ni realizar tareas críticas.
5. **Nivel 5 (SuperAdmin):** Acceso absoluto (gestión de roles, expulsión remota, reseteo de claves).

### C. Módulos del Frontend (Directorio: `src/components/`)
- `App.tsx`: Contenedor principal, gestiona el login, la sesión única (SSE), el enrutamiento de vistas y la barra de navegación responsive (con scrollbar horizontal elegante).
- `AdminPanel.tsx`: El Hub central para los niveles superiores (3, 4 y 5).
- `admin/PanelAuditoriaCifrado.tsx`: Tabla de hashes (BCrypt vs Google). Refactorizada recientemente para ser **Mobile-First** (la tabla desaparece en celular y se reemplaza por tarjetas verticales limpias sin el hash enorme).
- `admin/PanelGestorUsuarios.tsx`: CRUD de usuarios.
- `admin/PanelRolesJerarquia.tsx`: Panel drag/drop o de gestión de niveles.
- `TestAutomation.tsx`: Suite de pruebas unitarias visual para el usuario Auditor.
- `ManualTabs.tsx`: Componente de documentación técnica y manual de usuario integrado en la plataforma.

---

## 🛠️ 3. Reglas Críticas del Proyecto (User Global Rules)
Para mantener el flujo de trabajo de Marco, debes obedecer lo siguiente:
1. **Protocolo de Seguridad:** Antes de modificar archivos, comandos o Git, se debe presentar un resumen y esperar el "Dale" o "Procede". (Excepción: cuando te piden hacer tareas directas de código que no afectan infraestructura).
2. **Tono Mixto:** Trato informal y cercano, pero **estrictamente técnico y preciso** en la nomenclatura. Siempre en Español.
3. **Entorno de Trabajo:** `D:\tareas-proyectos\sentinel`. (No confundir con el D:\AUDITORIA que es para hacking).
4. **Protección:** NUNCA quemes credenciales ni subas `database.json` a repositorios públicos.

---

## ⏱️ 4. Últimas Tareas Realizadas (Punto de Guardado)
1. **Fix de Permisos del Auditor (Nivel 3):** Se arregló un bug donde el Auditor no podía ejecutar pruebas unitarias. Se reinició el backend/localtunnel y se le dio el permiso adecuado.
2. **Refactorización de Hashes para Google:** Se modificó `/api/admin/password-hashes` (en `server.ts`) para incluir el `authType`. Ahora el frontend muestra una insignia azul `"OAUTH2_FEDERATED"` en lugar de `BCRYPT_BLOWFISH` para usuarios de Google.
3. **UX Mobile en Navegación:** Se le agregó una clase global `.thin-scrollbar` a la navegación en `App.tsx` para que en móviles sea obvio que hay un scroll horizontal.
4. **Mobile-First en Tabla de Hashes:** Se ocultó la tabla grande en pantallas pequeñas (`hidden md:table`) y se creó un bloque de tarjetas (divs apilados) amigable para celulares.
5. **Limpieza del Manual:** Se eliminó por completo del código fuente (`ManualTabs.tsx`) cualquier evidencia o texto que mencionara que el sistema se probó en *Google Cloud Run* o *AI Studio*, tal como lo solicitó Marco.

---

## 🔑 5. Credenciales de Prueba (Por Defecto)
Si se borra el archivo `database.json`, el sistema generará automáticamente las siguientes cuentas semilla. La contraseña para **TODAS** ellas es `password123`:

- **Nivel 5 (SuperAdmin):** `root@sentinel.ai` / `root_global`
- **Nivel 4 (Moderador):** `admin@sentinel.ai` / `admin_local`
- **Nivel 3 (Auditor):** `auditor@sentinel.ai` / `auditor_siem`
- **Nivel 1 (Usuario):** `user@sentinel.ai` / `guest_user`

---

## 🚀 6. Cómo Retomar el Trabajo
1. Asume inmediatamente tu rol: Eres **Antigravity**, el desarrollador Senior.
2. Reconoce el entorno: Estás en Windows (PowerShell). Usa comandos compatibles (ej. `Get-Content`, `Select-String`). Evita bash puro.
3. Espera las instrucciones del usuario (Marco) y apóyate en el código en `src/` o `server.ts` para continuar.

> *"Memoria guardada exitosamente. Listo para el siguiente ciclo de desarrollo."*
