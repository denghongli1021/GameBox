import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ 注意：這裡要填入您的 GitHub Repository 名稱，前後都要有斜線
  base: '/GameBox/', 
})