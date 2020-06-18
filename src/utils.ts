// @ts-ignore
import { SourceMapConsumer } from 'source-map';
import { parse } from 'acorn';
import {
  is,
  isEmpty,
  compose,
  curry,
  propIs,
  invoker,
  test,
  replace,
  all,
  filter,
  reject,
  reduce,
  evolve,
  objOf,
  ifElse,
  constructN,
} from 'ramda';

import type {
  MatchPattern,
  WebpackChunk,
  WebpackAssetFile,
  FileSourceAndMap,
  $RequestShortener,
  $SourceMapConsumer,
} from './types';

const REGEX_CHARS_REGEX = /[-[\]{}()*+?.,\\^$|#\s]/g;
const ERROR_SOURCE_INFO_REGEX = /\(([0-9]+):([0-9]+)\)$/;

const invokeMethod = (method: string) => invoker(0, method);

const isArray = (val: any): val is any[] => is(Array, val);
const isString = (val: any): val is string => is(String, val);

const prependString = curry((a: string, b: string) => `${a}${b}`);

const matchesRegExp = curry((value: string, regExp: RegExp) => test(regExp, value));

const sanitizeRegExpString = replace(REGEX_CHARS_REGEX, '\\$&');

const toRegExp = (value: any) =>
  isString(value) ? new RegExp(sanitizeRegExpString(value)) : value;

const toRegExpList = (pattern: MatchPattern | null): RegExp[] => {
  if (!pattern) {
    return [];
  }

  const matchPatternList = isArray(pattern) ? pattern : Array.of(pattern);

  return matchPatternList.map(toRegExp);
};

const testMultiple = (regExpList: RegExp[]) => (val: string) => all(matchesRegExp(val), regExpList);

const transformFileNamesByMatchPattern = (fn: (...args: any[]) => string[]) => (
  pattern: MatchPattern | null,
) => (values: string[]) => {
  const regExpList = toRegExpList(pattern);

  if (isEmpty(regExpList)) {
    return values;
  }

  return fn(testMultiple(regExpList), values);
};

const filterByMatchPattern = transformFileNamesByMatchPattern(filter);
const rejectByMatchPattern = transformFileNamesByMatchPattern(reject);

const chunkFilesReducer = (acc: string[], chunk: WebpackChunk): string[] =>
  acc.concat(chunk.files ?? []);

export const parseFileSyntax = curry((options, input: string) => parse(input, options));

type MatchPatternArgs = {
  test: MatchPattern | null;
  include: MatchPattern | null;
  exclude: MatchPattern | null;
};

type ExtractMatchingFileNamesArgs = MatchPatternArgs & {
  chunks: WebpackChunk[];
  additionalChunkAssets: string[];
};

const filterByMatchPatterns = (args: MatchPatternArgs, fileNames: string[]) => {
  const { test: testPattern, include: includePattern, exclude: excludePattern } = args;

  return compose<string[], string[], string[], string[]>(
    rejectByMatchPattern(excludePattern),
    filterByMatchPattern(includePattern),
    filterByMatchPattern(testPattern),
  )(fileNames);
};

export const extractMatchingFileNames = (args: ExtractMatchingFileNamesArgs): string[] => {
  const { chunks, additionalChunkAssets, ...matchPatternArgs } = args;
  const fileNames = reduce(chunkFilesReducer, [], chunks).concat(additionalChunkAssets ?? []);

  return filterByMatchPatterns(matchPatternArgs, fileNames);
};

type ExtractFileSourceAndMap = (asset: WebpackAssetFile) => FileSourceAndMap;

export const extractFileSourceAndMap: ExtractFileSourceAndMap = ifElse(
  propIs(Function, 'sourceAndMap'),
  compose(
    evolve({
      map: constructN(1, SourceMapConsumer),
    }),
    invokeMethod('sourceAndMap'),
  ),
  compose(objOf('source'), invokeMethod('source')),
);

type BuildErrorArgs = {
  error: Error;
  file: string;
  map?: $SourceMapConsumer;
  requestShortener: $RequestShortener;
};

export const buildError = (args: BuildErrorArgs): Error => {
  const { error, file, map, requestShortener } = args;

  const baseErrorMessage = compose(
    prependString(`${file} (contains invalid syntax)\n`),
    replace(ERROR_SOURCE_INFO_REGEX, ''),
  )(error.message);

  const [, errorLine, errorColumn] = ERROR_SOURCE_INFO_REGEX.exec(error.message) ?? [];
  const hasSourceInfo = Boolean(errorLine && errorColumn);

  const original =
    hasSourceInfo &&
    map?.originalPositionFor({
      line: Number(errorLine),
      column: Number(errorColumn),
    });

  if (original && original.source) {
    const { source, line, column } = original;
    const sourcePath = requestShortener.shorten(source);

    return new Error(`${baseErrorMessage} [${sourcePath} ${line}:${column}]`);
  }

  return new Error(`${baseErrorMessage} [${errorLine}:${errorColumn}]`);
};
