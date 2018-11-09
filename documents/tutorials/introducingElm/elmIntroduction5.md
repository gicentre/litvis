---
id: "litvis"
narrative-schemas:
  - ../schemas/tutorial
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

@import "../css/tutorial.less"

_Litvis tutorials: Introducing Elm_

1.  [Introduction](elmIntroduction1.md)
2.  [Functions, functions, functions](elmIntroduction2.md)
3.  [Types and pattern matching](elmIntroduction3.md)
4.  [Lists and list processing](elmIntroduction4.md)
5.  **Elm and elm-vegalite**

---

# Elm and elm-vegalite

The primary goal of litvis is to allow visualizations to be easily integrated into narratives that can describe their design or use.
We can use Elm to help with the visualization side of things by using the [elm-vegalite](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/) and, for more flexible but verbose specifications, [elm-vega](https://package.elm-lang.org/packages/gicentre/elm-vega/latest/) packages.

In this tutorial we won't go into too much detail about how to use these packages – for that have a look at the [introduction to elm-vegalite](../introduction/intro1.md) and [elm-vegalite walkthrough](../elmVegaliteWalkthrough/elmVegaliteWalkthrough1.md).
Instead we will consider how to use some of the ideas discussed in this Elm tutorial to help writing functions for visualization.

## The anatomy of a typical elm-vegalite specification

Let's consider a simple but typical visualization specification in elm-vegalite:

```elm {v l}
import VegaLite exposing (..)


scatterplot : Spec
scatterplot =
    let
        cars =
            dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" []

        enc =
            encoding
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pName "Miles_per_Gallon", pMType Quantitative ]
                << color [ mName "Origin", mMType Nominal ]
    in
    toVegaLite [ cars, circle [], enc [] ]
```

This particular example imports the `VegaLite` package in the same code block as the specification code, but more commonly the import line can be placed inside its own code block at the top of a document.
This makes things a little neater, especially when a document contains several specifications.

Note that the entire specification is declared inside a single function, here called `scatterplot`.
It is necessary to provide a _type signature_ to the function indicating that it will return a `Spec`, which is the _type_ elm-vegalite uses for representing a visualization specification.

The work of creating the JSON specification that is required by Vega-Lite is done by the `toVegaLite` function.
To make the code readable, the elements of the specification are stored as named functions using `let`, typically separating the data (`cars`) from the visual encoding rules (`enc`) from the visual marks (`circle`) used.

Encoding is often where most of the design details are represented.
It represents the specification of which aspects of the data are represented by which visualization channels.
Depending on the complexity of the design, encoding can incorporate many different elements such as size, position, colour and opacity.

Each encoding function, such as `position` or `color` takes as one of its parameters a list of `LabelledSpec` types to which it adds a new `LabelledSpec` before returning the newly appended list of `LabelledSpec`.

Using the functional composition operator (`<<`) and point-free style keeps the code clean and simple (as above), but it should be noted that the same encoding could be represented by piping and empty list to an encoding channel function before piping that one to the next etc.
So the following is exactly equivalent to the example above, but harder to read:

```elm {xl siding}
scatterplot2 : Spec
scatterplot2 =
    let
        cars =
            dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" []

        enc =
            encoding
                (position X [ pName "Horsepower", pMType Quantitative ] <|
                    position Y [ pName "Miles_per_Gallon", pMType Quantitative ] <|
                        color [ mName "Origin", mMType Nominal ] <|
                            []
                )
    in
    toVegaLite [ cars, circle [], enc ]
```

Or with brackets rather than the `<|` operator (again exactly the equivalent of the previous examples):

```elm {l siding}
scatterplot3 : Spec
scatterplot3 =
    let
        cars =
            dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" []

        enc =
            encoding
                (position X
                    [ pName "Horsepower", pMType Quantitative ]
                    (position Y
                        [ pName "Miles_per_Gallon", pMType Quantitative ]
                        (color [ mName "Origin", mMType Nominal ]
                            []
                        )
                    )
                )
    in
    toVegaLite [ cars, circle [], enc ]
```

It should be clear why functional composition is the preferred style for this kind of chaining of related functions.
