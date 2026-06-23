# Despachr Scripts & Automation

Este directorio contiene scripts útiles para automatizar tareas comunes en el desarrollo, deployment y gestión del proyecto Despachr.

## 🚀 Scripts de Deployment

### Deploy a Producción
```bash
npm run deploy
# o
bash scripts/deploy.sh
```
Compila el proyecto y lo despliega a Vercel en producción. Verifica que no haya cambios sin commitear antes de ejecutar.

### Preview en Vercel
```bash
npm run vercel:preview
```
Crea un deployment de preview en Vercel para testear los cambios antes de producción.

### Ver Variables de Entorno
```bash
npm run vercel:list
```
Lista todas las variables de entorno configuradas en Vercel para el ambiente de producción.

---

## ⚙️ Scripts de Configuración

### Configurar Ambiente Local
```bash
npm run setup-env
# o
bash scripts/setup-env.sh
```
Configura el archivo `.env.local` con las variables de entorno necesarias. Soporta variables de entorno del sistema.

---

## 🗄️ Scripts de Base de Datos

### Crear Schema de Base de Datos
```bash
npm run db:create-tables
# o
node scripts/db-create-tables.js
```
Genera el SQL necesario para crear todas las tablas de Despachr en Supabase. Muestra el SQL que debes ejecutar manualmente en el SQL Editor de Supabase.

**Tablas creadas:**
- `users` - Usuarios del sistema
- `drivers` - Información específica de conductores
- `clients` - Clientes/empresas
- `routes` - Rutas diarias de conductores
- `deliveries` - Entregas individuales
- `events` - Historial de eventos (llegadas, salidas, fotos)
- `issues` - Problemas reportados durante entregas

---

## 🌿 Scripts de GitHub

### Crear rama de Feature
```bash
npm run gh:feature add-map-integration
# o
bash scripts/github-workflow.sh feature add-map-integration
```
Crea una nueva rama `feature/add-map-integration` y te posiciona en ella.

### Crear rama de Bugfix
```bash
npm run gh:bugfix fix-auth-redirect
# o
bash scripts/github-workflow.sh bugfix fix-auth-redirect
```
Crea una nueva rama `bugfix/fix-auth-redirect` para corregir un bug.

### Crear Pull Request
```bash
npm run gh:pr
# o
bash scripts/github-workflow.sh pr
```
Crea un pull request desde la rama actual hacia `main` y abre el navegador para revisarlo.

**Requisitos:**
- Estar en una rama que NO sea `main`
- Haber hecho commit de tus cambios

### Sincronizar con Main
```bash
npm run gh:sync
# o
bash scripts/github-workflow.sh sync
```
Actualiza la rama actual con los cambios más recientes de `main`.

### Limpiar Ramas Mergeadas
```bash
npm run gh:cleanup
# o
bash scripts/github-workflow.sh cleanup
```
Elimina todas las ramas locales y remotas que ya fueron mergeadas a `main`.

---

## 📦 Scripts de NPM

### Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Inicia el servidor de Next.js en desarrollo. Accede a `http://localhost:3000`.

### Compilar Proyecto
```bash
npm run build
```
Compila el proyecto para producción.

### Iniciar Servidor de Producción
```bash
npm run start
```
Inicia el servidor en modo de producción (requiere haber ejecutado `build`).

### Ejecutar Linter
```bash
npm run lint
```
Verifica el código con ESLint para encontrar problemas de estilo y errores.

---

## 🔧 Requisitos para los Scripts

Los scripts requieren que tengas instalados:

- **Node.js** (v18+)
- **Git**
- **GitHub CLI** (`gh`) - Para scripts de GitHub
- **Vercel CLI** (`vercel`) - Para scripts de deployment

### Instalar dependencias globales

```bash
# GitHub CLI
brew install gh

# Vercel CLI
npm install -g vercel
```

### Autenticación

Los scripts requieren que estés autenticado:

```bash
# GitHub
gh auth login

# Vercel
vercel login
```

---

## 📝 Workflow Recomendado

### Crear una nueva feature
```bash
# 1. Crear rama
npm run gh:feature my-feature

# 2. Hacer cambios y commitear
git commit -m "Add my feature"

# 3. Crear pull request
npm run gh:pr

# 4. Después de mergedear
npm run gh:cleanup
```

### Deploying a Producción
```bash
# 1. Asegurate de estar en main
git checkout main

# 2. Sincroniza con los cambios remotos
npm run gh:sync

# 3. Despliega a producción
npm run deploy
```

---

## 🆘 Troubleshooting

### Los scripts no se ejecutan
Verifica que tengan permisos de ejecución:
```bash
chmod +x scripts/*.sh
```

### Vercel CLI no encontrado
Instala Vercel globalmente:
```bash
npm install -g vercel
```

### GitHub CLI no encontrado
Instala GitHub CLI:
```bash
brew install gh
```

### Autenticación de GitHub
Vuelve a autenticarte:
```bash
gh auth logout
gh auth login
```

---

## 📚 Documentación Relacionada

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub CLI Manual](https://cli.github.com/manual)
- [Next.js Documentation](https://nextjs.org/docs)
