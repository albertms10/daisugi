# @daisugi/nekobasu

[![version](https://img.shields.io/npm/v/@daisugi/nekobasu.svg)](https://www.npmjs.com/package/@daisugi/nekobasu)
![npm downloads](https://img.shields.io/npm/dm/@daisugi/nekobasu)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/@daisugi/nekobasu)](https://bundlephobia.com/result?p=@daisugi/nekobasu)

This project is part of the [@daisugi](https://github.com/daisugiland/daisugi) monorepo.

**Nekobasu** a lightweight asynchronous EventBus implementation.

## 🌟 Features

- 💡 Minimum size [overhead](https://bundlephobia.com/result?p=@daisugi/nekobasu).
- ⚡️ Written in TypeScript.
- 📦 Only uses trusted dependencies.
- 🔨 Powerful and agnostic to your code.
- 🧪 Well tested.
- 🤝 Is used in production.
- ⚡️ Exports ES Modules as well as CommonJS.

## Usage

```js
import { Nekobasu } from '@daisugi/nekobasu';

const nekobasu = new Nekobasu();
nekobasu.subscribe('foo.*', (event) => {
  console.log(event);
});
nekobasu.dispatch('foo.bar');
```

## Table of contents

- [@daisugi/nekobasu](#daisuginekobasu)
  - [🌟 Features](#-features)
  - [Usage](#usage)
  - [Table of contents](#table-of-contents)
  - [Install](#install)
  - [Other projects](#other-projects)
  - [License](#license)

## Install

Using npm:

```sh
npm install @daisugi/nekobasu
```

Using yarn:

```sh
yarn add @daisugi/nekobasu
```

[:top: back to top](#table-of-contents)

## Other projects

| Project                                                                         | Version                                                                                                           | Changelog                             | Description                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| [Daisugi](../daisugi)                                                           | [![version](https://img.shields.io/npm/v/@daisugi/daisugi.svg)](https://www.npmjs.com/package/@daisugi/daisugi)   | [changelog](../daisugi/CHANGELOG.md)  | Is a minimalist functional middleware engine.                  |
| [Kintsugi](../kintsugi)                                                         | [![version](https://img.shields.io/npm/v/@daisugi/kintsugi.svg)](https://www.npmjs.com/package/@daisugi/kintsugi) | [changelog](../kintsugi/CHANGELOG.md) | Is a set of utilities to help build a fault tolerant services. |
| [Kado](../kado)                                                                 | [![version](https://img.shields.io/npm/v/@daisugi/kado.svg)](https://www.npmjs.com/package/@daisugi/kado)         | [changelog](../kado/CHANGELOG.md)     | Is a minimal and unobtrusive inversion of control container.   |
| [JavaScript style guide](https://github.com/daisugiland/javascript-style-guide) |                                                                                                                   |                                       |                                                                |

[:top: back to top](#table-of-contents)

## License

[MIT](../../LICENSE)
