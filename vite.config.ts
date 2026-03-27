
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1600, // Aumentado para evitar warnings innecesarios
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react', 'gsap'],
          charts: ['recharts'], // d3 es parte de recharts, mejor dejar que rollup lo maneje
          db: ['dexie', 'dexie-react-hooks', '@supabase/supabase-js'],
          pdf: ['html2canvas', 'jspdf'] // Separar las librerías pesadas de PDF si las tienes
        }
      }
    }
  }
});
