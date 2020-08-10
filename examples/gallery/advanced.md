---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Advanced Calculations

These examples perform calculations on data fields _within a VegaLite specification_. This is an alternative approach for cases where you do not wish (or are not able) to perform calculations externally or via Elm. Most use the [window](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#window) operator, that allows calculations to be made sequentially over all values in data field.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Converting absolute numbers into rates

The [window](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#window) operator is used to find the total of all time counts and then express each individual time count as a proportion of that total.

```elm {v l}
absToRates : Spec
absToRates =
    let
        data =
            dataFromColumns []
                << dataColumn "Activity" (strs [ "Sleeping", "Eating", "TV", "Work", "Exercise" ])
                << dataColumn "Time" (nums [ 8, 2, 4, 8, 2 ])

        trans =
            transform
                << window
                    [ ( [ wiAggregateOp opSum, wiField "Time" ], "TotalTime" ) ]
                    [ wiFrame Nothing Nothing ]
                << calculateAs "datum.Time/datum.TotalTime * 100" "PercentOfTotal"

        enc =
            encoding
                << position X [ pName "PercentOfTotal", pQuant, pTitle "% of total time" ]
                << position Y [ pName "Activity" ]
    in
    toVegaLite [ data [], trans [], enc [], bar [] ]
```

---

## Difference from average

A similar approach to the previous example but this time calculating the difference between each value (IMDB rating) from the average score and using a filter to show only those films that score at least 2.5 above the calculated average.

_Note that because the field names in `movies.json` can include spaces (for example, `IMDB Rating`), we have to use JavaScript's longhand notation for referencing datum values (for example, `datum['IMDB Rating']` rather than `datum.IMDB Rating`)._

```elm {v l}
aboveAve : Spec
aboveAve =
    let
        data =
            dataFromUrl (path ++ "movies.json")

        trans =
            transform
                << filter (fiExpr "datum['IMDB Rating'] != null")
                << window [ ( [ wiAggregateOp opMean, wiField "IMDB Rating" ], "AverageRating" ) ]
                    [ wiFrame Nothing Nothing ]
                << filter (fiExpr "(datum['IMDB Rating'] - datum.AverageRating) > 2.5")

        barEnc =
            encoding
                << position X [ pName "IMDB Rating", pQuant, pTitle "IMDB rating" ]
                << position Y [ pName "Title", pTitle "" ]

        barSpec =
            asSpec [ barEnc [], bar [] ]

        ruleEnc =
            encoding
                << position X [ pName "AverageRating", pAggregate opMean ]

        ruleSpec =
            asSpec [ ruleEnc [], rule [ maColor "white" ] ]
    in
    toVegaLite
        [ data [], trans [], layer [ barSpec, ruleSpec ] ]
```

---

## Difference from grouped average

This is similar to the previous example, except that the average score (calculated via the [window](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#window) function) is grouped by year of a film's release.

```elm {v l}
aboveGroupedAve : Spec
aboveGroupedAve =
    let
        data =
            dataFromUrl (path ++ "movies.json") [ parse [ ( "Release Date", foDate "%d-%b-%y" ) ] ]

        trans =
            transform
                << filter (fiExpr "datum['IMDB Rating'] != null")
                << timeUnitAs year "Release Date" "year"
                << window [ ( [ wiAggregateOp opMean, wiField "IMDB Rating" ], "AverageYearRating" ) ]
                    [ wiGroupBy [ "year" ], wiFrame Nothing Nothing ]
                << filter (fiExpr "(datum['IMDB Rating'] - datum.AverageYearRating) > 2.5")

        barEnc =
            encoding
                << position X [ pName "IMDB Rating", pQuant, pTitle "IMDB rating" ]
                << position Y [ pName "Title", pOrdinal, pTitle "" ]

        barSpec =
            asSpec [ bar [], barEnc [] ]

        tickEnc =
            encoding
                << position X [ pName "AverageYearRating", pQuant ]
                << position Y [ pName "Title", pOrdinal ]

        tickSpec =
            asSpec [ tickEnc [], tick [ maColor "white" ] ]
    in
    toVegaLite [ data, trans [], layer [ barSpec, tickSpec ] ]
```

---

## Residual plot over time

Shows the difference between a film's IMDB rating and the average for all rated films between 1975 and 2015. Tooltips are used to identify the titles of individual films.

```elm {v l interactive}
residuals : Spec
residuals =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        trans =
            transform
                << filter (fiExpr "isValid(datum['IMDB Rating'])")
                << filter (fiRange "Release Date" (dtRange [ dtYear 1975 ] [ dtYear 2015 ]))
                << window [ ( [ wiAggregateOp opMean, wiField "IMDB Rating" ], "AverageRating" ) ]
                    [ wiFrame Nothing Nothing ]
                << calculateAs "datum['IMDB Rating'] - datum.AverageRating" "RatingDelta"

        enc =
            encoding
                << position X [ pName "Release Date", pTemporal, pTitle "" ]
                << position Y [ pName "RatingDelta", pQuant, pTitle "Residual" ]
                << color
                    [ mName "RatingDelta"
                    , mScale [ scScheme "redyellowblue" [ 0, 0.82 ] ]
                    , mLegend []
                    ]
                << tooltip [ tName "Title" ]
    in
    toVegaLite [ width 500, data, trans [], enc [], point [ maStrokeWidth 1 ] ]
```

---

## Change in rank over time

Ranks are calculated with the [window](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#window) function rather than stored in the data table. World Cup 2018, Group F teams.

```elm {v l}
ranks : Spec
ranks =
    let
        data =
            dataFromColumns []
                << dataColumn "team" (strs [ "Germany", "Mexico", "South Korea", "Sweden", "Germany", "Mexico", "South Korea", "Sweden", "Germany", "Mexico", "South Korea", "Sweden" ])
                << dataColumn "matchday" (nums [ 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3 ])
                << dataColumn "point" (nums [ 0, 3, 0, 3, 3, 6, 0, 3, 3, 6, 3, 6 ])
                << dataColumn "diff" (nums [ -1, 1, -1, 1, 0, 2, -2, 0, -2, -1, 0, 3 ])

        trans =
            transform
                << window [ ( [ wiOp woRank ], "rank" ) ]
                    [ wiSort [ wiDescending "point", wiDescending "diff" ], wiGroupBy [ "matchday" ] ]

        enc =
            encoding
                << position X [ pName "matchday", pAxis [ axLabelAngle 0 ] ]
                << position Y [ pName "rank" ]
                << color [ mName "team", mScale teamColours ]

        teamColours =
            categoricalDomainMap
                [ ( "Germany", "black" )
                , ( "Mexico", "#127153" )
                , ( "South Korea", "#c91a3c" )
                , ( "Sweden", "#0c71ab" )
                ]
    in
    toVegaLite [ width 100, height 120, data [], trans [], enc [], line [ maOrient moVertical ] ]
```

---

## Waterfall Chart

Shows monthly profit and loss over time. Calculates the difference between adjacent values using the window operation [woLead](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#woLead).

```elm {v l}
waterfall : Spec
waterfall =
    let
        data =
            dataFromColumns []
                << dataColumn "label" (strs [ "Begin", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "End" ])
                << dataColumn "amount" (nums [ 4000, 1707, -1425, -1030, 1812, -1067, -1481, 1228, 1176, 1146, 1205, -1388, 1492, 0 ])

        trans =
            transform
                << window [ ( [ wiAggregateOp opSum, wiField "amount" ], "sum" ) ] []
                << window [ ( [ wiOp woLead, wiField "label" ], "lead" ) ] []
                << calculateAs "datum.lead === null ? datum.label : datum.lead" "lead"
                << calculateAs "datum.label === 'End' ? 0 : datum.sum - datum.amount" "previous_sum"
                << calculateAs "datum.label === 'End' ? datum.sum : datum.amount" "amount"
                << calculateAs "(datum.label !== 'Begin' && datum.label !== 'End' && datum.amount > 0 ? '+' : '') + datum.amount" "text_amount"
                << calculateAs "(datum.sum + datum.previous_sum) / 2" "center"
                << calculateAs "datum.sum < datum.previous_sum ? datum.sum : ''" "sum_dec"
                << calculateAs "datum.sum > datum.previous_sum ? datum.sum : ''" "sum_inc"

        enc =
            encoding
                << position X
                    [ pName "label"
                    , pSort []
                    , pAxis [ axLabelAngle 0, axTitle "" ]
                    ]

        enc1 =
            encoding
                << position Y [ pName "previous_sum", pQuant, pTitle "Amount" ]
                << position Y2 [ pName "sum" ]
                << color
                    [ mDataCondition
                        [ ( expr "datum.label === 'Begin' || datum.label === 'End'", [ mStr "#f7e0b6" ] )
                        , ( expr "datum.sum < datum.previous_sum", [ mStr "#f78a64" ] )
                        ]
                        [ mStr "#93c4aa" ]
                    ]

        spec1 =
            asSpec [ enc1 [], bar [ maSize 45 ] ]

        enc2 =
            encoding
                << position X2 [ pName "lead" ]
                << position Y [ pName "sum", pQuant ]

        spec2 =
            asSpec
                [ enc2 []
                , rule [ maColor "#404040", maOpacity 1, maStrokeWidth 2, maXOffset -22.5, maX2Offset 22.5 ]
                ]

        enc3 =
            encoding
                << position Y [ pName "sum_inc", pQuant ]
                << text [ tName "sum_inc" ]

        spec3 =
            asSpec
                [ enc3 [], textMark [ maDy -8, maFontWeight Bold, maColor "#404040" ] ]

        enc4 =
            encoding
                << position Y [ pName "sum_dec", pQuant ]
                << text [ tName "sum_dec" ]

        spec4 =
            asSpec
                [ enc4 []
                , textMark [ maDy 8, maBaseline vaTop, maFontWeight Bold, maColor "#404040" ]
                ]

        enc5 =
            encoding
                << position Y [ pName "center", pQuant ]
                << text [ tName "text_amount" ]
                << color
                    [ mDataCondition
                        [ ( expr "datum.label === 'Begin' || datum.label === 'End'", [ mStr "#725a30" ] ) ]
                        [ mStr "white" ]
                    ]

        spec5 =
            asSpec [ enc5 [], textMark [ maBaseline vaMiddle, maFontWeight Bold ] ]
    in
    toVegaLite
        [ width 800
        , height 450
        , data []
        , trans []
        , enc []
        , layer [ spec1, spec2, spec3, spec4, spec5 ]
        ]
```

---

## Linking Data Tables

Performing a 'left join' between a primary data table (`lookup_groups.csv`) and a secondary table (`lookup_people`).

```elm {v l highlight=12}
tableJoinExample : Spec
tableJoinExample =
    let
        primaryData =
            dataFromUrl (path ++ "lookup_groups.csv") []

        secondaryData =
            dataFromUrl (path ++ "lookup_people.csv") []

        trans =
            transform
                << lookup "person" secondaryData "name" (luFields [ "age" ])

        enc =
            encoding
                << position X [ pName "group", pOrdinal ]
                << position Y [ pName "age", pAggregate opMean ]
    in
    toVegaLite [ primaryData, trans [], enc [], bar [] ]
```

---

## Parallel Coordinates Plot

Penguin morphology.

Data are scaled to a common [0-1] range using [joinAggregate](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#joinAggregate) and [calculateAs](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#calculateAs) transform functions. Axes are drawn manually as layers containing rules and text labels.

```elm {v l}
parallelCoords : Spec
parallelCoords =
    let
        desc =
            description "Parallel coordinates plot with manual generation of parallel axes"

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
                << configuration (coAxis [ axcoDomain False, axcoLabelAngle 0, axcoTickColor "#ccc" ] |> coAxisXFilter)
                << configuration
                    (coMarkStyles
                        [ ( "label", [ maBaseline vaMiddle, maAlign haRight, maDx -5, maTooltip ttNone ] )
                        , ( "tick", [ maOrient moHorizontal, maTooltip ttNone ] )
                        ]
                    )

        data =
            dataFromUrl (path ++ "penguins.json") []

        trans =
            transform
                << filter (fiExpr "datum['Beak Length (mm)']")
                << window [ ( [ wiAggregateOp opCount ], "index" ) ] []
                << fold [ "Beak Length (mm)", "Beak Depth (mm)", "Flipper Length (mm)", "Body Mass (g)" ]
                << joinAggregate [ opAs opMin "value" "min", opAs opMax "value" "max" ] [ wiGroupBy [ "key" ] ]
                << calculateAs "(datum.value - datum.min) / (datum.max-datum.min)" "normVal"
                << calculateAs "(datum.min + datum.max) / 2" "mid"

        encLine =
            encoding
                << position X [ pName "key" ]
                << position Y [ pName "normVal", pQuant, pAxis [] ]
                << color [ mName "Species", mTitle "" ]
                << detail [ dName "index" ]
                << tooltips
                    [ [ tName "Beak Length (mm)", tQuant ]
                    , [ tName "Beak Depth (mm)", tQuant ]
                    , [ tName "Flipper Length (mm)", tQuant ]
                    , [ tName "Body Mass (g)", tQuant ]
                    ]

        specLine =
            asSpec [ encLine [], line [ maOpacity 0.3 ] ]

        encAxis =
            encoding
                << position X [ pName "key", pTitle "" ]
                << detail [ dAggregate opCount ]

        specAxis =
            asSpec [ encAxis [], rule [ maColor "#ccc" ] ]

        encAxisLabelsTop =
            encoding
                << position X [ pName "key" ]
                << position Y [ pNum 0 ]
                << text [ tName "max", tAggregate opMax ]

        specAxisLabelsTop =
            asSpec [ encAxisLabelsTop [], textMark [ maStyle [ "label" ] ] ]

        encAxisLabelsMid =
            encoding
                << position X [ pName "key" ]
                << position Y [ pNum 150 ]
                << text [ tName "mid", tAggregate opMin ]

        specAxisLabelsMid =
            asSpec [ encAxisLabelsMid [], textMark [ maStyle [ "label" ] ] ]

        encAxisLabelsBot =
            encoding
                << position X [ pName "key" ]
                << position Y [ pHeight ]
                << text [ tName "min", tAggregate opMin ]

        specAxisLabelsBot =
            asSpec [ encAxisLabelsBot [], textMark [ maStyle [ "label" ] ] ]
    in
    toVegaLite
        [ desc
        , cfg []
        , width 600
        , height 300
        , data
        , trans []
        , layer [ specAxis, specLine, specAxisLabelsTop, specAxisLabelsMid, specAxisLabelsBot ]
        ]
```

---

## Mosaic Plot

A mosaic plot is a series of stacked bar charts where the width of each bar also encodes a value. These can be used to compare both proportions (relative proportion of a bar occupied by a coloured rectangle in a stack) and absolute values (total area of each coloured rectangle).

```elm {v l}
mosaic : Spec
mosaic =
    let
        cars =
            dataFromUrl (path ++ "cars.json") []

        trans =
            transform
                << aggregate [ opAs opCount "" "count_*" ] [ "Origin", "Cylinders" ]
                << stack "count_*"
                    []
                    "stack_count_Origin1"
                    "stack_count_Origin2"
                    [ stOffset stNormalize, stSort [ stAscending "Origin" ] ]
                << window
                    [ ( [ wiAggregateOp opMin, wiField "stack_count_Origin1" ], "x" )
                    , ( [ wiAggregateOp opMax, wiField "stack_count_Origin2" ], "x2" )
                    , ( [ wiOp woDenseRank ], "rank_Cylinders" )
                    , ( [ wiAggregateOp opDistinct, wiField "Cylinders" ], "distinct_Cylinders" )
                    ]
                    [ wiFrame Nothing Nothing, wiGroupBy [ "Origin" ], wiSort [ wiAscending "Cylinders" ] ]
                << window
                    [ ( [ wiOp woDenseRank ], "rank_Origin" ) ]
                    [ wiFrame Nothing Nothing, wiSort [ wiAscending "Origin" ] ]
                << stack "count_*"
                    [ "Origin" ]
                    "y"
                    "y2"
                    [ stOffset stNormalize, stSort [ stAscending "Cylinders" ] ]
                << calculateAs "datum.y + (datum.rank_Cylinders - 1) * datum.distinct_Cylinders * 0.01 / 3" "ny"
                << calculateAs "datum.y2 + (datum.rank_Cylinders - 1) * datum.distinct_Cylinders * 0.01 / 3" "ny2"
                << calculateAs "datum.x + (datum.rank_Origin - 1) * 0.01" "nx"
                << calculateAs "datum.x2 + (datum.rank_Origin - 1) * 0.01" "nx2"
                << calculateAs "(datum.nx+datum.nx2)/2" "xc"
                << calculateAs "(datum.ny+datum.ny2)/2" "yc"

        enc1 =
            encoding
                << position X
                    [ pName "xc"
                    , pAggregate opMin
                    , pTitle "Origin"
                    , pAxis [ axOrient siTop ]
                    ]
                << color [ mName "Origin", mLegend [] ]
                << text [ tName "Origin" ]

        spec1 =
            asSpec [ textMark [ maBaseline vaMiddle, maAlign haCenter ], enc1 [] ]

        enc2 =
            encoding
                << position X [ pName "nx", pQuant, pAxis [] ]
                << position X2 [ pName "nx2" ]
                << position Y [ pName "ny", pQuant, pAxis [] ]
                << position Y2 [ pName "ny2" ]
                << color [ mName "Origin", mLegend [] ]
                << opacity [ mName "Cylinders", mQuant, mLegend [] ]
                << tooltips
                    [ [ tName "Origin" ]
                    , [ tName "Cylinders", tQuant ]
                    ]

        spec2 =
            asSpec [ rect [], enc2 [] ]

        enc3 =
            encoding
                << position X [ pName "xc", pQuant, pAxis [] ]
                << position Y [ pName "yc", pQuant, pTitle "Cylinders" ]
                << text [ tName "Cylinders" ]

        spec3 =
            asSpec [ textMark [ maBaseline vaMiddle ], enc3 [] ]

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
                << configuration
                    (coAxis
                        [ axcoDomain False
                        , axcoTicks False
                        , axcoLabels False
                        , axcoGrid False
                        ]
                    )

        res =
            resolve
                << resolution (reScale [ ( chX, reShared ) ])
    in
    toVegaLite
        [ cfg []
        , res []
        , cars
        , trans []
        , vConcat [ spec1, asSpec [ layer [ spec2, spec3 ] ] ]
        ]
```
