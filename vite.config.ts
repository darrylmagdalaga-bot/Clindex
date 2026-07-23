import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx'],
  },
  server: {
    port: 6173,
    open: true,
  },
})