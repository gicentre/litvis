# Litvis NPM packages

_Litvis_ as a framework for interpreting markdown documents can have multiple implementations in various programming languages. A reference implementation of litvis has been developed using [TypeScript](https://www.typescriptlang.org/), a typed superset of JavaScript. Most of this open-source software can be found in <https://github.com/gicentre/litvis> → `packages` directory and the remaining bits are located in these repositories:

- [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis)
- [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis)
- [gicentre/vscode-markdown-preview-enhanced-with-litvis](https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis)

The easiest way to try litvis is to install either the [Atom package](https://atom.io/packages/markdown-preview-enhanced-with-litvis) or the [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=gicentre.markdown-preview-enhanced-with-litvis).

## Development

Litvis code is organised in a form of a _monorepo_ and relies on [`yarn` workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) for package management. It also uses `lerna` for orchestrating packages in the monorepo.

Before getting started, please make sure you have the latest `node` and the latest `yarn` installed on your machine.

```sh
node --version
## ≥ 12.15

yarn --version
## ≥ 1.22
```

### Installing dependencies

```sh
# cd gicentre/litvis
yarn
```

### Building packages

```sh
## once
yarn build

## continuously
yarn build:watch
```

### Publishing litvis packages manually if `lerna publish` has failed

```sh
## one-time password for two-factor auth
export NPM_CONFIG_OTP=??

yarn lerna exec npm publish
```

### Registering litvis packages using `yarn link` for local development

```sh
yarn lerna exec yarn link

## to unregister
# yarn lerna exec --no-bail yarn unlink
```

### Quality control

#### Linting

```sh
yarn lint
```

#### Testing

```sh
yarn test
```

#### Checking file formatting with [Prettier](https://prettier.io/)

```sh
yarn format:check
```

#### Running all checks

```sh
yarn qa

yarn build-and-qa
## ‘build-and-qa‘ is recommended for ‘cold start’
## (i.e. when packages have not been built previously)
```

### Local development pipeline and testing with Atom

This section is based on the assumption that at least one package in this repo is being worked on.

First step is to clone the three repositories (this one, plus [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis) and [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis).

Open a terminal in the folder of this repo (gicentre/litvis),

1. Run `yarn`/`yarn install`

1. For each package being worked on, go the folder of the package (e.g. `cd packages\narrative-schema`) and run `npm link`. This will create a symlink in a global/user node_modules folder.

1. Back in the main folder, run `yarn build:watch`

Open a new terminal and navigate to the _mume-with-litvis_ folder.

1. Run `npm install`

1. Open the `node_modules` folder and check the modules that are dependencies from the litvis repository (e.g. litvis-integration-mume). Now, for those packages that were linked in the previous step, run `npm link package_name`. For example, if working on litvis-integration-mume, run `npm link litvis-integration-mume`.

1. Back in the main folder, run `npm run build:watch`

Lastly, open a new terminal in the _markdown-preview-enhanced-with-litvis_ folder.

1. Run `npm install`

1. Open the `node_modules` folder and find modules that are dependencies from the previous two repositories (mume-with-litivs and any of the packages in this repo). For each of them, run `npm link package_name` as previously.

1. Back in the main folder, run `npm run build`.

1. Run `apm link -d`. This will create a link from the package (in the repo) to the development folder of atom.

1. Run again `npm run build:watch`.

Finally, in a separate terminal, run `atom -d` to open the development version of Atom. This will ensure that the markdown preview litvis-enhanced package is taken from the development folder and will not conflict with the release version. Now, every time a file in this repo is changed and saved, a chain of build commands will be triggered, ensuring that the Markdown Preview package is (locally) updated. To reload Atom and the packages to actually see the changes, go to View -> Developer -> Reload Window. When committing and merging changes, don't forget to use `yarn lint` to pass the github checks.

#### Potential issues in local development

MacOS related:

1. `coreutils` might be required (`npm install -g coreutils`).

1. There might be a problem with `fsevents` when building the packages or loading Atom. `npm install -g fsevents@1.2.9` and rebuilding the package when requested, in Atom, should solve it.

## Releasing new versions

### Publishing packages declared in `gicentre/litvis`

> TODO

### Upgrading Vega and Vega-Lite

[Vega](https://github.com/vega/vega) and [Vega-Lite](`https://github.com/vega/vega-lite`) are not direct dependencies of `gicentre/litvis`. They are introduced downstream inside NPM package [`mume-with-litvis`](https://www.npmjs.com/package/mume-with-litvis), which in turn is a dependency of Atom and VSCode plugins.

Upgrading Vega and Vega-Lite (as well as Vega Embed) consists of the following steps:

#### 1. Produce a new version of `mume-with-litvis`

1. Check out the latest commit on the `master` branch of <https://github.com/gicentre/mume-with-litvis.git>.

1. Run `npm install`.

1. Navigate to the latest pre-compiled versions of the libraries available via the CDN:

   - <https://www.jsdelivr.com/package/npm/vega>
   - <https://www.jsdelivr.com/package/npm/vega-lite>
   - <https://www.jsdelivr.com/package/npm/vega-embed>
   - <https://www.jsdelivr.com/package/npm/apache-arrow>
   - <https://www.jsdelivr.com/package/npm/vega-loader-arrow>

These pages are usually updated within a few hours after the official release.

1. Replace the following local files with the corresponding CDN downloads:

   - `dependencies/vega/vega.min.js`
   - `dependencies/vega-lite/vega-lite.min.js`
   - `dependencies/vega-embed/vega-embed.min.js`
   - `dependencies/apache-arrow/apache-arrow.min.js`
   - `dependencies/vega-loader-arrow/vega-loader-arrow.min.js`

   Opening minified JavaScripts in the browser and pasting their contents to the git repo may result in broken text encoding. Using the command line is safer:

   ```sh
   brew install http

   cd mume-with-litvis
   ```

   ```sh
   NAME=vega
   VERSION=5.13.0
   BUILD_PATH=
   ```

   ```sh
   NAME=vega-lite
   VERSION=4.14.1
   BUILD_PATH=
   ```

   ```sh
   NAME=vega-embed
   VERSION=6.10.0
   BUILD_PATH=
   ```

   ```sh
   NAME=apache-arrow
   VERSION=0.17.0
   BUILD_PATH=Arrow.es5.min.js
   ```

   ```sh
   NAME=vega-loader-arrow
   VERSION=0.0.7
   BUILD_PATH=
   ```

   ```sh
   http "https://cdn.jsdelivr.net/npm/${NAME}@${VERSION}/${BUILD_PATH:-build/${NAME}.min.js}" > "dependencies/${NAME}/${NAME}.min.js"
   ```

1. Update `dependencies/README.md` with the picked library versions. This change is needed for documentation purposes only.

1. Find `dependentLibraryMaterials` in `src/markdown-engine.ts` and upgrade library versions accordingly.

1. In the unlikely case of breaking changes that affect the lifecycle of vega-based visualizations, consider updating additional files in `src` folder. This may be necessary in a small subset of cases, and only when the major versions are bumped.

1. Commit the changes (see [example](https://github.com/gicentre/mume-with-litvis/commit/12ce00beb40873e7ab4f154ed63977dd70bb78b3)).

1. Open `package.json` and bump NPM version (see [example](https://github.com/gicentre/mume-with-litvis/commit/7882ee1e90b94953fd681bc91d04e5cedbb53812)). If updates in Vega, Vega Lite and Vega Embed only carry bug fixes, you may want to modify the third number instead of the second one, which stands for new features.

1. Run `npm publish`. This will build `mume-with-litvis` from its source and publish the new version on NPM. 2FA authentication token should be asked as part of this. Beware that publishing may [fail on a slow internet connection](https://github.com/npm/npm/issues/19425#issuecomment-381315731) due to the size of `mume-with-litvis` combined with the expiration of 2FA tokens.

1. Open <https://www.npmjs.com/package/mume-with-litvis> and verify that the package version has been updated.

1. Commit your change in `package.json` and push both commits to the master branch on github.

You may also want to cherry-pick the first commit to `mume` in order to keep the fork in sync with its origin. Example pull request: [shd101wyy/mume#79](https://github.com/shd101wyy/mume/pull/79).

#### 2. Produce a new version of the Atom package

1. Check out the latest commit on the `master` branch of <https://github.com/gicentre/markdown-preview-enhanced-with-litvis.git>.

1. Run `npm install`.

1. Run `npm install mume-with-litvis@latest` to update the version of this dependency.

1. Open `CHANGELOG.md` and document upcoming changes.

1. Commit (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/b6564fdc7e9559654c93cb09f67c2d51d0dbcf90)) and push.

1. Run `apm publish patch` or `apm publish minor` depending on the nature of the upstream changes. This should automatically bump the version in `package.json` and push a new commit to GitHub, which constitutes the release (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/75dac081b7955028071c5ff79ccaa6791dd5b707)). You will be asked to authenticate at APM if needed.

1. Push the `master` branch.

The new package version should now show up in Atom and it should be possible to upgrade. If the new version ends up broken, you can rollback by running `apm install markdown-preview-enhanced@another-version`.

#### 3. Produce a new version of the VSCode extension

1. Make sure you have the latest version of `vsce` installed globally.

```sh
npm install -g vsce
```

1. Check out the latest commit on the `master` branch of <https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis.git>.

1. Run `npm install`.

1. Run `npm install mume-with-litvis@latest` to update the version of this dependency.

1. Open `CHANGELOG.md` and document upcoming changes.

1. Commit (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/3cd86e1499b8abc45ff806741798c038e098e05d)) and push.

1. Run `vsce publish patch` or `vsce publish minor` depending on the nature of the upstream changes. You will be asked to authenticate at Visual Studio Marketplace if needed.

1. Push the `master` branch.
