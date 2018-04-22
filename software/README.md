# Literate Visualization Software

_Litvis_ as a framework for interpreting markdown documents can have multiple implementations in various programming languages.
A reference implementation of litvis has been developed using [TypeScript](https://www.typescriptlang.org/), a typed superset of JavaScript.
This open-source software can be found in [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis) GitHub repository.

The easiest way to try litvis is to install an Atom package available at https://atom.io/packages/markdown-preview-enhanced-with-litvis. Its source code and setup instructions can be found in [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis).

Alternatively, you can install a Visual Studio Code extension available at https://marketplace.visualstudio.com/items?itemName=gicentre.markdown-preview-enhanced-with-litvis.
The instructions and the source code are shared in [gicentre/vscode-markdown-preview-enhanced-with-litvis](https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis).

## Code refactoring to increase its shareability

There is ongoing work on refactoring [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis) into a number of smaller [npm](https://www.npmjs.com/) modules.
This will make it easier to use litvis features in other environments, not only in [Atom](https://atom.io/packages/markdown-preview-enhanced-with-litvis) or [VSCode](https://marketplace.visualstudio.com/items?itemName=gicentre.markdown-preview-enhanced-with-litvis).

Feel free to contact the authors if you would like to join!

## Development

Litvis code is organised in a form of a _monorepo_ and relies on [`yarn` workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) for package management.
It also uses `lerna`

Before getting started, make sure you have the latest `node` and the latest `yarn` installed on your machine.

```bash
node --version
## >= 9.11
yarn --version
## >= 1.6.0
```

### Installing dependencies

```bash
yarn
```

### Quality control

#### linting

```bash
yarn lint
```

#### testing

```bash
yarn test
```

### Build packages

```bash
## once
yarn build

## continuously
yarn build:watch
```
