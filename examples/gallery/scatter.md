---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Scatter and Strip Plots

Various charts that use point-based symbols positioned by some data value(s).

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Simple strip plot

Strip plot showing the distribution of a single variable (precipitation) using tick marks. The [tick](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#tick) mark generates a short line suitable for representing single values.

```elm {v l}
strip : Spec
strip =
    let
        data =
            dataFromUrl (path ++ "seattle-weather.csv") []

        enc =
            encoding
                << position X [ pName "precipitation", pQuant ]
    in
    toVegaLite [ data, enc [], tick [] ]
```

---

## Multiple strip plots

Multiple distributions can be shown by displaying tick marks for several categories, here by the body mass of penguins sampled from three islands. To focus the plot on the data points, the x-axis is not required to start at zero by setting its [pScale](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pScale) to [`scZero False`](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scZero).

```elm {v l}
tickDistributions : Spec
tickDistributions =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

        enc =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Island" ]
    in
    toVegaLite [ data, enc [], tick [] ]
```

---

## Simple scatterplot

Positioning two quantitative variables on orthogonal axes and representing the position with a point mark generates a scatterplot.

```elm {v l}
scatter1 : Spec
scatter1 =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

        enc =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
    in
    toVegaLite [ data, enc [], point [] ]
```

---

## Colour and shape encoded scatterplot

We can additionally encode other variables with the colour and shape of each point on a scatterplot. Here we double-encode penguin species with both shape and colour.

```elm {v l}
scatter2 : Spec
scatter2 =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

        enc =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
                << color [ mName "Species" ]
                << shape [ mName "Species" ]
    in
    toVegaLite [ width 400, height 400, data, enc [], point [] ]
```

---

## Text-encoded scatterplot

Text can be used in place of a shape symbol to show categorical variables. Here a [transform](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#transform) is applied with [calculateAs](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs) to create a new data field comprising the first letter of each species, double-encoded with colour and symbolised as text with [textMark](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#textMark).

```elm {v l}
textScatter : Spec
textScatter =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

        trans =
            transform
                << calculateAs "datum.Species[0]" "initial"

        enc =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
                << color [ mName "Species" ]
                << text [ tName "initial" ]
    in
    toVegaLite [ width 400, height 400, data, trans [], enc [], textMark [] ]
```

---

## Bubble plot

Quantitative or ordinal data can be encoded with symbol size to give a so-called "bubble plot".

```elm {v l}
bubbleplot : Spec
bubbleplot =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

        enc =
            encoding
                << position X [ pName "Beak Length (mm)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
                << color [ mName "Species" ]
                << size [ mName "Body Mass (g)", mQuant, mScale [ scZero False ] ]
    in
    toVegaLite [ width 400, height 400, data, enc [], point [] ]
```

---

## Bubble plot with non-linear scale

Reflecting the influence of [Hans Rosling](https://www.gapminder.org/videos/the-joy-of-stats/) we can use non-linear scales in scatterplots. Here a bubble plot shows the correlation between health and income for 187 countries in the world. This is modified from an example in [One Chart, Twelve Charting Libraries](http://lisacharlotterost.github.io/2016/05/17/one-chart-code/) by Lisa Charlotte Rost.

The x-axis uses a log scale by setting its position scale to be [`scType`](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scType) [`scLog`](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#scLog).

```elm {v l}
logBubble : Spec
logBubble =
    let
        data =
            dataFromUrl (path ++ "gapminder-health-income.csv") []

        enc =
            encoding
                << position X [ pName "income", pQuant, pScale [ scType scLog ] ]
                << position Y [ pName "health", pQuant, pScale [ scZero False ] ]
                << size [ mName "population", mQuant ]
    in
    toVegaLite [ width 500, height 300, data, enc [], circle [ maColor "black" ] ]
```

---

## Binned bubble plot

By placing variables into bins, it can sometimes be easier to show patterns in the variable encoded with size. Here, movie ratings from [IMDB](https://www.imdb.com) and [Rotten Tomatoes](https://www.rottentomatoes.com) are compared with ratings placed in bins and symbols sized according to the number of reviews. Binned data are assumed to be _quantitative_ by default, so there is no need to specify the measurement type explicitly.

This shows ratings that differ greatly between the two sites tend to have fewer reviews, suggesting a [regression to the mean](https://en.wikipedia.org/wiki/Regression_toward_the_mean) effect.

Note also the use of the [circle](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#circle) rather than [point](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#point) mark, to specify a filled disc symbol.

```elm {v l}
binnedScatter : Spec
binnedScatter =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        enc =
            encoding
                << position X [ pName "IMDB Rating", pBin [ biMaxBins 10 ] ]
                << position Y [ pName "Rotten Tomatoes Rating", pBin [ biMaxBins 10 ] ]
                << size [ mAggregate opCount, mQuant ]
    in
    toVegaLite [ data, enc [], circle [] ]
```

---

## Scatterplot with categorical variable

Based on this [natural catastrophes chart](https://ourworldindata.org/natural-catastrophes), we can create a bubble/scatter plot where one of the variables is categorical (type of disaster). Double encoding disaster type with colour and position allows the magnitude to be encoded with size even when symbols partially overlap.

```elm {v l}
categoricalScatter : Spec
categoricalScatter =
    let
        data =
            dataFromUrl (path ++ "disasters.csv") []

        trans =
            -- Filter out the total from the categories shown
            transform
                << filter (fiExpr "datum.Entity !== 'All natural disasters'")

        enc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axTitle "", axGrid False ] ]
                << position Y [ pName "Entity", pTitle "" ]
                << size
                    [ mName "Deaths"
                    , mQuant
                    , mLegend [ leTitle "Annual Global Deaths", leClipHeight 30 ]
                    , mScale [ scRange (raMax 5000) ] -- Size of circles
                    ]
                << color [ mName "Entity", mLegend [] ]
    in
    toVegaLite
        [ width 600
        , height 400
        , data
        , trans []
        , enc []
        , circle [ maFillOpacity 0.8, maStroke "black", maStrokeOpacity 0.3, maStrokeWidth 1 ]
        ]
```

---

## Scatterplot with null values

Sometimes showing absent values explicitly can be useful. In this example, by encoding a circle of null values with a grey colour we see the distribution of both absent IMDB and Rotten Tomatoes values. Data that have missing values for both variables are shown in the bottom left corner, but note it is not possible to visually assess how many fall into this category.

By default, null values are not shown, so we explicitly include them with a [configuration](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#configuration) setting [`maRemoveInvalid False`](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#coRemoveInvalid). We use [mCondition](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#mCondition) to encode points with colour conditionally depending on whether ratings are null.

```elm {v l}
scatterWithNulls : Spec
scatterWithNulls =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        cfg =
            configure
                << configuration (coMark [ maRemoveInvalid False ])

        enc =
            encoding
                << position X [ pName "IMDB Rating", pQuant ]
                << position Y [ pName "Rotten Tomatoes Rating", pQuant ]
                << color
                    [ mCondition (prTest (expr "datum['IMDB Rating'] === null || datum['Rotten Tomatoes Rating'] === null"))
                        -- If either rating is null encode with grey
                        [ mStr "#ddd" ]
                        -- otherwise encode in blue
                        [ mStr "rgb(76,120,168)" ]
                    ]
    in
    toVegaLite [ width 400, height 400, cfg [], data, enc [], point [] ]
```

---

## Scatterplot with trend line

We can add a trend using _locally estimated scatterplot smoothing_ (loess) by calling the [loess transform](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#3-13-loess-trend-calculation). The [lsBandwidth](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#lsBandwidth) property determines how smooth the trend line should be.

```elm {v l}
scatterWithLoess : Spec
scatterWithLoess =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        trans =
            transform
                << loess "IMDB Rating" "Rotten Tomatoes Rating" [ lsBandwidth 0.1 ]

        enc =
            encoding
                << position X [ pName "Rotten Tomatoes Rating", pQuant ]
                << position Y [ pName "IMDB Rating", pQuant ]

        pointSpec =
            asSpec [ point [ maFilled True, maOpacity 0.3 ] ]

        trendSpec =
            asSpec [ trans [], line [ maColor "firebrick" ] ]
    in
    toVegaLite [ width 300, height 300, data, enc [], layer [ pointSpec, trendSpec ] ]
```

Alternatively we can fit a regression line through the points with the [regression transform](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#3-14-regression-calculation). In this example we fit a cubic polynomial regression line by setting the [rgOrder](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#rgOrder) to 3.

```elm {v l}
scatterWithPolynomial : Spec
scatterWithPolynomial =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        trans =
            transform
                << regression "IMDB Rating"
                    "Rotten Tomatoes Rating"
                    [ rgMethod rgPoly, rgOrder 3 ]

        enc =
            encoding
                << position X [ pName "Rotten Tomatoes Rating", pQuant ]
                << position Y [ pName "IMDB Rating", pQuant ]

        pointSpec =
            asSpec [ point [ maFilled True, maOpacity 0.3 ] ]

        regSpec =
            asSpec [ trans [], line [ maColor "firebrick" ] ]
    in
    toVegaLite [ width 300, height 300, data, enc [], layer [ pointSpec, regSpec ] ]
```
