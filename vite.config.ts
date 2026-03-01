
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react', 'gsap'],
          charts: ['recharts', 'd3-shape', 'd3-interpolate'],
          db: ['dexie', 'dexie-react-hooks', '@supabase/supabase-js']
        }
      }
    }
  }
});
