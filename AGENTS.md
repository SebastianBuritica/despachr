# Despachr Agents & Skills

Documentación de agentes, skills y automatizaciones disponibles en Despachr.

## 🤖 Skills de Claude Code

Los siguientes skills están configurados en `.claude/settings.json` y pueden usarse directamente en Claude Code:

### 📦 Deployment & Vercel

#### `/deploy-vercel`
Despliega los cambios a Vercel en producción.
```bash
vercel deploy --prod
```
- Verifica que el build sea exitoso
- Despliega a la URL de producción: https://despachr.vercel.app

#### `/preview-vercel`
Crea un deployment de preview en Vercel.
```bash
vercel deploy
```
- Útil para testear cambios antes de enviarlos a producción
- Genera una URL única de preview

#### `/env-vercel`
Lista las variables de entorno configuradas en Vercel.
```bash
vercel env list production
```

### 📊 Supabase

#### `/supabase-status`
Verifica el estado del proyecto Supabase.
- Muestra información del proyecto: nombre, estado, región
- Requiere `SUPABASE_ACCESS_TOKEN` en el ambiente

### 🐙 GitHub

#### `/github-pr-create`
Crea un pull request en GitHub.
- Requiere: `--title` y `--body`
- Automáticamente usa la rama actual como origen
- Abre el PR en el navegador después de crearlo

#### `/github-pr-list`
Lista todos los pull requests abiertos.
- Muestra estado, reviews y cambios
- Útil para revisar el estado del proyecto

#### `/github-issue-create`
Crea un issue en GitHub.
- Requiere: `--title` y `--body`
- Aparece inmediatamente en el repo

### 🔨 Build & Development

#### `/build-local`
Compila el proyecto localmente.
```bash
npm run build
```
- Verifica que no haya errores de TypeScript
- Optimiza assets para producción
- Genera carpeta `.next/`

#### `/dev-server`
Inicia el servidor de desarrollo.
```bash
npm run dev
```
- Accesible en http://localhost:3000
- Soporta hot reload
- Muestra errores en tiempo real

#### `/lint-check`
Ejecuta ESLint para validar el código.
```bash
npm run lint
```

## 📝 Scripts Ejecutables

En la carpeta `scripts/` hay scripts útiles para tareas específicas:

### Deploy Script
**Archivo:** `scripts/deploy.sh`
```bash
npm run deploy
```
Automatiza el deployment a Vercel.

### GitHub Workflow Helper
**Archivo:** `scripts/github-workflow.sh`
```bash
npm run gh:feature <name>    # Crear rama de feature
npm run gh:bugfix <name>     # Crear rama de bugfix
npm run gh:pr                # Crear pull request
npm run gh:sync              # Sincronizar con main
npm run gh:cleanup           # Limpiar ramas mergeadas
```

### Database Setup
**Archivo:** `scripts/db-create-tables.js`
```bash
npm run db:create-tables
```
Genera el SQL para crear todas las tablas en Supabase.

### Environment Setup
**Archivo:** `scripts/setup-env.sh`
```bash
npm run setup-env
```
Configura el archivo `.env.local`.

## 🎯 Todos los Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run build            # Compila el proyecto
npm run start            # Inicia servidor de producción
npm run lint             # Ejecuta linter

# Deployment
npm run deploy           # Despliega a Vercel (producción)
npm run vercel:preview   # Preview en Vercel
npm run vercel:prod      # Despliega a producción
npm run vercel:list      # Lista variables de entorno

# GitHub Workflow
npm run gh:feature       # Crea rama de feature
npm run gh:bugfix        # Crea rama de bugfix
npm run gh:pr            # Crea pull request
npm run gh:sync          # Sincroniza con main
npm run gh:cleanup       # Limpia ramas mergeadas

# Database
npm run db:create-tables # Crea schema en Supabase

# Setup
npm run setup-env        # Configura variables de entorno
```

## 📚 Documentación Completa

Ver [`scripts/README.md`](scripts/README.md) para documentación detallada de todos los scripts.
