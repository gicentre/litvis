# Litvis NPM packages

_Litvis_ as a framework for interpreting markdown documents can have multiple implementations in various programming languages.
A reference implementation of litvis has been developed using [TypeScript](https://www.typescriptlang.org/), a typed superset of JavaScript.
Most of this open-source software can be found in https://github.com/gicentre/litvis → `packages` directory and the remaining bits are located in these repositories:

- [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis)
- [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis)
- [gicentre/vscode-markdown-preview-enhanced-with-litvis](https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis)

The easiest way to try litvis is to install an Atom package available at

> **https://atom.io/packages/markdown-preview-enhanced-with-litvis**

Alternatively, you can install a Visual Studio Code extension from

> **https://marketplace.visualstudio.com/items?itemName=gicentre.markdown-preview-enhanced-with-litvis**

## Development

Litvis code is organised in a form of a _monorepo_ and relies on [`yarn` workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) for package management.
It also uses `lerna` for orchestrating packages in the monorepo.

Before getting started, please make sure you have the latest `node` and the latest `yarn` installed on your machine.

```bash
node --version
## >= 9.11

yarn --version
## >= 1.6.0
```

### Installing dependencies

```bash
# cd gicentre/litvis
yarn
```

### Building packages

```bash
## once
yarn build

## continuously
yarn build:watch
```

### Quality control

#### Linting

```bash
yarn lint
```

#### Testing

```bash
yarn test
```

#### Checking file formatting with [Prettier](https://prettier.io/)

```bash
yarn format:check
```

#### Running all checks

```bash
yarn qa

yarn build-and-qa
## ‘build-and-qa‘ is recommended for ‘cold start’
## (i.e. when packages have not been built previously)
```

## Releasing new versions

### Publishing packages declared in `gicentre/litvis`

> TODO

### Upgrading Vega and Vega-Lite

[Vega](https://github.com/vega/vega) and [Vega-Lite](`https://github.com/vega/vega-lite`) are not direct dependencies of `gicentre/litvis`.
They are introduced downstream inside NPM package [`mume-with-litvis`](https://www.npmjs.com/package/mume-with-litvis), which in turn is a dependency of Atom and VSCode plugins.

Upgrading Vega and Vega-Lite (as well as Vega Embed) consists of the following steps:

#### 1. Produce a new version of `mume-with-litvis`.

1.  Check out the latest commit on the `master` branch of https://github.com/gicentre/mume-with-litvis.git.

1.  Run `npm install`.

1.  Navigate to the latest pre-compiled versions of the libraries available via the CDN:

    - https://cdnjs.com/libraries/vega
    - https://cdnjs.com/libraries/vega-embed
    - https://cdnjs.com/libraries/vega-lite

    These pages are usually updated within a few hours after the official release.

1.  Replace the following local files with the corresponding CDN downloads:

    - `dependencies/vega/vega.min.js`
    - `dependencies/vega-embed/vega-embed.min.js`
    - `dependencies/vega-lite/vega-lite.min.js`

    Opening minified JavaScripts in the browser and pasting their contents to the git repo may result in broken text encoding.
    Using the command line is safer:

    ```bash
    brew install http

    VEGA_VERSION=x.x.x
    VEGA_LITE_VERSION=y.y.y
    VEGA_EMBED_VERSION=z.z.z

    cd mume-with-litvis

    http https://cdnjs.cloudflare.com/ajax/libs/vega/${VEGA_VERSION}/vega.min.js > dependencies/vega/vega.min.js
    http https://cdnjs.cloudflare.com/ajax/libs/vega-lite/${VEGA_LITE_VERSION}/vega-lite.min.js > dependencies/vega-lite/vega-lite.min.js
    http https://cdnjs.cloudflare.com/ajax/libs/vega-embed/${VEGA_EMBED_VERSION}/vega-embed.min.js > dependencies/vega-embed/vega-embed.min.js
    ```

1.  Update `dependencies/README.md` with the picked library versions.
    This change is needed for documentation purposes only.

1.  Find three occurrences of `https://cdnjs.cloudflare.com/ajax/libs/vega/...` in `src/markdown-engine.ts` and upgrade library versions accordingly.

1.  In the unlikely case of breaking changes that affect the lifecycle of vega-based visualizations, consider updating additional files in `src` folder.
    This may be necessary in a small subset of cases, and only when the major versions are bumped.

1.  Commit the changes (see [example](https://github.com/gicentre/mume-with-litvis/commit/dbae1a1887c56ce4c668edffa633a71fb9dd44dd)).

1.  Open `package.json` and bump NPM version (see [example](https://github.com/gicentre/mume-with-litvis/commit/7882ee1e90b94953fd681bc91d04e5cedbb53812)).
    If updates in Vega, Vega Lite and Vega Embed only carry bug fixes, you may want to modify the third number instead of the second one, which stands for new features.

1.  Run `npm publish`.
    This will build `mume-with-litvis` from its source and publish the new version on NPM.
    2FA authentication token should be asked as part of this.
    Beware that publishing may [fail on a slow internet connection](https://github.com/npm/npm/issues/19425#issuecomment-381315731) due to the size of `mume-with-litvis` combined with the expiration of 2FA tokens.

1.  Go to https://www.npmjs.com/package/mume-with-litvis and verify that the package version has been updated.

1.  Commit your change in `package.json` and push both commits to master.

You may also want to cherry-pick the first commit to `mume` in order to keep the fork in sync with its origin.
Example pull request: [shd101wyy/mume#79](https://github.com/shd101wyy/mume/pull/79).

#### 2. Produce a new version of the Atom package.

1.  Check out the latest commit on the `master` branch of https://github.com/gicentre/markdown-preview-enhanced-with-litvis.git.

1.  Run `npm install`.

1.  Run `npm install mume-with-litvis` to update the version of this dependency.

1.  Commit the change (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/c08c88008438e189d65a3511c404bb5da58a4c71)) and push it.

1.  Run `apm publish patch` or `apm publish minor` depending on the nature of the upstream changes.
    This should automatically bump the version in `package.json` and push a new commit to GitHub, which constitutes the release (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/75dac081b7955028071c5ff79ccaa6791dd5b707)).
    You will be asked to authenticate at APM if needed.

1.  Push the `master` branch.

The new package version should now show up in Atom and it should be possible to upgrade.
If the new version ends up broken, you can rollback by running `apm install markdown-preview-enhanced@another-version`.

#### 3. Produce a new version of the VSCode extension.

1.  Make sure you have the latest version of `vsce` installed globally.

    ```bash
    npm install -g vsce
    ```

1.  Check out the latest commit on the `master` branch of https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis.git.

1.  Run `npm install`.

1.  Run `npm install mume-with-litvis` to update the version of this dependency.

1.  Run `vsce publish patch` or `vsce publish minor` depending on the nature of the upstream changes.
    You will be asked to authenticate at Visual Studio Marketplace if needed.

1.  Commit and push (see [example](https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis/commit/ab31a8449b8c5c8eb7eb086a2394daeec6c05ff9)).
    Unlike `apm`, `vsce` does not automatically create or push tags to GitHub when publishing a new version on the marketplace.
