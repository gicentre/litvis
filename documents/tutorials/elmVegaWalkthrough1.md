---
id: "litvis"
elm:
    dependencies:
        gicentre/elm-vega: latest
---

<link href="https://fonts.googleapis.com/css?family=Roboto+Condensed:300|Fjalla+One" rel="stylesheet">

@import "css/tutorial.less"

1.  **Introduction**
2.  [Single View Specifications](elmVegaWalkthrough2.md)
3.  [Layered and Multi-view Composition](elmVegaWalkthrough3.md)
4.  [Interaction](elmVegaWalkthrough4.md)

---

# A Walk through elm-vega in litvis

At the heart of litvis is the ability to create a range of expressive visualizations using [elm-vega](https://github.com/gicentre/elm-vega).
This walkthrough will show how to use elm-vega to create interactive visualizations in the [Elm](http://elm-lang.org) language embedded within a litvis document.
The content is based on the talk given by [Wongsuphasawat et al at the 2017 Open Vis Conf](https://youtu.be/9uaHRWj04D4).
If you wish to follow along with their talk, timings are given by each section.

To use elm-vega in a litvis document you first need to import the library, which typically in a litvis document is placed in a short section of hidden code (view the markdown source to see it).

```elm {l=hidden}
import VegaLite exposing (..)
```

## A Grammar of Graphics ([0:30](https://youtu.be/9uaHRWj04D4?t=30s))

Elm-vega is a wrapper for the [Vega-Lite visualization grammar](https://vega.github.io) which itself is based on Leland Wilkinson's [Grammar of Graphics](http://www.springer.com/gb/book/9780387245447).
The grammar provides an expressive way to define how data are represented graphically.
The seven key elements of the grammar as represented in elm-vega and Vega-Lite are:

*   **Data**: The input to visualize. _Example elm-vega functions:_ [dataFromUrl](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#dataFromUrl), [dataFromColumns](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#dataFromColumns) and [dataFromRows](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#dataFromRows).
*   **Transform**: Functions to change the data before they are visualized. _Example elm-vega functions:_ [filter](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#filter), [calculateAs](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#calculateAs) and [binAs](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#binAs).
*   **Projection**: The mapping of 3d global geospatial locations onto a 2d plane . _Example elm-vega function:_ [projection](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#projection).
*   **Mark**: The visual symbol(s) that represent the data. _Example elm-vega types:_ [Line](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#Mark), [Circle](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#Mark), [Bar](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#Mark), [Text](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#Mark) and [Geoshape](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#Mark).
*   **Encoding**: The specification of which data elements are mapped to which mark characteristics (commonly known as _channels_). _Example elm-vega functions:_ [position](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#position), [shape](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#shape), [size](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#size) and [color](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#color).
*   **Scale**: Descriptions of the way encoded marks represent the data. _Example elm-vega types:_ [SDomain](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#ScaleProperty), [SPadding](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#ScaleProperty) and [SInterpolate](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#ScaleProperty).
*   **Guides**: Supplementary visual elements that support interpreting the visualization. _Example elm-vega types:_ [Axis](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#AxisProperty) (for position encodings) and [Legend](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#LegendProperty) (for color, size and shape encodings).

In common with other languages that build upon a grammar of graphics such as D3 and Vega, this grammar allows fine grain control of visualization design.
But unlike those languages, Vega-Lite and elm-vega provide practical default specifications for most of the grammar, allowing for a much more compact high-level form of expression.

---

_Next >>_ [Single View Specifications](elmVegaWalkthrough2.md)
