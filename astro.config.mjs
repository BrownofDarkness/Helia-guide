// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://helia-52w.pages.dev',
  integrations: [
    starlight({
      title: 'Helia',
      description:
        'Helia — guide francophone du développeur web. 17 axes, 5 parcours immersifs, de zéro à compétent.',
      locales: {
        root: { label: 'Français', lang: 'fr' },
      },
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        // `rel="icon"` est le standard moderne (Chrome le préfère à shortcut icon).
        // Le `?v=2` casse le cache navigateur lorsqu'on met à jour le SVG.
        {
          tag: 'link',
          attrs: { rel: 'icon', href: '/favicon.svg?v=2', type: 'image/svg+xml' },
        },
      ],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      components: {
        Head: './src/components/StarlightHead.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        Footer: './src/components/StarlightFooter.astro',
      },
      sidebar: [
        {
          label: '📖 Préambule',
          link: '/00-preambule/',
        },
        {
          label: '💾 Axe 1 — Fondations informatiques',
          collapsed: true,
          autogenerate: { directory: '01-fondations' },
        },
        {
          label: '🌐 Axe 2 — Comment fonctionne le Web',
          collapsed: true,
          autogenerate: { directory: '02-web' },
        },
        {
          label: '📐 Axe 3 — Analyse & conception',
          collapsed: true,
          autogenerate: { directory: '03-analyse-conception' },
        },
        {
          label: '🛠 Axe 4 — Outils du développeur',
          collapsed: true,
          autogenerate: { directory: '04-outils' },
        },
        {
          label: '🎨 Axe 5 — Frontend : HTML & CSS',
          collapsed: true,
          autogenerate: { directory: '05-frontend-html-css' },
        },
        {
          label: '⚡ Axe 6 — JavaScript & TypeScript',
          collapsed: true,
          autogenerate: { directory: '06-javascript-typescript' },
        },
        {
          label: '⚛ Axe 7 — Frameworks frontend',
          collapsed: true,
          autogenerate: { directory: '07-frameworks-frontend' },
        },
        {
          label: '🚀 Axe 8 — Backend (multi-langages)',
          collapsed: true,
          autogenerate: { directory: '08-backend' },
        },
        {
          label: '🗄 Axe 9 — Bases de données',
          collapsed: true,
          autogenerate: { directory: '09-bases-de-donnees' },
        },
        {
          label: '☁ Axe 10 — BaaS & services managés',
          collapsed: true,
          autogenerate: { directory: '10-baas' },
        },
        {
          label: '✅ Axe 11 — Qualité & tests',
          collapsed: true,
          autogenerate: { directory: '11-qualite-tests' },
        },
        {
          label: '🔐 Axe 12 — Sécurité applicative',
          collapsed: true,
          autogenerate: { directory: '12-securite' },
        },
        {
          label: '📊 Axe 13 — Performance & accessibilité',
          collapsed: true,
          autogenerate: { directory: '13-performance-a11y' },
        },
        {
          label: '🚢 Axe 14 — DevOps & exploitation',
          collapsed: true,
          autogenerate: { directory: '14-devops' },
        },
        {
          label: '🤝 Axe 15 — Méthodes & soft skills',
          collapsed: true,
          autogenerate: { directory: '15-methodes-soft-skills' },
        },
        {
          label: '🔬 Axe 16 — Spécialisations',
          collapsed: true,
          autogenerate: { directory: '16-specialisations' },
        },
        {
          label: '💼 Axe 17 — Carrière & parcours',
          collapsed: true,
          autogenerate: { directory: '17-carriere' },
        },
      ],
    }),
  ],
});
