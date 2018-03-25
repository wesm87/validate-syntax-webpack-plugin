// @flow
/* eslint-disable no-use-before-define */

type $ObjOf<V, K = string> = { [key: K]: V }

type EcmaVersion =
  | 6
  | 7
  | 8
  | 2016
  | 2017
  | 2018

type SourceType =
  | 'script'
  | 'module'

export type MatchPattern =
  | string
  | RegExp
  | Array<string | RegExp>

export type $SourceMapConsumer = {
  originalPositionFor: (args: { line: number, column: number }) => {
    source: string,
    line: number,
    column: number,
  },
}

export type $RequestShortener = {
  shorten: (source: string) => string,
}

export type ValidateSyntaxPluginOptions = {
  ecmaVersion: EcmaVersion,
  sourceType: SourceType,
  test?: ?MatchPattern,
  include?: ?MatchPattern,
  exclude?: ?MatchPattern,
}

export type WebpackChunk = {
  files: Array<string>,
}

type WebpackAssetFile = {
  source: () => string,
  sourceAndMap?: () => { source: string, map: string },
}

type WebpackHookPluginConfig = {
  name: string,
}

type WebpackHookTapFn<Callback> = (WebpackHookPluginConfig, Callback) => void

type WebpackHook<Callback> = {
  tap: WebpackHookTapFn<Callback>,
  tapAsync: WebpackHookTapFn<Callback>,
}

type WebpackCompilationCallback = (chunks: Array<WebpackChunk>, callback: Function) => void

type WebpackCompilation = {
  errors: Array<Error>,
  assets: $ObjOf<WebpackAssetFile>,
  additionalChunkAssets: Array<string>,
  plugin(hook: string, callback: WebpackCompilationCallback): void,
  hooks: {
    optimizeChunkAssets: WebpackHook<WebpackCompilationCallback>,
  },
}

type WebpackCompilerCallback = (compilation: WebpackCompilation) => void

export type WebpackCompiler = {
  context: string,
  plugin(hook: string, callback: WebpackCompilerCallback): void,
  hooks?: {
    compilation: WebpackHook<WebpackCompilerCallback>,
  },
}
