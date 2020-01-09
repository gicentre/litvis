---
id: "litvis"
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

@import "../css/tutorial.less"

1.  **Introduction**
2.  [Single View Specifications](elmVegaliteWalkthrough2.md)
3.  [Layered and Multi-view Composition](elmVegaliteWalkthrough3.md)
4.  [Interaction](elmVegaliteWalkthrough4.md)

---

# A Walk through elm-vegalite in litvis

At the heart of litvis is the ability to create a range of expressive visualizations using [elm-vegalite](https://github.com/gicentre/elm-vegalite). This walkthrough will show how to use elm-vegalite to create interactive visualizations in the [Elm](http://elm-lang.org) language embedded within a litvis document. The content is based on the talk given by [Wongsuphasawat et al at the 2017 Open Vis Conf](https://youtu.be/9uaHRWj04D4). If you wish to follow along with their talk, timings are given by each section.

To use elm-vegalite in a litvis document you first need to import the library, which typically in a litvis document is placed in a short section of hidden code (view the markdown source to see it).

```elm {l=hidden}
import VegaLite exposing (..)
```

## A Grammar of Graphics ([0:30](https://youtu.be/9uaHRWj04D4?t=30s))

Elm-vegalite is a wrapper for the [Vega-Lite visualization grammar](https://vega.github.io) which itself is based on Leland Wilkinson's [Grammar of Graphics](http://www.springer.com/gb/book/9780387245447). The grammar provides an expressive way to define how data are represented graphically. The seven key elements of the grammar as represented in elm-vegalite and Vega-Lite are:

- **Data**: The input to visualize. _Example elm-vegalite functions:_ [dataFromUrl](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromUrl), [dataFromColumns](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromColumns) and [dataFromRows](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromRows).
- **Transform**: Functions to change the data before they are visualized. _Example elm-vegalite functions:_ [filter](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#filter), [calculateAs](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs) and [binAs](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#binAs).
- **Projection**: The mapping of 3d global geospatial locations onto a 2d plane . _Example elm-vegalite function:_ [projection](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#projection).
- **Mark**: The visual symbol(s) that represent the data. _Example elm-vegalite functions:_ [line](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#line), [circle](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#circle), [bar](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#bar), [textMark](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#textMark) and [geoshape](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#geoshape).
- **Encoding**: The specification of which data elements are mapped to which mark characteristics (commonly known as _channels_). _Example elm-vegalite functions:_ [position](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#position), [shape](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#shape), [size](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#size) and [color](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#color).
- **Scale**: Descriptions of the way encoded marks represent the data. _Example elm-vegalite functions:_ [scDomain](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scDomain), [scPadding](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scPadding) and [scInterpolate](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scInterpolate).
- **Guides**: Supplementary visual elements that support interpreting the visualization. _Example elm-vegalite functions:_ [axTitle](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#axTitle) (for position encodings) and [leTitle](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#leTitle) (for color, size and shape encodings).

In common with other languages that build upon a grammar of graphics such as D3 and Vega, this grammar allows fine grain control of visualization design. But unlike those languages, Vega-Lite and elm-vegalite provide practical default specifications for most of the grammar, allowing for a much more compact high-level form of expression.

---

_Next >>_ [Single View Specifications](elmVegaliteWalkthrough2.md)
