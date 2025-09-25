# Litvis NPM packages

_Litvis_ as a framework for interpreting markdown documents can have multiple implementations in various programming languages. A reference implementation of litvis has been developed using [TypeScript](https://www.typescriptlang.org/), a typed superset of JavaScript. Most of this open-source software can be found in <https://github.com/gicentre/litvis> → `packages` directory and the remaining bits are located in these repositories:

- [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis)
- [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis)
- [gicentre/vscode-markdown-preview-enhanced-with-litvis](https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis)

The easiest way to try litvis is to install [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=gicentre.markdown-preview-enhanced-with-litvis).

## Development

Litvis code is organised in a form of a _monorepo_ and relies on [`pnpm` workspaces](https://pnpm.io/workspaces) for package management. It also uses `lerna` for orchestrating packages in the monorepo.

Before getting started, please make sure you have the latest `node` and `pnpm` installed on your machine.

```sh
node --version
## ≥ 18.20

pnpm --version
## ≥ 10
```

### Installing dependencies

```sh
# cd gicentre/litvis
pnpm install
```

### Building packages

```sh
## once
pnpm build

## continuously
pnpm build:watch
```

### Publishing litvis packages manually if `lerna publish` has failed

```sh
## one-time password for two-factor auth
export NPM_CONFIG_OTP=??

pnpm lerna exec npm publish
```

### Registering litvis packages using `pnpm link` for local development

```sh
pnpm lerna exec pnpm link

## to unregister
# pnpm lerna exec --no-bail pnpm unlink
```

### Quality control

#### Linting

```sh
pnpm lint
```

#### Testing

```sh
pnpm test
```

#### Checking file formatting with [Prettier](https://prettier.io/)

```sh
pnpm fix:prettier
```

#### Running all checks

```sh
pnpm qa

pnpm build-and-qa
## ‘build-and-qa‘ is recommended for ‘cold start’
## (i.e. when packages have not been built previously)
```

### Local development pipeline and testing with Atom

> TODO: Replace Atom with VSCode

This section is based on the assumption that at least one package in this repo is being worked on.

First step is to clone the three repositories (this one, plus [gicentre/mume-with-litvis](https://github.com/gicentre/mume-with-litvis) and [gicentre/markdown-preview-enhanced-with-litvis](https://github.com/gicentre/markdown-preview-enhanced-with-litvis).

Open a terminal in the folder of this repo (gicentre/litvis),

1.  Run `pnpm install`

1.  For each package being worked on, go the folder of the package (e.g. `cd packages\narrative-schema`) and run `npm link`. This will create a symlink in a global/user node_modules folder.

1.  Back in the main folder, run `pnpm build:watch`

Open a new terminal and navigate to the _mume-with-litvis_ folder.

1.  Run `npm install`

1.  Open the `node_modules` folder and check the modules that are dependencies from the litvis repository (e.g. litvis-integration-mume). Now, for those packages that were linked in the previous step, run `npm link package_name`. For example, if working on litvis-integration-mume, run `npm link litvis-integration-mume`.

1.  Back in the main folder, run `npm run build:watch`

Lastly, open a new terminal in the _markdown-preview-enhanced-with-litvis_ folder.

1.  Run `npm install`

1.  Open the `node_modules` folder and find modules that are dependencies from the previous two repositories (mume-with-litivs and any of the packages in this repo). For each of them, run `npm link package_name` as previously.

1.  Back in the main folder, run `npm run build`.

1.  Run `apm link -d`. This will create a link from the package (in the repo) to the development folder of atom.

1.  Run again `npm run build:watch`.

Finally, in a separate terminal, run `atom -d` to open the development version of Atom. This will ensure that the markdown preview litvis-enhanced package is taken from the development folder and will not conflict with the release version. Now, every time a file in this repo is changed and saved, a chain of build commands will be triggered, ensuring that the Markdown Preview package is (locally) updated. To reload Atom and the packages to actually see the changes, go to View -> Developer -> Reload Window. When committing and merging changes, don't forget to use `pnpm lint` to pass the github checks.

#### Potential issues in local development

MacOS related:

1.  `coreutils` might be required (`npm install -g coreutils`).

1.  There might be a problem with `fsevents` when building the packages or loading Atom. `npm install -g fsevents@1.2.9` and rebuilding the package when requested, in Atom, should solve it.

## Releasing new versions

### Publishing packages declared in `gicentre/litvis`

> TODO

### Upgrading Vega and Vega-Lite

[Vega](https://github.com/vega/vega) and [Vega-Lite](`https://github.com/vega/vega-lite`) are not direct dependencies of `gicentre/litvis`.
They are introduced downstream inside NPM package [`mume-with-litvis`](https://www.npmjs.com/package/mume-with-litvis), which in turn is a dependency of Atom and VSCode extensions.

Vega, Vega-Lite and their auxiliary libraries are listed in `mume-with-litvis` → `package.json`.
The versions are specified with `^`, which means that the latest available patches or semver minor features will be picked automatically on extension install (or reinstall).

To upgrade _development_ versions of vega libraries in `mume-with-litvis`, you need to remove them from `pnpm-lock.yaml` and reinstall dependencies (`pnpm install`).

If you need to upgrade major versions, e.g. `vega-lite@X.Y.Z` to `vega-lite@[X+1].0.0`, new extension releases are necessary.
Please follow the steps below.

#### 1. Produce a new version of `mume-with-litvis`

1.  Check out the latest commit on the `main` branch of <https://github.com/gicentre/mume-with-litvis.git>.

1.  Update versions for `vega`, `vega-lite`, `vega-embed`, `vega-loader`, `apache-arrow` or `vega-loader-arrow` in `package.json`.

1.  Run `pnpm install`.

1.  Find `dependentLibraryConfigs` in `src/markdown-engine.ts` and upgrade versions accordingly.
    Note that you might also need to update `buildPathForWebview` if it has changed.

1.  In the unlikely case of breaking changes that affect the lifecycle of vega-based visualizations, consider updating additional files in `src` folder.
    This may be necessary in a small subset of cases, and only when the major versions are bumped.

1.  Update `CHANGELOG.md` file by adding a new `## Unreleased (minor|patch)` section ([example](https://github.com/gicentre/mume-with-litvis/commit/eebd2cf0d7f3fabfd161c9fcb135089dcef833da)).

1.  Commit the changes.

1.  Update `CHANGELOG.md` again by replacing `## Unreleased (...)` with a new expected version number.
    Stage this file.

1.  Run `pnpm publish --minor` or `pnpm publish --patch`.
    This will build `mume-with-litvis` from its source, change version in `package.json`, publish the new version on NPM, commit to `main` and add git tag (`v*`).
    2FA authentication token should be asked as part of this.
    Beware that publishing may [fail on a slow internet connection](https://github.com/npm/npm/issues/19425#issuecomment-381315731) due to the size of `mume-with-litvis` combined with the expiration of 2FA tokens.

1.  Open <https://www.npmjs.com/package/mume-with-litvis> and verify that the package version has been updated.

1.  Commit your change in `package.json` and push both commits to the `main` branch on github.

You may also want to cherry-pick the first commit to `mume` in order to keep the fork in sync with its origin.
Example pull request: [shd101wyy/mume#79](https://github.com/shd101wyy/mume/pull/79).

#### 2. Produce a new version of the VSCode extension

1.  Make sure you have the latest version of `vsce` installed globally.

    ```sh
    npm install -g vsce
    ```

1.  Check out the latest commit on the `main` branch of <https://github.com/gicentre/vscode-markdown-preview-enhanced-with-litvis.git>.

1.  Run `pnpm install`.

1.  Run `pnpm install mume-with-litvis@latest` to update the version of this dependency.

1.  Open `CHANGELOG.md` and document upcoming changes.

1.  Commit (see [example](https://github.com/gicentre/markdown-preview-enhanced-with-litvis/commit/3cd86e1499b8abc45ff806741798c038e098e05d)) and push.

1.  Run `vsce publish patch` or `vsce publish minor` depending on the nature of the upstream changes.
    You will be asked to authenticate at Visual Studio Marketplace if needed.

1.  Push the `main` branch.
