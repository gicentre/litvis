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

## 1. Anatomy of an elm-vegalite specification

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

## 2. Functions for reuse

One common way in which we can use Elm to ease visualization generation is to abstract repeated or changeable specifications into their own parameterised functions.
For example, we might have several visualizations in a document that each load (a different) dataset from the same source.
If we create a function to store the base location of the data (`dataPath` in the example below), we would only need to change that location once should we wish to use a different data source.

```elm {l}
dataPath : String -> Data
dataPath fileName =
    dataFromUrl ("https://vega.github.io/vega-lite/data/" ++ fileName) []
```

```elm {l v}
myVis1 : Spec
myVis1 =
    let
        enc =
            encoding
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pName "Miles_per_Gallon", pMType Quantitative ]
                << color [ mName "Origin", mMType Nominal ]
    in
    toVegaLite [ dataPath "cars.json", circle [], enc [] ]
```

```elm {l v}
myVis2 : Spec
myVis2 =
    let
        enc =
            encoding
                << position X [ pName "date", pMType Temporal ]
                << position Y [ pName "price", pMType Quantitative ]
                << color [ mName "symbol", mMType Nominal ]
    in
    toVegaLite [ dataPath "stocks.csv", line [], enc [] ]
```

## 3. Shaping Data

While vega-lite provides a great deal of flexibility in specifying visualization design, it is less able to create or manipulate the data that are to be visualized.
This is where Elm can be helpful in 'shaping' data to be in a format suitable for working with vega and vega-lite.

### Generating Data Inline

Rather than link to externally generated data sources, it is sometimes useful to use Elm to create data programmatically, especially if those data have some predictable structure or generatable content.
[dataFromColumns](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromColumns), [dataFromRows](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromRows), [dataColumn](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataColumn) and [dataRow](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataRow) are useful elm-vega functions for doing this (see also the use of [dataFromJson](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromJson) in the [Geospatial file format tutorial](../geoTutorials/geoFormats.md)).

