# PWA Baterías

Aplicación Progressive Web App (PWA) para inspección y registro de baterías. Funciona completamente offline con sincronización automática cuando hay conexión.

## 🚀 Características

- ✅ Funciona completamente offline
- ✅ Sincronización automática con Google Apps Script
- ✅ Instalable en dispositivos móviles y desktop
- ✅ Caché inteligente de recursos
- ✅ Referencias de baterías personalizadas (IndexedDB)
- ✅ Validación de rangos (carga, peso, días)
- ✅ Interfaz responsive

## 📦 Tecnologías

- React 19 + TypeScript
- Vite 7
- Service Workers (offline-first)
- IndexedDB (almacenamiento local)
- CSS modular

## 🛠️ Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm preview
```

## 🌐 Deploy

### Opción 1: GitHub Actions (Automático)

1. Sube tu código a GitHub
2. Ve a Settings → Pages → Source → GitHub Actions
3. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente en cada push a `main`

### Opción 2: Deploy manual con gh-pages

```bash
npm run deploy
```

### Configuración

La app está configurada para desplegarse en: **https://j4x0-o2.github.io/Baterias/**

- `base: '/Baterias/'` en `vite.config.ts`
- Service Worker con scope dinámico
- Manifest con rutas relativas

## 📱 Instalación PWA

Una vez desplegada, los usuarios pueden:
1. Abrir la app en Chrome/Edge/Safari
2. Click en "Instalar" o "Agregar a pantalla de inicio"
3. Usar como app nativa

## 📂 Estructura

```
src/
├── components/       # Componentes UI
├── modules/         
│   ├── database/    # IndexedDB
│   ├── references/  # Referencias de baterías
│   ├── sync/        # Sincronización
│   └── types/       # TypeScript types
└── pwa/             # Utilidades PWA
public/
├── pwa/             # Service Workers
│   ├── sw.js
│   ├── swCache.js
│   └── swOffline.js
└── manifest.json    # PWA manifest
```

## 🔧 Configuración de Sincronización

Actualiza la URL de tu Google Apps Script en `src/modules/sync/api.ts`:

```typescript
const API_URL = 'TU_URL_DE_GOOGLE_APPS_SCRIPT';
```

---
