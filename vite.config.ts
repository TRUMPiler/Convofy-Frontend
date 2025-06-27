import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  server:{
    host:"0.0.0.0",
    fs:{
      strict: false,
    },
    proxy: {
            '/api': {
                target: 'http://3.108.249.57:8080',
                changeOrigin: true,
                secure: false, // Only for development
            },
        },
  },
  plugins: [react(), tailwindcss()],
  base: '/',
  
})
