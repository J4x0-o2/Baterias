import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/Baterias/',
  plugins: [react()],
  esbuild: {
    // Strip all console.* and debugger statements from production builds
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
}))
