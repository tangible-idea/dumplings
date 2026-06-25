import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0 바인딩 → 같은 WiFi망의 폰에서 접속 가능
  },
  preview: {
    host: true,
  },
});
