// @flow

/* eslint-disable import/no-unresolved */
// $FlowIgnore
import RequestShortener from 'webpack/lib/RequestShortener'
/* eslint-enable import/no-unresolved */

import { merge } from 'ramda'

import {
  parseFileSyntax,
  extractMatchingFileNames,
  extractFileSourceAndMap,
  buildError,
} from './utils'

import type {
  WebpackCompiler,
  ValidateSyntaxPluginOptions,
} from './types'

const JS_FILE_REGEX = /\.js$/i

const defaultOptions = {
  ecmaVersion: 5,
  sourceType: 'script',
  test: JS_FILE_REGEX,
  include: null,
  exclude: null,
}

class ValidateSyntaxPlugin {
  options: ValidateSyntaxPluginOptions

  constructor(options: ValidateSyntaxPluginOptions): void {
    this.options = merge(defaultOptions, options)
  }

  apply(compiler: WebpackCompiler): void {
    const {
      ecmaVersion,
      sourceType,
      test,
      include,
      exclude,
    } = this.options

    const parseFile = parseFileSyntax({ ecmaVersion, sourceType })
    const requestShortener = new RequestShortener(compiler.context)

    const getFileSyntaxValidator = (compilation) => {
      const validateFileSyntax = (chunks, callback) => {
        const { assets, additionalChunkAssets, errors } = compilation

        const parsedAssets = new WeakSet()

        const files = extractMatchingFileNames({
          chunks,
          additionalChunkAssets,
          test,
          include,
          exclude,
        })

        files.forEach((file) => {
          const asset = assets[file]

          if (parsedAssets.has(asset)) {
            return
          }

          const { source, map } = extractFileSourceAndMap(asset)

          try {
            parseFile(source)
            parsedAssets.add(asset)
          } catch (error) {
            errors.push(buildError({ error, file, map, requestShortener }))
          }
        })

        callback()
      }

      return validateFileSyntax
    }

    if (compiler.hooks) {
      const plugin = {
        name: 'ValidateSyntaxPlugin',
      }

      compiler.hooks.compilation.tap(plugin, (compilation) => {
        compilation.hooks.optimizeChunkAssets.tapAsync(plugin, getFileSyntaxValidator(compilation))
      })
    } else {
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin('after-optimize-chunk-assets', getFileSyntaxValidator(compilation))
      })
    }
  }
}

module.exports = ValidateSyntaxPlugin
