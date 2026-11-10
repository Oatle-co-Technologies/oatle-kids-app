import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',workers:1,use:{baseURL:'http://127.0.0.1:4178',headless:true},webServer:{command:'VITE_SUPABASE_URL=https://test.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=test-key npm run dev -- --host 127.0.0.1 --port 4178',url:'http://127.0.0.1:4178/app.html',reuseExistingServer:false},reporter:'list'});
