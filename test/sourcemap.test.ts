import { resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fg from 'fast-glob'
import type { SourceMapInput } from '@ampproject/remapping'
import remapping from '@ampproject/remapping'
import type { SourceMap } from 'magic-string'
import MagicString from 'magic-string'
import { Context, ifDirective } from '../src'

// if true, writes test files and their generated sourcemaps
// to the ./sourcemaps directory so they can be tested with
// https://evanw.github.io/source-map-visualization/
const debugSourcemaps = true// process.env.DEBUG_SOURCEMAPS === 'true'

describe('sourcemap', () => {
  const sourcemapDebugRoot = resolve(__dirname, '..', 'sourcemapDebug')
  const root = resolve(__dirname, './fixtures')
  const context = new Context({
    // @ts-expect-error ignore
    directives: [ifDirective],
  })

  const saveSourcemapsForDebug = (inputCode: string, id: string, result: { code: string, map: SourceMap }, key: string) => {
    if (debugSourcemaps) {
      const testOutputDir = resolve(sourcemapDebugRoot, key)
      const { code: outputCode, map } = result

      if (!existsSync(testOutputDir))
        mkdirSync(testOutputDir, { recursive: true })

      const mapId = `${id}.map`
      const inputFile = resolve(root, id)
      const outputFile = resolve(testOutputDir, id)
      const mapFile = resolve(testOutputDir, mapId)

      // remap the sourcemap to the original file
      const ms = new MagicString(inputCode, { filename: inputFile })
      const originalMap = ms.generateMap({
        source: inputFile,
        file: inputFile,
        includeContent: true,
        hires: true,
      })

      // write the output code and sourcemap to files
      writeFileSync(outputFile, `${outputCode}\n//# sourceMappingURL=${mapId}`)
      writeFileSync(mapFile, JSON.stringify({
        ...originalMap,
        mappings: map.mappings,
      }, null, 2))
    }
  }

  fg.sync('if.*', { cwd: root }).forEach((file) => {
    it(`should generate sourcemap ${file}, dev = true`, () => {
      context.env.DEV = true
      const code = readFileSync(resolve(root, file), 'utf-8')

      const result = context.transformWithMap(code, file)

      expect(result).toMatchSnapshot()

      saveSourcemapsForDebug(code, file, result, 'dev-true')
    })
  })

  fg.sync('if.*', { cwd: root }).forEach((file) => {
    it(`should generate sourcemap ${file}, dev = false`, () => {
      context.env.DEV = false
      const code = readFileSync(resolve(root, file), 'utf-8')
      const result = context.transformWithMap(code, file)

      expect(result).toMatchSnapshot()

      saveSourcemapsForDebug(code, file, result, 'dev-false')
    })
  })
})
