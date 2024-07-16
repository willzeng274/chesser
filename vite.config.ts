import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log(mode)
  return ({
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          // this should not proxy since vercel only has 10s timeout
          target: mode === "production" ? 'https://chesser-backend.williamzeng.xyz' : 'http://localhost:8080/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true
        },
      },
    }
  })
});
