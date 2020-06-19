# Validate Syntax Webpack Plugin

A Webpack plugin to validate the syntax in your bundles. Uses
[Acorn](https://github.com/acornjs/acorn) internally.

## Why?

The motivation for writing this plugin was that I had an issue in a React app where some ES6
code was making its way into the app bundle, which broke the site in Internet Explorer. Upon
investigation I discovered that the code in question was coming from one of the third-party
packages I was using that was written in ES6 but was not transpiled before shipping. I wanted
my build process to throw an error if any invalid code made it into the compiled bundle but
I couldn't find a plugin to do that, so I created one.

## Requirements

- Node >= 8.0.0
- Webpack 2, 3, or 4

## Install

```sh
// via yarn
yarn add -D validate-syntax-webpack-plugin

// via npm
npm install -D validate-syntax-webpack-plugin
```

## Usage

**webpack.config.js**

```js
const ValidateSyntaxWebpackPlugin = require('validate-syntax-webpack-plugin');

module.exports = {
  plugins: [
    new ValidateSyntaxWebpackPlugin({ /* plugin options */ }),
  ],
};
```

### Options

The plugin currently takes the following options:

Note: `MatchPattern` is an alias type for `RegExp | string | RegExp[] | string[]`

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`ecmaVersion`**|`number`|`5`|The ECMAScript version to validate against|
|**`sourceType`**|`string`|`"script"`|Set to `"module"` if you're compiling to ES modules instead of CommonJS|
|**`test`**|`MatchPattern`|`/\\.js$/i`|Test to match files against|
|**`include`**|`MatchPattern`|`null`|Files to include|
|**`exclude`**|`MatchPattern`|`null`|Files to exclude|
