"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkQAZVH6W7cjs = require('./chunk-QAZVH6W7.cjs');


var _chunkKVUDINHGcjs = require('./chunk-KVUDINHG.cjs');
require('./chunk-BAM7OE6J.cjs');

// src/nuxt.ts
var _kit = require('@nuxt/kit');
require('@nuxt/schema');
var nuxt_default = _kit.defineNuxtModule.call(void 0, {
  meta: {
    name: "nuxt-unplugin-preprocessor-directives",
    configKey: "unpluginManifest"
  },
  defaults: {
    // ...default options
  },
  setup(options, _nuxt) {
    _kit.addVitePlugin.call(void 0, () => _chunkQAZVH6W7cjs.vite_default.call(void 0, options));
    _kit.addWebpackPlugin.call(void 0, () => _chunkKVUDINHGcjs.webpack_default.call(void 0, options));
  }
});


module.exports = nuxt_default;
exports.default = module.exports;