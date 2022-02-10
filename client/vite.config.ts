/// <reference types="vitest" />
import { defineConfig } from "vite";
import dotenv from 'dotenv';
dotenv.config();


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    globals: true,
  },
});