In the example below we use Elm's `List.range` function to generate a list of integers from 1 to 720, the `List.map` function to turn each of those integer into a floating point number and an anonymous function to generate a list of the cosines of each of those values.
We then create two 'columns' of data for use in the visualization specification.
When specifying a data column (with `dataColumn`) have to state the type of data, which in this case is a list of numbers indicated by [nums](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#nums).

```elm {l v}
trigCurves : Spec
trigCurves =
    let
        xs =
            List.range 0 720 |> List.map toFloat

        ys =
            List.map (\x -> cos (degrees x)) xs

        data =
            dataFromColumns []
                << dataColumn "x" (nums xs)
                << dataColumn "y" (nums ys)

        enc =
            encoding
                << position X [ pName "x", pMType Quantitative ]
                << position Y [ pName "y", pMType Quantitative ]
    in
    toVegaLite [ data [], line [], enc [] ]
```

{(question |}

Can you modify the example above so it shows both the cosine and sine curves for angles between 0 and 720 degrees?

{|question )}

### Tidy Data

Suppose we have some data we wish to visualise that represents values in three categories (e.g. number of bronze, silver and gold medals won by a country). We might represent the data with three numbers, e.g. `30, 15, 12` indicating the tallies for bronze, silver and gold medals respectively.

If we had data for several countries, we might represent those triples grouped as a table, where each column contains the medal tally for a single country:

| column 1 | column 2 | column 3 | column 4 |
| -------- | -------- | -------- | -------- |
| 30,15,12 | 25,30,25 | 10,28,11 | 18,24,16 |

If we had such data for two years, we might add a further row to the table:

|           | column 1 | column 2 | column 3 | column 4 |
| --------- | -------- | -------- | -------- | -------- |
| **row 1** | 30,15,12 | 25,30,25 | 10,28,11 | 18,24,16 |
| **row 2** | 8,8,29   | 11,24,12 | 26,32,9  | 8,18,28  |

This tabular structure is convenient when working with spreadsheets, or when displaying the data compactly in tabular form.
However, it is not well suited for manipulating programmatically because much of the information is implicitly encoded by the order of numbers (e.g. whether a number represents a silver medal is dependent on its position in a triple of numbers).

Instead it is much more reliable to express the data table in [tidy format](https://vita.had.co.nz/papers/tidy-data.pdf).
That is, in such a way that the order of values in a table is independent of their meaning and that columns of data represent _variables_ and rows of data _observations_.
In our medals example, we could restructure the data as follows:

| row | column | categoy | value |
| --- | ------ | ------- | ----- |
| 1   | 1      | 1       | 30    |
| 1   | 1      | 2       | 15    |
| 1   | 1      | 3       | 12    |
| 1   | 2      | 1       | 25    |
| 1   | 2      | 2       | 30    |
| 1   | 2      | 3       | 25    |
| 1   | 3      | 1       | 10    |
| 1   | 3      | 2       | 28    |
| 1   | 3      | 3       | 11    |
| 2   | 4      | 1       | 18    |
| 2   | 4      | 2       | 24    |
| 2   | 4      | 3       | 16    |
| 2   | 1      | 1       | 8     |
| 2   | 1      | 2       | 8     |
| 2   | 1      | 3       | 29    |
| 2   | 2      | 1       | 11    |
| 2   | 2      | 2       | 24    |
| 2   | 2      | 3       | 12    |
| 2   | 3      | 1       | 26    |
| 2   | 3      | 2       | 32    |
| 2   | 3      | 3       | 9     |
| 2   | 4      | 1       | 8     |
| 2   | 4      | 2       | 18    |
| 2   | 4      | 3       | 28    |

Here, the row and column positions are encoded explicitly so that even if we changed the order of rows or columns, the meaning of the data would not change.
We can use Elm functions to reshape a data table into tidy format.
The example below shows how we might generate the tidy table above:

```elm {l}
tidyData : List DataColumn -> Data
tidyData =
    let
        ( numRows, numCols, numCats ) =
            ( 2, 4, 3 )

        rows =
            List.range 1 numRows
                |> List.concatMap (\x -> List.repeat (numCats * numCols) (toFloat x))
                |> nums

        cols =
            List.range 1 numCols
                |> List.concatMap (\x -> List.repeat numCats (toFloat x))
                |> List.repeat 2
                |> List.concat
                |> nums

        cats =
            List.range 1 numCats
                |> List.map toFloat
                |> List.repeat (numRows * numCols)
                |> List.concat
                |> nums

        vals =
            [ 30, 15, 12, 25, 30, 25, 10, 28, 11, 18, 24, 16 ]
                ++ [ 8, 8, 29, 11, 24, 12, 26, 32, 9, 8, 18, 28 ]
                |> nums
    in
    dataFromColumns []
        << dataColumn "row" rows
        << dataColumn "col" cols
        << dataColumn "cat" cats
        << dataColumn "val" vals
```

This provides us with a tidy data table that we can use to generate a collection of bar charts faceted by row and column value:

```elm {l v}
barGrid : Spec
barGrid =
    let
        cfg =
            -- Styling to remove axis gridlines and labels
            configure
                << configuration (coHeader [ hdLabelFontSize 0.1 ])
                << configuration (coView [ vicoStroke Nothing, vicoHeight 120 ])

        enc =
            encoding
                << position X [ pName "cat", pMType Ordinal, pAxis [] ]
                << position Y [ pName "val", pMType Quantitative, pAxis [] ]
                << color [ mName "cat", mMType Nominal, mLegend [] ]
    in
    toVegaLite
        [ cfg []
        , tidyData []
        , spacing 50
        , specification (asSpec [ width 120, height 120, bar [], enc [] ])
        , facet
            [ rowBy [ fName "row", fMType Ordinal, fHeader [ hdTitle "" ] ]
            , columnBy [ fName "col", fMType Ordinal, fHeader [ hdTitle "" ] ]
            ]
        ]
```

{(question |}

Can you modify the example above so it facets by category for each row so it looks as follows?

![Faceted bar grid](images/facetExample.png)

_Hint: You do not need to make any changes to the tidy data table._

{|question )}
