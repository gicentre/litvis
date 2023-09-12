---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Bar Charts

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Simple bar chart

Simple bar charts order categorical variables on one axis and quantitative measures on the other.

```elm {v l}
barChart : Spec
barChart =
    let
        data =
            dataFromColumns []
                << dataColumn "a" (strs [ "A", "B", "C", "D", "E", "F", "G", "H", "I" ])
                << dataColumn "b" (nums [ 28, 55, 43, 91, 81, 53, 19, 87, 52 ])

        enc =
            encoding
                << position X [ pName "a", pOrdinal ]
                << position Y [ pName "b", pQuant ]
    in
    toVegaLite [ data [], enc [], bar [] ]
```

---

## Frequency histogram

Shows the _distribution_ of a set of variables. Note how the specification just names a single variable (here `IMDB Rating`) and we get Vega-Lite to categorise the variable into groups (bins) with [pBin](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pBin) and calculate the number of items in each bin with [pAggregate](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pAggregate) and [opCount](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#opCount). Binning and aggregation both create quantitative data so there is no need to specify the measurement type (`pQuant` etc.).

```elm {v l}
histo : Spec
histo =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        enc =
            encoding
                << position X [ pName "IMDB Rating", pBin [] ]
                << position Y [ pAggregate opCount ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

---

## Total histogram

A variation of the frequency histogram where we calculate the sum (with [opSum](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#opSum) rather than [opCount](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#opCount)) of items in a set of bins. Here we arrange groups on the vertical Y axis to give the basis for a 'population pyramid'. [`pSort`][https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pSort](`[ soDescending )`](<https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#soDescending>) is used to reverse the default vertical ordering of age categories so that the youngest is at the bottom. Note also the use a [filter](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#filter) transformation to select only those items in the dataset from the year 2000.

```elm {v l}
populationCounts : Spec
populationCounts =
    let
        data =
            dataFromUrl (path ++ "population.json") []

        trans =
            transform
                << filter (fiExpr "datum.year == 2000")

        enc =
            encoding
                << position X
                    [ pName "people"
                    , pAggregate opSum
                    , pTitle "population"
                    ]
                << position Y
                    [ pName "age"
                    , pOrdinal
                    , pAxis [ axTicks False, axDomain False, axOffset 5 ]
                    , pSort [ soDescending ]
                    ]
    in
    toVegaLite [ data, trans [], enc [], bar [] ]
```

---

## Stacked histogram

As the example above but additionally coloured by female (orange) and male (blue), which generates a stacked bar chart.

```elm {v l}
stackedBar : Spec
stackedBar =
    let
        data =
            dataFromUrl (path ++ "population.json") []

        trans =
            transform
                << filter (fiExpr "datum.year == 2000")

        enc =
            encoding
                << position X
                    [ pName "people"
                    , pAggregate opSum
                    , pTitle "population"
                    ]
                << position Y
                    [ pName "age"
                    , pOrdinal
                    , pSort [ soDescending ]
                    , pAxis [ axTicks False, axDomain False, axOffset 5 ]
                    ]
                << color
                    [ mName "sex"
                    , mLegend [] -- No colour legend
                    ]
    in
    toVegaLite [ data, trans [], enc [], bar [] ]
```

---

## Overlaid histogram

By default, bars that have a colour encoding are 'stacked' (as above), but by setting [pStack](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pStack) to [stNone](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#stNone), they are overlaid instead. To see the shorter bar "underneath" the longer one, we can make them semi-transparent with the mark property [maOpacity](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#maOpacity). Note also that the maximum count is now around 12m, rather than 24m as we are no longer accumulating both female and male counts in a single bar.

```elm {v l}
layeredBar : Spec
layeredBar =
    let
        data =
            dataFromUrl (path ++ "population.json") []

        trans =
            transform
                << filter (fiExpr "datum.year == 2000")

        enc =
            encoding
                << position X
                    [ pName "people"
                    , pAggregate opSum
                    , pStack stNone
                    , pTitle "population"
                    ]
                << position Y
                    [ pName "age"
                    , pOrdinal
                    , pSort [ soDescending ]
                    , pAxis [ axTicks False, axDomain False, axOffset 5 ]
                    ]
                << color
                    [ mName "sex"
                    , mLegend [] -- No colour legend
                    ]
    in
    toVegaLite [ width 300, data, trans [], enc [], bar [ maOpacity 0.7 ] ]
```

---

## Population pyramid

Distribution coloured by gender. As with the previous example but additionally we use colour to distinguish (orange) female and (blue) male populations and we no longer filter just data from 2000. The Female/Male bars are stacked from the centre with [pStack](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pStack) and [stCenter](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#stCenter) rather than the default which would stack bars from the left. This gives a gendered pyramid layout.

```elm {v l}
popPyramid : Spec
popPyramid =
    let
        cfg =
            configure
                -- Remove outer bounding box
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromUrl (path ++ "population.json") []

        enc =
            encoding
                << position X
                    [ pName "people"
                    , pAggregate opSum
                    , pAxis [] -- No horizontal axis
                    , pStack stCenter -- Centre the stacked bars
                    ]
                << position Y
                    [ pName "age"
                    , pOrdinal
                    , pSort [ soDescending ]
                    , pAxis [ axDomain False, axTicks False, axOffset 20 ]
                    ]
                << color
                    [ mName "sex"
                    , mLegend [] -- No legend
                    ]
    in
    toVegaLite [ width 400, cfg [], data, enc [], bar [] ]
```

---

## Normalised bar chart

Normalised stacked bars provide emphasise the part-to-whole relationship for each age category at the cost of hiding absolute numbers in each category. Here we show the same population data and gender split. The 50% marker is shown on top of the bars by setting its 'z-index' to 1 with [axZIndex](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#axZIndex).

```elm {v l}
popNormalised : Spec
popNormalised =
    let
        cfg =
            configure
                -- No outer bounding rectangle
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromUrl (path ++ "population.json") []

        enc =
            encoding
                << position X
                    [ pName "people"
                    , pAggregate opSum -- Find total in each group
                    , pAxis
                        [ axValues (nums [ 0.5 ]) -- Show 50% marker only
                        , axTitle "" -- No axis title
                        , axFormat "%" -- Format axis label numbers as a percentages
                        , axZIndex 1 -- Place axis grid line on top
                        , axDomain False -- No axis baseline
                        ]
                    , pStack stNormalize -- Normalise width of all bars
                    ]
                << position Y
                    [ pName "age"
                    , pOrdinal
                    , pSort [ soDescending ]
                    , pAxis [ axDomain False, axTicks False, axOffset 10 ]
                    ]
                << color
                    [ mName "sex"
                    , mLegend [] -- No legend
                    ]
    in
    toVegaLite [ width 400, cfg [], data, enc [], bar [] ]
```

---

## Stacked bar chart with custom colours and ordering

A stacked bar chart with custom stack order and custom colours. The colours are specified with a [categoricalDomainMap](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#categoricalDomainMap), which also determines the legend order. The order in which bars are stacked is determined by creating a new field, here called `weatherOrder`, using the [calculateAs](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs) transformation function and providing a series of nested [conditional expressions](https://vega.github.io/vega/docs/expressions/#control-flow-functions). Note the use of `"""` to provide a multi-line string, making the nested layout easier to read. If a single `"` were used, all the `if` clauses would need to be on a single line, which would be harder to read.

```elm {v l}
weatherBars : Spec
weatherBars =
    let
        data =
            dataFromUrl (path ++ "seattle-weather.csv") []

        trans =
            transform
                -- Create new field based on weather field. Numeric values used to determine order
                << calculateAs """if(datum.weather == 'rain', 0,
                                     if(datum.weather == 'drizzle', 1,
                                        if(datum.weather == 'snow', 2,
                                           if(datum.weather == 'fog', 3,
                                              4))))"""
                    "weatherOrder"

        weatherColours =
            -- Create a mapping from weather value to its (hex) colour
            categoricalDomainMap
                [ ( "sun", "#e7ba52" )
                , ( "fog", "#c7c7c7" )
                , ( "snow", "#eeeeee" )
                , ( "drizzle", "#aec7ea" )
                , ( "rain", "#1f77b4" )
                ]

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pOrdinal -- Ensures bars span full month
                    , pTimeUnit month -- Group dates into months
                    , pTitle "" -- Remove horizontal axis title
                    ]
                << position Y
                    [ pAggregate opCount -- Count up frequencies in each group
                    , pStack stNormalize -- Make all bars the same height
                    , pAxis [] -- Remove vertical axis
                    ]
                << color
                    [ mName "weather"
                    , mScale weatherColours -- Use custom colour scale
                    , mTitle "" -- Remove legend title
                    ]
                << order
                    -- Order stacked bars by custom weatherOrder
                    [ oName "weatherOrder" ]
    in
    toVegaLite [ width 300, data, trans [], enc [], bar [] ]
```

---

## Bi-directional bar chart

The 'baseline' of a bar chart will default to being positioned at 0. This means that if the data mapped to bar length contains negative as well as positive values, bars will extend both downwards and upwards. In this example, bar categories (political party) are ordered by the amount of change with [pSort](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pSort) and [soByField](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#soByField). Custom colours are specified via [categoricalDomainMap](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#categoricalDomainMap).

Data from [@ElectionMapsUK](https://twitter.com/ElectionMapsUK)

```elm {v l}
changeBarchart : Spec
changeBarchart =
    let
        data =
            dataFromColumns []
                << dataColumn "Party"
                    (strs
                        [ "Conservative"
                        , "Labour"
                        , "LibDem"
                        , "Ukip"
                        , "Green"
                        , "Independent"
                        ]
                    )
                << dataColumn "Change" (nums [ -4.5, -2.8, 4.5, -5.9, 1.4, 7.3 ])

        partyColours =
            -- Create a mapping from party to its (rgb) colour
            categoricalDomainMap
                [ ( "Conservative", "rgb(65,149,213)" )
                , ( "Green", "rgb(121,175,62)" )
                , ( "Independent", "rgb(166,166,166)" )
                , ( "Labour", "rgb(208,45,65)" )
                , ( "LibDem", "rgb(237,169,65)" )
                , ( "Ukip", "rgb(102,54,114)" )
                ]

        enc =
            encoding
                << position X
                    [ pName "Party"
                    , pSort [ soByField "Change" opMean ]
                    , pAxis []
                    ]
                << position Y
                    [ pName "Change"
                    , pQuant
                    , pTitle "% vote change since 2017"
                    ]
                << color
                    [ mName "Party"
                    , mScale partyColours
                    ]
    in
    toVegaLite [ width 250, data [], enc [], bar [] ]
```

---

## Gantt Chart

A Gantt or ranged bar chart where bars no longer have a common baseline, but are positioned according to some data value.

To specify the positions of both ends of a bar or line, encode with [X](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#Position) for one end and [X2](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#Position) for the other end (or [Y](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#Position) and [Y2](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#Position) for vertical bars).

```elm {v l}
gantt : Spec
gantt =
    let
        data =
            dataFromRows []
                << dataRow [ ( "task", str "task1" ), ( "start", num 0 ), ( "end", num 3 ) ]
                << dataRow [ ( "task", str "task2" ), ( "start", num 3 ), ( "end", num 8 ) ]
                << dataRow [ ( "task", str "task3" ), ( "start", num 7 ), ( "end", num 12 ) ]

        enc =
            encoding
                << position X [ pName "start", pQuant, pTitle "Month" ]
                << position X2 [ pName "end" ]
                << position Y [ pName "task", pOrdinal, pTitle "" ]
    in
    toVegaLite [ width 400, data [], enc [], bar [] ]
```

---

## Bars coloured directly by data values

Normally we colour marks via a `color` encoding channel, and depending on the measurement type and colour scheme selected, colours are assigned to each mark. Sometimes we may wish for more explicit control of colours when a dataset contains colour specifications. We can use [raField](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#raField) to set the colour range directly from a data field.

```elm {v l}
barColourFromField : Spec
barColourFromField =
    let
        data =
            dataFromColumns []
                << dataColumn "myColours" (strs [ "red", "green", "blue" ])
                << dataColumn "b" (nums [ 28, 55, 43 ])

        enc =
            encoding
                << position X
                    [ pName "myColours"
                    , pAxis [ axTitle "", axLabelAngle 0 ]
                    ]
                << position Y [ pName "b", pQuant ]
                << color
                    [ mName "myColours"

                    -- Extract colour directly from the myColours field.
                    , mScale [ scRange (raField "myColours") ]
                    ]
    in
    toVegaLite [ width 100, data [], enc [], bar [] ]
```

---

## Wilkinson Dot Plot

A bar chart made of dot symbols shows overall magnitude but also allows direct counting of values without the need for text labels.

This approach uses the [window transform](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#3-16-window-transformations) to group tally counts in the original dataset (see [advanced examples](advanced.md) to other examples of window transforms).

```elm {l v}
wilkinsonDotplot : Spec
wilkinsonDotplot =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "data" (nums [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4 ])

        trans =
            transform
                << window [ ( [ wiOp woRank, wiField "rank" ], "id" ) ]
                    [ wiGroupBy [ "data" ] ]

        enc =
            encoding
                << position X [ pName "data", pAxis [ axTitle "", axLabelAngle 0 ] ]
                << position Y [ pName "id", pAxis [], pSort [ soDescending ] ]
    in
    toVegaLite [ cfg [], height 100, data [], trans [], enc [], circle [ maSize 50 ] ]
```
