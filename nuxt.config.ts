// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: {
      API_URL: process.env.API_URL
    }
  },
  css: ['~/assets/style/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: ["@nuxt/icon",],
})