"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkBJF5G5SEcjs = require('./chunk-BJF5G5SE.cjs');


var _chunkVPCGFL2Ccjs = require('./chunk-VPCGFL2C.cjs');
require('./chunk-4HBUH5BO.cjs');

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
    _kit.addVitePlugin.call(void 0, () => _chunkBJF5G5SEcjs.vite_default.call(void 0, options));
    _kit.addWebpackPlugin.call(void 0, () => _chunkVPCGFL2Ccjs.webpack_default.call(void 0, options));
  }
});


module.exports = nuxt_default;
exports.default = module.exports;