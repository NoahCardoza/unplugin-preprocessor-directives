import { resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fg from 'fast-glob'
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

  const saveSourcemapsForDebug = (file: string, result: { code: string, map: any }, key: string) => {
    if (debugSourcemaps) {
      const testOutputDir = resolve(sourcemapDebugRoot, key)
      const { code: outputCode, map } = result

      if (!existsSync(testOutputDir))
        mkdirSync(testOutputDir, { recursive: true })

      const outputFile = resolve(testOutputDir, file)
      const mapFile = `${outputFile}.map`

      // write the output code and sourcemap to files
      writeFileSync(outputFile, outputCode)
      writeFileSync(mapFile, JSON.stringify(map))
    }
  }

  fg.sync('if.*', { cwd: root }).forEach((file) => {
    it(`should generate sourcemap ${file}, dev = true`, () => {
      context.env.DEV = true
      const code = readFileSync(resolve(root, file), 'utf-8')
      const result = context.transformWithMap(code, file)

      expect(result).toMatchSnapshot()

      saveSourcemapsForDebug(file, result, 'dev-true')
    })
  })

  fg.sync('if.*', { cwd: root }).forEach((file) => {
    it(`should generate sourcemap ${file}, dev = false`, () => {
      context.env.DEV = false
      const code = readFileSync(resolve(root, file), 'utf-8')
      const result = context.transformWithMap(code, file)

      expect(result).toMatchSnapshot()

      saveSourcemapsForDebug(file, result, 'dev-false')
    })
  })
})
