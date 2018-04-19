# Literate Visualization

A light-touch approach to designing, building and describing visualization.
Here you will find

*   [Software](software) _litvis_, for creating literate visualization.
*   [Explanations](documents) of the literate visualization process.
*   [Examples](examples) of literate visualization.
*   [Narrative Schemas](narrative-schemas) to help you write literate visualization documents.

## ‘Hello world’ in literate Elm

Adding litvis attribute `literate` (or `l`) to ` ```elm ` blocks in markdown automatically compiles and executes the code in real time.
Attribute `raw` (or `r`) is the simplest way to see the result.

![helloworld](https://user-images.githubusercontent.com/608862/38144403-735c2894-343c-11e8-983a-39487fbb116e.gif)

> [examples/helloWorld.md](examples/helloWorld.md)

## Simple litvis chart

A litvis code block with attribute `visualize` (or `v`) automatically renders the declared symbol using [`elm-vega`](https://github.com/gicentre/elm-vega) / [`vega-lite`](https://vega.github.io/vega-lite/).

![simplechart](https://user-images.githubusercontent.com/608862/38144167-940f5eea-343b-11e8-82d8-96737615febc.gif)

> [examples/simpleChart.md](examples/simpleChart.md)

## Code referencing across blocks

By default, litvis code blocks share the same execution context, which means that an Elm symbol defined in one block and can be referenced in another block.
It is not necessary to maintain the order of blocks to make referencing work.

![codereferencingcodeblocks](https://user-images.githubusercontent.com/608862/38144058-2711026c-343b-11e8-9eb5-080ea07d582c.gif)

> [examples/codeReferencingAcrossBlocks.md](examples/codeReferencingAcrossBlocks.md)

## Code referencing with triple hat notation

Symbols from Elm code blocks can be referenced in any part of the markdown using triple hat notation (`^^^`), e.g. `^^^elm v=barChart^^^`.

![codereferencingtriplehat](https://user-images.githubusercontent.com/608862/38144584-41c5891e-343d-11e8-81c7-a9c0150e409b.gif)

> [examples/codeReferencingWithTripleHatNotation.md](examples/codeReferencingWithTripleHatNotation.md)

## Code referencing with parameters


Triple hat references accept parametrized function calls, which makes it easy to combine text with graphics and produce families of related graphics. This means that small multiples and sparklines are straightforward.

![codereferencingparams](https://user-images.githubusercontent.com/608862/38144395-6e1230ae-343c-11e8-8d45-510ae0c5d161.gif)

> [examples/codeReferencingWithParameters.md](examples/codeReferencingWithParameters.md)

## Debugging `vega-lite` specs

Replacing `v` with `r` for `raw` or `j` for `json` makes it possible to look into generated vega-lite specs.
These attributes follow the same ordering rules as `l` and `v`.

![debuggingvegalite](https://user-images.githubusercontent.com/608862/38144689-de039e56-343d-11e8-9a42-05726e2f87b4.gif)

> [examples/debuggingVegaLite.md](examples/debuggingVegaLite.md)

## Interaction

Adding `interactive` to a code block with `v` or a triple hat reference makes visualizations live if interaction is described within `Spec`.
User input controls can be added to the document, if desired.

![interaction](https://user-images.githubusercontent.com/608862/38144556-178c98e0-343d-11e8-9c98-1e247ff48581.gif)

> [examples/interaction.md](examples/interaction.md)

### Mutliple execution contexts

Although a single Elm execution context may be sufficient in many litivs narratives, context isolation may be desired in some cases.
A number of code block attributes such as `context`, `id`, `follows`, `isolated` and `siding` enable fine-grained control of Elm symbol visibility, thus making it easier to accomplish certain tasks.

A `siding` (or `s`) is a shortcut for `isolated follows=default`.
This keyword makes previously defined symbols in `default` context available within the code block, but avoids name clashes with the following blocks.

![codesidings](https://user-images.githubusercontent.com/608862/38163354-8faa3c9e-34ea-11e8-84d3-d12747238b6d.gif)

> [examples/codeSidings.md](examples/codeSidings.md)

### Branching narratives

A litvis narrative can be split between multiple markdown documents, where each document `follows` its parent.
This enables routine use of parallel branching narratives that assemble and structure document trees.
Each branch in a tree can represent alternative potentially competing designs each with their own rationale.

![branchingnarratives](https://user-images.githubusercontent.com/608862/38163350-84ecde10-34ea-11e8-900c-ec8f4ad46ef0.gif)

> [examples/branching/root.md](examples/branching/root.md)  
> [examples/branching/branchA.md](examples/branching/branchA.md)  
> [examples/branching/branchB.md](examples/branching/branchB.md)

### Narrative schemas

A litvis narrative can be linked to a set of YAML files, which define `labels`, `rules` and `styling`.
These narrative schemas can be thought of as an analogue of schemas more usually found in declarative programming contexts such as JSON and XML schema.
The purpose of the schema is to provide a set of structured guidelines to assist in writing the narrative content around a visualization design.
This can be thought of as form of scaffolding to assist in the process of design exposition.
Schemas can be used to validate litvis documents.

![narrativeschemas](https://user-images.githubusercontent.com/608862/38163859-d69bc4da-34f2-11e8-984d-786118f3100b.gif)

> [examples/crossQuardChart.md](examples/crossQuardChart.md)  
> [schemas/idiom.yml](schemas/idiom.yml)  

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

