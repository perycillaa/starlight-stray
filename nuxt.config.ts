export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: false,
  runtimeConfig: {
    tidbHost: process.env.TIDB_HOST || '',
    tidbPort: Number(process.env.TIDB_PORT || 4000),
    tidbUser: process.env.TIDB_USER || '',
    tidbPassword: process.env.TIDB_PASSWORD || '',
    tidbDatabase: process.env.TIDB_DATABASE || 'starlight_stray'
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Starlight Stray — Petualangan Kucing Malam 2D Pixel Platformer',
      htmlAttrs: {
        lang: 'id'
      },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap'
        }
      ],
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        {
          name: 'description',
          content: 'Starlight Stray — Game 2D Pixel Platformer petualangan kucing di malam hari berbasis Nuxt 4 dan HTML5 Canvas.'
        },
        { name: 'theme-color', content: '#120a24' }
      ]
    }
  }
})
