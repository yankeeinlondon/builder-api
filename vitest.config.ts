/// <reference types="vitest" />
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Markdown from "vite-plugin-md";

// used for testing, library code uses TSUP to build exports
export default defineConfig({

  plugins: [

    Markdown({
      excerpt: true,
      exposeExcerpt: true,
    }),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }) as any,
  ],
});
