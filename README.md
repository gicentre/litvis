# Literate Visualization

<a href="https://travis-ci.org/gicentre/prettier-plugin-elm">
  <img alt="travis" src="https://img.shields.io/travis/gicentre/litvis/master.svg?style=flat-square"><!--
--></a>

A light-touch approach to designing, building and describing visualization.
Here you will find

- [Explanations](documents) of the literate visualization process.
- [Tutorials](documents/tutorials) for working with litvs, Elm and elm-vega.
- [Examples](examples) of literate visualization.
- [Narrative Schemas](narrative-schemas) to help you write literate visualization documents.
- [Packages](packages) for developers working with litvis and NPM.

## Installing litvis

Litvis documents can be viewed and created in either the Atom or VS Code editors:

1.  If you don't have it already, install [Node.js](https://nodejs.org/en).

2.  Open a terminal window and install [Elm](elm), [Prettier](https://prettier.io/) and [Prettier Elm plugin](https://github.com/gicentre/prettier-plugin-elm):

    ```
    npm install --global elm
    npm install --global https://github.com/gicentre/prettier#1.13.0-beta.0
    npm install --global prettier-plugin-elm
    ```

    > The [custom build of Prettier](https://github.com/gicentre/prettier/tree/1.13.0-beta.0) above will be replaced with the official one when [1.13.0 is released](https://github.com/prettier/prettier/issues/4444).

3.  Install either the [Atom](https://atom.io) or [VS Code](https://code.visualstudio.com) editor.

4.  From within the editor, install _litvis_ and _Prettier_ extensions:

    - _In Atom:_ `Atom → Preferences → Install` (or `File → Settings → Install` on Windows)
      _In VSCode:_ `View → Extensions`

    - Search for `markdown-preview-enhanced-with-litvis` and then click the `install` button next to the returned result.

    - Search for `prettier` and then click the `install` button next to the result with the highest number of downloads.

    > **Atom users:** you may want to disable Atom’s standard markdown preview tool by going to `Preferences → Packages` (or `File → Settings → Packages`), searching for `markdown-preview` and clicking `disable`.

    > **VSCode users:** The Prettier extension does not currently work with a global instance of Prettier ([#232](https://github.com/prettier/prettier-vscode/issues/232), [#395](https://github.com/prettier/prettier-vscode/issues/395)). Until this is fixed, please consider installing `prettier` and `prettier-plugin-elm` in your project folder (i.e. without `--global` flag in step 2 above).

5.  If you have been using [`markdown-preview-enhanced`](https://shd101wyy.github.io/markdown-preview-enhanced/#/) extension by [@shd101wyy](https://github.com/shd101wyy/) in your editor, you may want to temporary disable it to avoid keyboard shortcut conflicts.
    There is a plan to merge litvis functionality into this extension, which should ease the setup.

Once you have litvis installed, get started by [writing your first litvis document](documents/tutorials/introduction/intro1.md) and looking at these [tutorials](documents/tutorials/README.md).

## ‘Hello world’ in literate Elm

Adding litvis attribute `literate` (or `l`) to ` ```elm ` blocks in markdown automatically compiles and executes the code in real time.
Attribute `raw` (or `r`) is the simplest way to see the result.

![helloworld](https://user-images.githubusercontent.com/608862/38144403-735c2894-343c-11e8-983a-39487fbb116e.gif)

> [examples/features/helloWorld.md](examples/features/helloWorld.md)

## Simple litvis chart

A litvis code block with attribute `visualize` (or `v`) automatically renders the declared symbol using [`elm-vega`](https://github.com/gicentre/elm-vega) / [`vega-lite`](https://vega.github.io/vega-lite/).

![simplechart](https://user-images.githubusercontent.com/608862/38144167-940f5eea-343b-11e8-82d8-96737615febc.gif)

> [examples/features/simpleChart.md](examples/features/simpleChart.md)

## Code referencing across blocks

By default, litvis code blocks share the same execution context, which means that an Elm symbol defined in one block and can be referenced in another block.
It is not necessary to maintain the order of blocks to make referencing work.

![codereferencingcodeblocks](https://user-images.githubusercontent.com/608862/38144058-2711026c-343b-11e8-9eb5-080ea07d582c.gif)

> [examples/features/codeReferencingAcrossBlocks.md](examples/features/codeReferencingAcrossBlocks.md)

## Code referencing with triple hat notation

Symbols from Elm code blocks can be referenced in any part of the markdown using triple hat notation (`^^^`), e.g. `^^^elm v=barChart^^^`.

![codereferencingtriplehat](https://user-images.githubusercontent.com/608862/38144584-41c5891e-343d-11e8-81c7-a9c0150e409b.gif)

> [examples/features/codeReferencingWithTripleHatNotation.md](examples/features/codeReferencingWithTripleHatNotation.md)

## Code referencing with parameters

Triple hat references accept parametrized function calls, which makes it easy to combine text with graphics and produce families of related graphics. This means that small multiples and sparklines are straightforward.

![codereferencingparams](https://user-images.githubusercontent.com/608862/38144395-6e1230ae-343c-11e8-8d45-510ae0c5d161.gif)

> [examples/features/codeReferencingWithParameters.md](examples/features/codeReferencingWithParameters.md)

## Debugging `vega-lite` specs

Replacing `v` with `r` for `raw` or `j` for `json` makes it possible to look into generated vega-lite specs.
These attributes follow the same ordering rules as `l` and `v`.

![debuggingvegalite](https://user-images.githubusercontent.com/608862/38144689-de039e56-343d-11e8-9a42-05726e2f87b4.gif)

> [examples/features/debuggingVegaLite.md](examples/features/debuggingVegaLite.md)

## Interaction

Adding `interactive` to a code block with `v` or a triple hat reference makes visualizations live if interaction is described within `Spec`.
User input controls can be added to the document, if desired.

![interaction](https://user-images.githubusercontent.com/608862/38144556-178c98e0-343d-11e8-9c98-1e247ff48581.gif)

> [examples/features/interaction.md](examples/features/interaction.md)

### Mutliple execution contexts

Although a single Elm execution context may be sufficient in many litivs narratives, context isolation may be desired in some cases.
A number of code block attributes such as `context`, `id`, `follows`, `isolated` and `siding` enable fine-grained control of Elm symbol visibility, thus making it easier to accomplish certain tasks.

A `siding` (or `s`) is a shortcut for `isolated follows=default`.
This keyword makes previously defined symbols in `default` context available within the code block, but avoids name clashes with the following blocks.

![codesidings](https://user-images.githubusercontent.com/608862/38163354-8faa3c9e-34ea-11e8-84d3-d12747238b6d.gif)

> [examples/features/codeSidings.md](examples/features/codeSidings.md)

### Branching narratives

A litvis narrative can be split between multiple markdown documents, where each document `follows` its parent.
This enables routine use of parallel branching narratives that assemble and structure document trees.
Each branch in a tree can represent alternative potentially competing designs each with their own rationale.

![branchingnarratives](https://user-images.githubusercontent.com/608862/38163350-84ecde10-34ea-11e8-900c-ec8f4ad46ef0.gif)

> [examples/features/branching/root.md](examples/features/branching/root.md) > [examples/features/branching/branchA.md](examples/features/branching/branchA.md) > [examples/features/branching/branchB.md](examples/features/branching/branchB.md)

### Narrative schemas

A litvis narrative can be linked to a set of YAML files, which define `labels`, `rules` and `styling`.
These narrative schemas can be thought of as an analogue of schemas more usually found in declarative programming contexts such as JSON and XML schema.
The purpose of the schema is to provide a set of structured guidelines to assist in writing the narrative content around a visualization design.
This can be thought of as form of scaffolding to assist in the process of design exposition.
Schemas can be used to validate litvis documents.

![narrativeschemas](https://user-images.githubusercontent.com/608862/38163859-d69bc4da-34f2-11e8-984d-786118f3100b.gif)

> [examples/crossQuardChart.md](examples/crossQuardChart.md) > [schemas/idiom.yml](schemas/idiom.yml)

## Linting

A litvis document that is being previewed is constantly checked against various issues.
These issues are displayed in the editing environment and help with debugging.
If a visualization has been successfully rendered before the issue had occurred, its old preview is shown to avoid unwanted markup reflows.

![linting](https://user-images.githubusercontent.com/608862/38143955-bc310866-343a-11e8-94f8-c31a71e6155c.gif)

> [documents/tutorials/geoFormats.md](documents/tutorials/geoFormats.md)

## Automatic code formatting

Litvis integrates with [Prettier](https://prettier.io/) and its [Elm plugin](https://github.com/gicentre/prettier-plugin-elm), which enables seamless document formatting as the narrative is being written.
A file is automatically _prettified_ on save or when the _Format_ command is explicitly called.
Formatting keeps litvis files in a readable and maintainable state, which eases collaboration and reduces distraction from the higher-level tasks.

![formatting1000](https://user-images.githubusercontent.com/608862/38144144-84de604c-343b-11e8-8ffd-f210e2f991ae.gif)

> [examples/lunarEclipse.md](examples/lunarEclipse.md)
