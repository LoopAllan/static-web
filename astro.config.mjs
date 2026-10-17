import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://loopallan.github.io',
  base: '/static-web/tossbox-prototype-v1',
  output: 'static',
  trailingSlash: 'always',
});
