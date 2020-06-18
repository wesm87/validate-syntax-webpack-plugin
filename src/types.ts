type $ObjOf<V> = {
  [key: string]: V;
};

export type MatchPattern = string | RegExp | (string | RegExp)[];

export type $SourceMapConsumer = {
  originalPositionFor: (args: {
    line: number;
    column: number;
  }) => {
    source: string;
    line: number;
    column: number;
  };
};

export type $RequestShortener = {
  shorten: (source: string) => string;
};

export type ValidateSyntaxPluginOptions = {
  ecmaVersion: number;
  sourceType: string;
  test: MatchPattern | null;
  include: MatchPattern | null;
  exclude: MatchPattern | null;
};

export type WebpackChunk = {
  files: string[];
};

export type WebpackAssetFile = {
  source: () => string;
  sourceAndMap?: () => { source: string; map: string };
};

export type FileSourceAndMap = {
  source: string;
  map: $SourceMapConsumer;
};

type WebpackHookPluginConfig = {
  name: string;
};

type WebpackHookTapFn<Callback, R> = (config: WebpackHookPluginConfig, callback: Callback) => R;

type WebpackHook<Callback> = {
  tap: WebpackHookTapFn<Callback, any>;
  tapAsync: WebpackHookTapFn<Callback, Promise<any>>;
};

export type WebpackCompilationCallback = (chunks: WebpackChunk[], callback: () => void) => void;

export type WebpackCompilation = {
  errors: Error[];
  assets: $ObjOf<WebpackAssetFile>;
  additionalChunkAssets: string[];
  plugin(hook: string, callback: WebpackCompilationCallback): void;
  hooks: {
    optimizeChunkAssets: WebpackHook<WebpackCompilationCallback>;
  };
};

type WebpackCompilerCallback = (compilation: WebpackCompilation) => void;

export type WebpackCompiler = {
  context: string;
  plugin(hook: string, callback: WebpackCompilerCallback): void;
  hooks?: {
    compilation: WebpackHook<WebpackCompilerCallback>;
  };
};
