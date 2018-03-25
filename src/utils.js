// @flow

import { parse } from 'acorn'
import { SourceMapConsumer } from 'source-map'
import {
  is,
  isEmpty,
  compose,
  flip,
  curryN,
  propOr,
  propIs,
  apply,
  invoker,
  test,
  replace,
  concat,
  all,
  map,
  filter,
  reject,
  reduce,
  adjust,
  evolve,
  objOf,
  when,
  unless,
  ifElse,
  always,
  constructN,
} from 'ramda'

import type {
  MatchPattern,
  WebpackChunk,
  $RequestShortener,
  $SourceMapConsumer,
} from './types'

const REGEX_CHARS_REGEX = /[-[\]{}()*+?.,\\^$|#\s]/g
const ERROR_SOURCE_INFO_REGEX = /\(([0-9]+):([0-9]+)\)$/

const toRegExp = when(is(String), compose(
  RegExp,
  replace(REGEX_CHARS_REGEX, '\\$&'),
))

const testMultiple = curryN(2, (patterns, val) => {
  if (!patterns || isEmpty(patterns)) {
    return val
  }

  return compose(
    all(flip(test)(val)),
    map(toRegExp),
    unless(is(Array), Array.of),
  )(patterns)
})

const chunkFilesReducer = compose(
  apply(concat),
  adjust(propOr([], 'files'), 1),
  Array.of,
)

// NOTE: flip() returns a curried function
export const parseFileSyntax = flip(parse)

const isTruthyThunk = (val: *) => always(Boolean(val))

type ExtractMatchingFileNamesArgs = {
  chunks: Array<WebpackChunk>,
  additionalChunkAssets: Array<string>,
  test: ?MatchPattern,
  include: ?MatchPattern,
  exclude: ?MatchPattern,
};

export const extractMatchingFileNames = (args: ExtractMatchingFileNamesArgs) => {
  const {
    chunks,
    additionalChunkAssets,
    test: testPattern,
    include: includePattern,
    exclude: excludePattern,
  } = args

  return compose(
    when(
      isTruthyThunk(excludePattern),
      reject(testMultiple(excludePattern)),
    ),
    when(
      isTruthyThunk(includePattern),
      filter(testMultiple(includePattern)),
    ),
    when(
      isTruthyThunk(testPattern),
      filter(testMultiple(testPattern)),
    ),
    concat(additionalChunkAssets || []),
    reduce(chunkFilesReducer, []),
  )(chunks)
}

export const extractFileSourceAndMap = ifElse(
  // $FlowIgnore flow can't tell that `propIs(Function, 'sourceAndMap')` returns a Boolean
  propIs(Function, 'sourceAndMap'),
  compose(
   evolve({
     map: constructN(1, SourceMapConsumer),
   }),
   invoker(0, 'sourceAndMap'),
 ),
 compose(
   objOf('source'),
   invoker(0, 'source'),
 ),
)

type BuildErrorArgs = {
  error: Error,
  file: string,
  map: ?$SourceMapConsumer,
  requestShortener: $RequestShortener,
};

export const buildError = (args: BuildErrorArgs): Error => {
  const { error, file, map, requestShortener } = args

  const baseErrorMessage = compose(
    concat(`${file} (contains invalid syntax)\n`),
    replace(ERROR_SOURCE_INFO_REGEX, ''),
  )(error.message)

  const [, errorLine, errorColumn] = ERROR_SOURCE_INFO_REGEX.exec(error.message)
  const hasSourceInfo = errorLine && errorColumn

  const original = hasSourceInfo && map && map.originalPositionFor({
    line: Number(errorLine),
    column: Number(errorColumn),
  })

  if (original && original.source) {
    const { source, line, column } = original
    const sourcePath = requestShortener.shorten(source)

    return new Error(`${baseErrorMessage} [${sourcePath} ${line}:${column}]`)
  }

  return new Error(`${baseErrorMessage} [${errorLine}:${errorColumn}]`)
}
