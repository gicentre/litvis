---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Line charts

Examples that use data from external sources tend to use files from the Vega-Lite and giCentre data servers. For consistency the paths to these data locations are defined here:

```elm {l}
vegaPath : String
vegaPath =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"


giCentrePath : String
giCentrePath =
    "https://gicentre.github.io/data/"
```

## Simple time series

Line charts work well for showing how a quantitative variable changes over time. Here [filter](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#filter) is used to extract just the Google stock price from a more complex dataset.

```elm {v l}
singleLineChart : Spec
singleLineChart =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        trans =
            transform << filter (fiExpr "datum.symbol === 'GOOG'")

        enc =
            encoding
                << position X [ pName "date", pTemporal, pTitle "" ]
                << position Y [ pName "price", pQuant ]
    in
    toVegaLite [ width 400, data, trans [], enc [], line [] ]
```

---

## Line chart with point markers

Similar to the previous example, but with additional point markers at each data point. Point markers can be specified with [maPoint](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#maPoint) and customised with [pmMarker](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#pmMarker). This can be useful when distinguishing actual data values from interpolated (line) symbols.

```elm {v l}
lineChartWithMarkers : Spec
lineChartWithMarkers =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        trans =
            transform << filter (fiExpr "datum.symbol === 'GOOG'")

        enc =
            encoding
                << position X [ pName "date", pTemporal, pTitle "" ]
                << position Y [ pName "price", pQuant ]
    in
    toVegaLite [ width 400, data, trans [], enc [], line [ maPoint (pmMarker [ maColor "black" ]) ] ]
```

---

## Smoothed line chart

To de-emphasise data points and emphasise trend, a smoothed line interpolation may be applied between points using [mInterpolate](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#maInterpolate) and setting the interpolation type to [miMonotone](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#miMonotone).

```elm {v l}
smoothLine : Spec
smoothLine =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        trans =
            transform << filter (fiExpr "datum.symbol === 'GOOG'")

        enc =
            encoding
                << position X [ pName "date", pTemporal ]
                << position Y [ pName "price", pQuant ]
    in
    toVegaLite [ width 400, data, trans [], enc [], line [ maInterpolate miMonotone ] ]
```

---

## Trend line

To provide an even smoother trend, we can use the [loess](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#loess) transformation to calculate the locally smoothed relationship between two variables. Loess expects two quantitative variables, so we convert the date into a numeric value based on its year and 1/12th of its numeric month.

```elm {v l}
trendLine : Spec
trendLine =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        trans =
            transform
                << filter (fiExpr "datum.symbol === 'GOOG'")
                << calculateAs "year(datum.date) + month(datum.date)/12" "yrMonth"
                << loess "price" "yrMonth" []

        enc =
            encoding
                << position X [ pName "yrMonth", pQuant, pAxis [ axFormat "d", axTitle "" ] ]
                << position Y [ pName "price", pQuant ]
    in
    toVegaLite [ width 400, data, trans [], enc [], line [] ]
```

---

## Stepped line chart

If the value being shown with a line chart moves between discrete steps, line interpolation can be made to step between values with [miStepwise](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#miStepwise), [miStepAfter](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#miStepAfter) or [miStepBefore](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#miStepBefore).

```elm {v l}
steppedLine : Spec
steppedLine =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        trans =
            transform
                << filter (fiExpr "datum.symbol === 'GOOG'")

        enc =
            encoding
                << position X [ pName "date", pTemporal, pTitle "" ]
                << position Y [ pName "price", pQuant ]
    in
    toVegaLite [ width 400, data, trans [], enc [], line [ maInterpolate miStepAfter ] ]
```

---

## Coloured multi-line chart

We can show multiple lines on a chart by encoding categorical variable with colour. Here each company (unhelpfully called `symbol` in the stocks dataset) is encoded with colour, that has the effect generating a separate line for each set of stock price values associated with each company.

```elm {v l}
multiLines : Spec
multiLines =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        enc =
            encoding
                << position X [ pName "date", pTemporal, pTitle "" ]
                << position Y [ pName "price", pQuant ]
                << color [ mName "symbol", mTitle "Company" ]
    in
    toVegaLite [ width 400, data, enc [], line [] ]
```

---

## Multi-line chart

Sometimes you may wish to split a line chart by some variable (as the colour example above), but not allocate a different colour to each line. This can be achieved by encoding with a [detail](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#detail) channel rather than [color](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#color) channel.

In this example, we take a year's timestamps of Oxides of Nitrogen data (NOX) (air pollution) in Putney, London, and derive new data fields, with [calculateAs](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs), that extract hour of day and day of year. Splitting by day of year with the `detail` channel gives 365 lines, each covering 24 hours of data. Because there so many overlapping lines, the line opacity is set to 5% (with [maOpacity](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#maOpacity)) to provide a visual indication of line density.

```elm {v l}
airQualityLines : Spec
airQualityLines =
    let
        data =
            dataFromUrl (giCentrePath ++ "putneyAirQuality2018.csv") []

        trans =
            transform
                << calculateAs "hours(datum.DateTime) + (minutes(datum.DateTime)/60)"
                    "hourOfDay"
                << calculateAs "month(datum.DateTime) + (date(datum.DateTime) / 100)"
                    "dayOfYear"

        enc =
            encoding
                << position X [ pName "hourOfDay", pQuant ]
                << position Y [ pName "NOX", pQuant ]
                << detail [ dName "dayOfYear" ]
    in
    toVegaLite [ width 600, height 300, data, trans [], enc [], line [ maOpacity 0.05 ] ]
```

---

## Multi-trail chart

A 'trail' is like a line but its thickness can be used to encode a data field. The air quality example below is similar to that above except we use the [trail](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#trail) mark instead of [line](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#line) and control the width of the trail lines via the [size](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#size) channel. The effect is to give greater weighting to higher pollution levels.

```elm {v l}
airQualityTrails : Spec
airQualityTrails =
    let
        data =
            dataFromUrl (giCentrePath ++ "putneyAirQuality2018.csv") []

        trans =
            transform
                << calculateAs "hours(datum.DateTime) + (minutes(datum.DateTime)/60)" "hourOfDay"
                << calculateAs "month(datum.DateTime) + (date(datum.DateTime) / 100)" "dayOfYear"

        enc =
            encoding
                << position X [ pName "hourOfDay", pQuant ]
                << position Y [ pName "NOX", pQuant ]
                << detail [ dName "dayOfYear" ]
                << size [ mName "NOX", mQuant, mLegend [] ]
    in
    toVegaLite
        [ width 600, height 300, data, trans [], enc [], trail [ maOpacity 0.1 ] ]
```

---

## Connected Scatterplot

A [connected scatterplot](https://research.tableau.com/sites/default/files/Haroz-TVCG-2016.pdf) can be created by customizing line order and adding a point marker in the line mark definition. Connected scatterplots are useful when you wish to show how a relationship between two variables changes over time or some other continuous variable.

In this example, the mean UK household monthly income of the poorest and richest 5% after housing costs is compared joining points in sequence from 1961 (bottom left) to 2018 (top right). It shows how income inequality has increased over time, in the 1980s and since the 2008 financial crisis.

_Data from the [Institute for Fiscal Studies](https://www.ifs.org.uk/tools_and_resources/incomes_in_uk)_

```elm {v l}
connectedScatter : Spec
connectedScatter =
    let
        data =
            dataFromUrl (giCentrePath ++ "incomeInequality2018.csv") []

        enc =
            encoding
                << position X [ pName "5pcIncome", pQuant, pScale [ scZero True ] ]
                << position Y [ pName "95pcIncome", pQuant, pScale [ scZero True ] ]
                << order [ oName "Year" ]
    in
    toVegaLite
        [ width 400
        , height 400
        , data
        , enc []
        , line
            [ maPoint (pmMarker [ maFilled False, maStrokeWidth 1 ])
            , maInterpolate miMonotone
            ]
        ]
```

---

## Slope Charts

Slope graphs, proposed by [Edward Tufte](https://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0003nk) allow comparison of pairs of values in a list, typically over time. In this example, changes in median crop yields between 1931 and 1932 are compared for different farming sites, highlighting the erroneous value of "Morris" in 1931.

```elm {v l}
slopeChart : Spec
slopeChart =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromUrl (vegaPath ++ "barley.json") []

        enc =
            encoding
                << position X
                    [ pName "year"
                    , pScale [ scPadding 0.1 ]
                    , pAxis [ axTitle "", axDomain False, axLabelAngle 0 ]
                    ]
                << position Y
                    [ pName "yield"
                    , pAggregate opMedian
                    , pAxis [ axGrid False ]
                    ]
                << color [ mName "site", mNominal ]
    in
    toVegaLite [ width 200, cfg [], data, enc [], line [] ]
```

---

## Invalid Values

Line chart with markers and invalid (null) values. Here invalid points are generated explicitly with a [calculateAs](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs) transform.

```elm {v l}
invalidExample : Spec
invalidExample =
    let
        data =
            dataFromColumns []
                << dataColumn "x" (nums [ 1, 2, 3, 4, 5, 6, 7 ])
                << dataColumn "y" (nums [ 10, 30, -99, 15, -99, 40, 20 ])

        trans =
            transform
                << calculateAs "if(datum.y == -99,null,datum.y)" "yPrime"

        enc =
            encoding
                << position X [ pName "x", pQuant ]
                << position Y [ pName "yPrime", pQuant ]
    in
    toVegaLite [ data [], trans [], enc [], line [ maPoint (pmMarker []) ] ]
```
