import * as esbuild from 'esbuild';
import { U as UserOptions } from './types-DINME5SR.cjs';
import 'vite';
import 'magic-string';

declare const _default: (options?: UserOptions | undefined) => esbuild.Plugin;

export { _default as default };
