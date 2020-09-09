# Literate Visualization &middot; [![License: BSD 3-Clause](https://img.shields.io/badge/license-BSD_3--Clause-blue.svg)](./LICENSE) [![GitHub Workflow Status (checks)](https://img.shields.io/github/workflow/status/gicentre/litvis/Checks?label=checks)](https://github.com/gicentre/litvis/actions?query=workflow%3AChecks) [![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/) [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

A light-touch approach to designing, building and describing visualization. Here you will find

- [Tutorials](documents/tutorials) for working with litvis, Elm and elm-vega/vegalite.
- [Examples](examples) of literate visualization.
- [Documentation](documents) of the litvis markdown syntax.
- [Narrative Schemas](narrative-schemas) to help you write literate visualization documents.
- [Packages](packages) for developers working with litvis and NPM.

## Setting up litvis

Litvis documents can be viewed and created in either the _VS Code_ (recommended) or _Atom_ editors:

1.  If you don't have it already, [install Node.js](https://nodejs.org/en). This will allow you to use _npm_, used for installing some of the other necessary software.

1.  Open a terminal window and install [Elm](http://elm-lang.org), [Prettier](https://prettier.io/) and [Prettier Elm plugin](https://github.com/gicentre/prettier-plugin-elm) with the following command:

    ```sh
    npm install --global elm prettier prettier-plugin-elm
    ```

    _If you cannot install with npm because of 'EACCES write permission errors', see [these instructions](https://docs.npmjs.com/getting-started/fixing-npm-permissions) on how to prevent them._

1.  Install either the [VS Code](https://code.visualstudio.com) or [Atom](https://atom.io) editor.

1.  Depending on which editor you wish to use, install the litvis extensions:

    **If using VS Code:**

    - Select `View → Extensions`

    - Search for `markdown-preview-enhanced-with-litvis` and then click `install` next to the returned result _(main litvis functionality)_.

    - Search for `prettier - Code formatter` and install _(auto-formats code)_.

    - Search for `elm tooling` and install _(syntax highlighting of Elm code)_.

    **If using Atom:**

    - Select `Atom → Preferences → Install` (or `File → Settings → Install` on Windows)

    - Search for `markdown-preview-enhanced-with-litvis` and then click `install` next to the returned result _(main litvis functionality)_.

    - Search for `prettier-atom` and install _(auto-formats code)_.

    - Search for `language-elm` and install _(syntax highlighting of Elm code)_.

    - Search for `language-markdown` and install _(markdown syntax highlighting)_.

    - When you create your first document in Atom, you may be asked to install further dependencies such as `linter`, `linter-ui-default` and `busy-signal`. Install these and any other dependencies if requested.

1.  Configuring Your Editor

    To make using litvis as smooth as possible, we recommend the following editor configuration options:

    **If using VS Code:**

    - Under `Preferences->Settings`, change the following from their default settings:
      - `Text Editor -> Formatting`: ensure `Format On Save` is ticked
      - `Extensions -> Markdown Preview Enhanced with litvis`: ensure `Live Update` is _not_ ticked.
      - `Extensions -> Prettier` and ensure `Prettier: Resolve Global Modules` is ticked.

    **If using Atom:**

    - `Settings->Packages` (Windows) or `Atom->Preferences->Packages` (MacOS) or `Edit->Preferences->Packages` (Linux), scroll down to _Prettier-atom_, click `Settings` and make sure `Format files on Save` is ticked.
    - In `Packages` (as above) scroll down to _Markdown-Preview-Enhanced-with-litvis_, click `Settings` and ensure `live Update` and ensure it is _not_ ticked.

You should now be good to go! Get started by [writing your first litvis document](documents/tutorials/introduction/intro1.md) and looking at these [tutorials](documents/tutorials/README.md).

## ‘Hello world’ in literate Elm

Adding litvis attribute `l` (or `literate`) to `elm` blocks in markdown automatically compiles and executes the code in real time. Attribute `r` (or `raw`) is the simplest way to see the result.

![helloworld](https://user-images.githubusercontent.com/1846999/91957582-21bb6900-ecfe-11ea-910f-7c42fa9dc429.gif)

> [examples/features/helloWorld.md](examples/features/helloWorld.md)

## Simple litvis chart

A litvis code block with attribute `v` (or `visualize`) automatically renders the declared symbol using [`elm-vegalite`](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest) or [`elm-vega`](https://package.elm-lang.org/packages/gicentre/elm-vega/latest/).

![simplechart](https://user-images.githubusercontent.com/1846999/91957636-37309300-ecfe-11ea-844d-03ea877f92cc.gif)

> [examples/features/simpleChart.md](examples/features/simpleChart.md)

## Code referencing across blocks

By default, litvis code blocks share the same execution context, which means that an Elm symbol defined in one block and can be referenced in another block. Blocks can be placed in any order.

![codereferencingcodeblocks](https://user-images.githubusercontent.com/1846999/91957686-44e61880-ecfe-11ea-8c39-e1fc1f599b6d.gif)

> [examples/features/codeReferencingAcrossBlocks.md](examples/features/codeReferencingAcrossBlocks.md)

## Code referencing with triple hat notation

Symbols from Elm code blocks can be referenced in any part of the markdown using triple hat notation (`^^^`).

![codereferencingtriplehat](https://user-images.githubusercontent.com/1846999/91960101-6399de80-ed01-11ea-8e67-b1570bcd5e03.gif)

> [examples/features/codeReferencingWithTripleHatNotation.md](examples/features/codeReferencingWithTripleHatNotation.md)

## Code referencing with parameters

Triple hat references accept parametrized function calls, which makes it easy to combine text with graphics and produce families of related graphics. This means that small multiples and embedded graphics such as sparklines are straightforward.

![codereferencingparams](https://user-images.githubusercontent.com/1846999/91957801-71019980-ecfe-11ea-8a4e-1a65e1a5bfea.gif)

> [examples/features/codeReferencingWithParameters.md](examples/features/codeReferencingWithParameters.md)

## Debugging Code

A litvis document that is being previewed is constantly checked for program validity. Any issues that are detected are displayed in the editing environment and help with debugging. If a visualization has been successfully rendered before the issue had occurred, its old preview is shown to avoid unwanted markup reflows.

Replacing `v` with `r` for `raw` or `j` for `json` makes it possible to look into generated vega-lite specs.
This can help debugging more deeply embedded problems or for generating standard JSON Vega/Vega-Lite specifications.

![debuggingvegalite](https://user-images.githubusercontent.com/1846999/91960996-7e208780-ed02-11ea-96c5-6765db519da3.gif)

> [examples/features/debuggingVegaLite.md](examples/features/debuggingVegaLite.md)

## Interaction

Adding `interactive` to a code block with `v` or a triple hat reference makes visualizations live if interaction is described within `Spec`. User input controls can be added to the document, if desired.

![interaction](https://user-images.githubusercontent.com/1846999/91964258-d35e9800-ed06-11ea-8fac-a1f365d78626.gif)

> [examples/features/interaction.md](examples/features/interaction.md)

### Multiple execution contexts

Although a single Elm execution context may be sufficient in many litvis narratives, context isolation may be desired in some cases. A number of code block attributes such as `context`, `id`, `follows`, `isolated` and `siding` enable fine-grained control of Elm symbol visibility, thus making it easier to accomplish certain tasks.

A `siding` (or `s`) is a shortcut for `isolated follows=default`. This keyword makes previously defined symbols in `default` context available within the code block, but avoids name clashes with any blocks later in the document.

![codesidings](https://user-images.githubusercontent.com/1846999/91977772-0b6fd600-ed1b-11ea-8c88-89fbc0136be8.gif)

> [examples/features/codeSidings.md](examples/features/codeSidings.md)

### Branching narratives

A litvis narrative can be split between multiple markdown documents, where each document `follows` its parent. This enables routine use of parallel branching narratives that assemble and structure document trees. Each branch in a tree can represent alternative designs each with their own rationale or focus for analysis.

![branchingnarratives](https://user-images.githubusercontent.com/1846999/91979139-34916600-ed1d-11ea-98b7-ef316f010130.gif)

> [examples/features/branching/root.md](examples/features/branching/root.md) > [examples/features/branching/branchA.md](examples/features/branching/branchA.md) > [examples/features/branching/branchB.md](examples/features/branching/branchB.md)

### Narrative schemas

A litvis narrative can be linked to a set of YAML files, which define `labels`, `rules` and `styling`.
These narrative schemas can be thought of as an analogue of schemas more usually found in declarative programming contexts such as JSON and XML schema.

The purpose of the schema is to provide a set of structured guidelines to assist in writing the narrative content around visualizations. This can be thought of as form of scaffolding to assist in the process of design exposition or reasoning. Schemas can be used to validate litvis documents.

![narrativeschemas](https://user-images.githubusercontent.com/1846999/91980779-b71b2500-ed1f-11ea-8e88-30ab35c90455.gif)

> [examples/crossQuadCharts.md](examples/crossQuadCharts.md) > [narrative-schemas/idiom.yml](narrative-schemas/idiom.yml)

## Automatic code formatting

Litvis integrates with [Prettier](https://prettier.io/) and its [Elm plugin](https://github.com/gicentre/prettier-plugin-elm), which enables seamless document formatting as the narrative is being written. A file is automatically _prettified_ on save or when the _Format_ command is explicitly called. Formatting keeps litvis files in a readable and maintainable state, which eases collaboration and reduces distraction from the higher-level tasks.

![formatting1000](https://user-images.githubusercontent.com/1846999/91981866-5ab90500-ed21-11ea-9629-ded732008cda.gif)

> [examples/lunarEclipse.md](examples/lunarEclipse.md)
