
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  // Strip console.log/warn/error and debugger from production builds
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react', 'gsap'],
          charts: ['recharts'],
          db: ['dexie', 'dexie-react-hooks', '@supabase/supabase-js'],
          pdf: ['html2canvas', 'jspdf']
        }
      }
    }
  }
});
