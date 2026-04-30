import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/webhook': {
          target: 'https://tennie-burseraceous-lavone.ngrok-free.dev',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
