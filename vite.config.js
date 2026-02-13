import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Bu kütüphaneyi önbelleğe alma, olduğu gibi kullan diyoruz
    exclude: ['react-qr-scanner'],
  },
});
