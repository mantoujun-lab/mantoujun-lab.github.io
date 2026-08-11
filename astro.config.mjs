// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import minifyHtml from 'astro-minify-html-swc';

// https://astro.build/config
export default defineConfig({
  // 注意：minifyHtml 必须放在 integrations 数组最后
  integrations: [minifyHtml()],
  vite: {
    plugins: [tailwindcss()],
  },
});