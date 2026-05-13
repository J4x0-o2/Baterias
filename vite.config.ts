import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { readFileSync, writeFileSync } from 'node:fs'

// Reemplaza el placeholder __SW_BUILD_VERSION__ en cache-strategies.js con un timestamp
// generado en el momento del build. Así cada `npm run build` invalida el caché del SW
// automáticamente sin requerir bump manual de versión.
function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version',
    apply: 'build',
    closeBundle() {
      const version = `v${Date.now()}`;
      const file = `${process.cwd()}/dist/cache-strategies.js`;
      const src = readFileSync(file, 'utf-8');
      writeFileSync(file, src.replace('__SW_BUILD_VERSION__', version));
    },
  };
}

export default defineConfig(({ command }) => ({
  base: '/Baterias/',
  plugins: [react(), swVersionPlugin()],
  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
}))
