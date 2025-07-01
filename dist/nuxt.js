import {
  vite_default
} from "./chunk-RC3Z2JMR.js";
import {
  webpack_default
} from "./chunk-JPV456KZ.js";
import "./chunk-NJFSC2GB.js";

// src/nuxt.ts
import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from "@nuxt/kit";
import "@nuxt/schema";
var nuxt_default = defineNuxtModule({
  meta: {
    name: "nuxt-unplugin-preprocessor-directives",
    configKey: "unpluginManifest"
  },
  defaults: {
    // ...default options
  },
  setup(options, _nuxt) {
    addVitePlugin(() => vite_default(options));
    addWebpackPlugin(() => webpack_default(options));
  }
});
export {
  nuxt_default as default
};
