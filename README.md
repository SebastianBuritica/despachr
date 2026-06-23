# Despachr - PWA de Gestión Logística

Despachr es una Progressive Web Application (PWA) moderna para gestión logística de empresas de transporte de carga en Colombia y Latinoamérica. Digitaliza operaciones, elimina el uso de Excel y WhatsApp, y proporciona control en tiempo real de rutas y entregas.

## Características

- **Para Conductores**: Aplicación móvil para gestionar entregas, registrar llegadas/salidas, capturar pruebas fotográficas
- **Para Coordinadores**: Panel web para monitoreo en tiempo real de conductores y rutas
- **Para Administradores**: Dashboard de indicadores, reportes de cumplimiento, gestión de clientes y conductores

## Tech Stack

- **Frontend**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Deploy**: Vercel
- **Storage**: Supabase Storage

## Instalación

### Requisitos previos

- Node.js 18+
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd despachr
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```
   Edita `.env.local` con tus credenciales de Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de Supabase

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
despachr/
├── app/
│   ├── (auth)/              # Rutas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/         # Panel coordinador/admin
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (driver)/            # Vista del conductor (mobile-first)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── api/                 # API routes
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Layout raíz
├── components/
│   ├── ui/                  # Componentes base reutilizables
│   ├── layout/              # Header, Sidebar
│   ├── driver/              # Componentes específicos del conductor
│   └── dashboard/           # Componentes del panel
├── lib/
│   ├── supabase.ts          # Cliente de Supabase
│   └── utils.ts             # Utilidades generales
├── types/
│   └── index.ts             # Tipos TypeScript
├── hooks/                   # Custom hooks
├── public/                  # Assets estáticos
├── tailwind.config.ts       # Configuración de Tailwind
├── next.config.ts           # Configuración de Next.js
├── middleware.ts            # Middleware de Next.js
└── .env.local.example       # Variables de entorno ejemplo
```

## Scripts disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para producción
npm run start    # Inicia servidor de producción
npm run lint     # Ejecuta linter
```

## Paleta de Colores

- **Primario**: `#0F6E56` (Verde oscuro)
- **Secundario**: `#1D9E75` (Verde claro)
- **Fondo**: `#F8FAFC` (Gris muy claro)

## Próximos Pasos

- [ ] Integración completa con Supabase (auth, database, realtime)
- [ ] API endpoints para gestión de rutas y entregas
- [ ] Geolocalización en tiempo real
- [ ] Integración con Google Maps/Mapbox
- [ ] Sistema de notificaciones
- [ ] Generación de reportes
- [ ] Sincronización offline
- [ ] PWA instalable

## Desarrollo

Este boilerplate proporciona una estructura sólida para comenzar. Todos los componentes UI están listos para ser utilizados y extendidos.

### Agregar una nueva página

1. Crea la carpeta bajo la ruta correspondiente en `app/`
2. Crea el archivo `page.tsx`
3. Importa y usa los componentes necesarios de `components/`

### Agregar un nuevo componente

1. Crea el archivo en la carpeta apropiada bajo `components/`
2. Exporta como componente React
3. Úsalo en las páginas

## Deploy en Vercel

El proyecto está configurado para deployarse en Vercel:

```bash
# Push a GitHub y conecta el repositorio en Vercel
# Las variables de entorno se configuran en el dashboard de Vercel
```

## Licencia

MIT
