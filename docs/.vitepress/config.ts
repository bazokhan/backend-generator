import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'TGraph',
  description: 'Transform your Prisma schema into production-ready NestJS APIs and React Admin dashboards',

  base: '/backend-generator/',

  ignoreDeadLinks: [
    // Localhost links in examples are expected
    /^http:\/\/localhost/,
    // CHANGELOG not committed to docs
    /CHANGELOG/,
  ],

  head: [['link', { rel: 'icon', href: '/logo.png' }]],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'TGraph',

    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Recipes', link: '/recipes/' },
      { text: 'Reference', link: '/cli-reference' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/trugraph/backend-generator' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@tgraph/backend-generator' },
        ],
      },
    ],

    sidebar: {
      '/getting-started': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation & Setup', link: '/getting-started' },
            { text: 'Quick Start Tutorial', link: '/quick-start' },
          ],
        },
      ],
      '/quick-start': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation & Setup', link: '/getting-started' },
            { text: 'Quick Start Tutorial', link: '/quick-start' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Overview', link: '/guides/' },
            { text: 'Prisma Setup', link: '/guides/prisma-setup' },
            { text: 'Field Directives', link: '/guides/field-directives' },
            { text: 'Authentication Guards', link: '/guides/authentication-guards' },
            { text: 'Static Files', link: '/guides/static-files' },
            { text: 'Customization', link: '/guides/customization' },
            { text: 'Component Customization', link: '/guides/component-customization' },
            { text: 'Naming Conventions', link: '/guides/naming-conventions' },
            { text: 'Dashboard Types', link: '/guides/dashboard-types' },
            { text: 'Diagnostics', link: '/guides/diagnostics' },
            { text: 'End-to-End Tutorial', link: '/guides/end-to-end-tutorial' },
          ],
        },
      ],
      '/recipes/': [
        {
          text: 'Recipes',
          items: [
            { text: 'Overview', link: '/recipes/' },
            { text: 'Basic CRUD', link: '/recipes/basic-crud' },
            { text: 'Custom Validation', link: '/recipes/custom-validation' },
            { text: 'Custom Endpoints', link: '/recipes/custom-endpoints' },
            { text: 'Custom Components', link: '/recipes/custom-components' },
            { text: 'Extending Generated Code', link: '/recipes/extending-generated-code' },
            { text: 'File Uploads', link: '/recipes/file-uploads' },
            { text: 'Multiple APIs', link: '/recipes/multiple-apis' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Todo App', link: '/examples/todo-app' },
            { text: 'Blog', link: '/examples/blog' },
            { text: 'E-commerce RBAC', link: '/examples/ecommerce-rbac' },
          ],
        },
      ],
      '/cli-reference': [
        {
          text: 'Reference',
          items: [
            { text: 'CLI Reference', link: '/cli-reference' },
            { text: 'SDK Reference', link: '/sdk-reference' },
            { text: 'Configuration', link: '/api/configuration' },
            { text: 'Generators API', link: '/api/generators' },
            { text: 'Parsers API', link: '/api/parsers' },
            { text: 'Utilities API', link: '/api/utilities' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Reference',
          items: [
            { text: 'CLI Reference', link: '/cli-reference' },
            { text: 'SDK Reference', link: '/sdk-reference' },
            { text: 'Configuration', link: '/api/configuration' },
            { text: 'Generators API', link: '/api/generators' },
            { text: 'Parsers API', link: '/api/parsers' },
            { text: 'Utilities API', link: '/api/utilities' },
          ],
        },
      ],
      '/generated-output/': [
        {
          text: 'Generated Output',
          items: [
            { text: 'Overview', link: '/generated-output/' },
            { text: 'API Files', link: '/generated-output/api' },
            { text: 'DTOs', link: '/generated-output/dtos' },
            { text: 'Dashboard', link: '/generated-output/dashboard' },
            { text: 'Init Files', link: '/generated-output/init' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Philosophy', link: '/architecture/philosophy' },
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/trugraph/backend-generator/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/trugraph/backend-generator' }],

    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2024 Mohamed Elbaz',
    },

    search: {
      provider: 'local',
    },
  },
});
