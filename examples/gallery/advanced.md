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
        [ cfg []
        , width 600
        , height 300
        , data
        , trans []
        , layer [ specAxis, specLine, specAxisLabelsTop, specAxisLabelsMid, specAxisLabelsBot ]
        ]
```

---

## Raw and Aggregate Values

Raw values are shown as circles, then aggregatede by year in order to create a trend line.

```elm {v l}
advanced16 : Spec
advanced16 =
    let
        data =
            dataFromUrl (path ++ "stocks.csv") []

        trans =
            transform << filter (fiExpr "datum.symbol === 'GOOG'")

        encRaw =
            encoding
                << position X [ pName "date", pTimeUnit year, pTitle "" ]
                << position Y [ pName "price", pQuant, pTitle "Price" ]

        specRaw =
            asSpec [ encRaw [], point [ maOpacity 0.3 ] ]

        encAv =
            encoding
                << position X [ pName "date", pTimeUnit year ]
                << position Y [ pName "price", pAggregate opMean ]

        specAv =
            asSpec [ encAv [], line [] ]
    in
    toVegaLite [ data, trans [], layer [ specRaw, specAv ] ]
```

---

## Rolling Average

As an alternative to the [loess transform](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#loess) we can use the window transform to calculate a rolling average and superimpose it on top of raw values.

```elm {v l}
rollingAverage : Spec
rollingAverage =
    let
        data =
            dataFromUrl (path ++ "seattle-weather.csv") []

        trans =
            transform
                << window [ ( [ wiAggregateOp opMean, wiField "temp_max" ], "rollingMean" ) ]
                    [ wiFrame (Just -15) (Just 15) ]

        encRaw =
            encoding
                << position X [ pName "date", pTitle "Date", pTemporal, pTitle "" ]
                << position Y [ pName "temp_max", pTitle "Maximum temperature", pQuant ]

        specRaw =
            asSpec [ encRaw [], point [ maOpacity 0.3 ] ]

        encAv =
            encoding
                << position X [ pName "date", pTemporal ]
                << position Y [ pName "rollingMean", pQuant ]

        specAv =
            asSpec [ encAv [], line [ maColor "red", maSize 3 ] ]
    in
    toVegaLite [ width 400, height 300, data, trans [], layer [ specRaw, specAv ] ]
```

---

## Benchmark Line Chart

Uses the window transform to calcualte frames per second values.

```elm {v l}
framesPerSecond : Spec
framesPerSecond =
    let
        falconData =
            Json.Encode.list Json.Encode.float [ 16.81999969482422, 19.759998321533203, 16.079999923706055, 19.579999923706055, 16.420000076293945, 16.200000762939453, 16.020000457763672, 15.9399995803833, 16.280000686645508, 16.119998931884766, 16.15999984741211, 16.119998931884766, 16.139999389648438, 16.100000381469727, 16.200000762939453, 16.260000228881836, 19.35999870300293, 19.700000762939453, 15.9399995803833, 19.139999389648438, 16.200000762939453, 16.119998931884766, 19.520000457763672, 19.700000762939453, 16.200000762939453, 20.979999542236328, 16.299999237060547, 16.420000076293945, 16.81999969482422, 16.5, 16.560001373291016, 16.18000030517578, 16.079999923706055, 16.239999771118164, 16.040000915527344, 16.299999237060547, 19.399999618530273, 15.699999809265137, 16.239999771118164, 15.920000076293945, 16.259998321533203, 16.219999313354492, 16.520000457763672, 16.459999084472656, 16.360000610351563, 15.719999313354492, 16.060001373291016, 15.960000991821289, 16.479999542236328, 16.600000381469727, 16.240001678466797, 16.940000534057617, 16.220001220703125, 15.959999084472656, 15.899999618530273, 16.479999542236328, 16.31999969482422, 15.75999927520752, 15.999998092651367, 16.18000030517578, 16.219999313354492, 15.800000190734863, 16.139999389648438, 16.299999237060547, 16.360000610351563, 16.260000228881836, 15.959999084472656, 15.9399995803833, 16.53999900817871, 16.139999389648438, 16.259998321533203, 16.200000762939453, 15.899999618530273, 16.079999923706055, 16.079999923706055, 15.699999809265137, 15.660000801086426, 16.139999389648438, 23.100000381469727, 16.600000381469727, 16.420000076293945, 16.020000457763672, 15.619999885559082, 16.35999870300293, 15.719999313354492, 15.920001029968262, 15.5600004196167, 16.34000015258789, 22.82000160217285, 15.660000801086426, 15.5600004196167, 16, 16, 15.819999694824219, 16.399999618530273, 16.46000099182129, 16.059999465942383, 16.239999771118164, 15.800000190734863, 16.15999984741211, 16.360000610351563, 19.700000762939453, 16.10000228881836, 16.139999389648438, 15.819999694824219, 16.439998626708984, 16.139999389648438, 16.020000457763672, 15.860000610351563, 16.059999465942383, 16.020000457763672, 15.920000076293945, 15.819999694824219, 16.579999923706055, 15.880000114440918, 16.579999923706055, 15.699999809265137, 19.380001068115234, 19.239999771118164, 16, 15.980000495910645, 15.959999084472656, 16.200000762939453, 15.980000495910645, 16.34000015258789, 16.31999969482422, 16.260000228881836, 15.920000076293945, 15.540000915527344, 16.139999389648438, 16.459999084472656, 16.34000015258789, 15.819999694824219, 19.719999313354492, 15.75999927520752, 16.499998092651367, 15.719999313354492, 16.079999923706055, 16.439998626708984, 16.200000762939453, 15.959999084472656, 16, 16.100000381469727, 19.31999969482422, 16.100000381469727, 16.18000030517578, 15.959999084472656, 22.639999389648438, 15.899999618530273, 16.279998779296875, 16.100000381469727, 15.920000076293945, 16.079999923706055, 16.260000228881836, 15.899999618530273, 15.820001602172852, 15.699999809265137, 15.979998588562012, 16.380001068115234, 16.040000915527344, 19.420000076293945, 15.9399995803833, 16.15999984741211, 15.960000991821289, 16.259998321533203, 15.780000686645508, 15.880000114440918, 15.980000495910645, 16.060001373291016, 16.119998931884766, 23.020000457763672, 15.619999885559082, 15.920000076293945, 16.060001373291016, 14.780000686645508, 16.260000228881836, 19.520000457763672, 16.31999969482422, 16.600000381469727, 16.219999313354492, 19.740001678466797, 19.46000099182129, 15.940000534057617, 15.839999198913574, 16.100000381469727, 16.46000099182129, 16.17999839782715, 16.100000381469727, 15.9399995803833, 16.060001373291016, 15.860000610351563, 15.819999694824219, 16.03999900817871, 16.17999839782715, 15.819999694824219, 17.299999237060547, 15.9399995803833, 15.739999771118164, 15.719999313354492, 15.679998397827148, 15.619999885559082, 15.600000381469727, 16.03999900817871, 15.5, 15.600001335144043, 19.439998626708984, 15.960000991821289, 16.239999771118164, 16.040000915527344, 16.239999771118164 ]

        squareData =
            Json.Encode.list Json.Encode.float [ 24.200000762939453, 17.899999618530273, 15.800000190734863, 58.400001525878906, 151, 2523.10009765625, 245.3000030517578, 136, 72.30000305175781, 55.70000076293945, 42.400001525878906, 37.70000076293945, 30.100000381469727, 30.100000381469727, 21.799999237060547, 20.600000381469727, 21.799999237060547, 17.600000381469727, 18.200000762939453, 21, 941.7000122070313, 177.39999389648438, 2821.800048828125, 359.20001220703125, 318, 217.10000610351563, 126, 69, 57.79999923706055, 45.29999923706055, 35.599998474121094, 29.100000381469727, 23.799999237060547, 44.20000076293945, 17.700000762939453, 17.700000762939453, 15.699999809265137, 27.799999237060547, 22.799999237060547, 3853.60009765625, 91.5999984741211, 181.39999389648438, 476.29998779296875, 265.8999938964844, 254.60000610351563, 2583.199951171875, 124.80000305175781, 73.19999694824219, 56.400001525878906, 48.70000076293945, 41.599998474121094, 21.100000381469727, 20.299999237060547, 21.299999237060547, 18.299999237060547, 17.100000381469727, 19.5, 828.2000122070313, 162.1999969482422, 217.89999389648438, 205.5, 197.60000610351563, 2249.800048828125, 103.0999984741211, 71.69999694824219, 57.599998474121094, 41.400001525878906, 34.5, 22, 20.5, 21.700000762939453, 18.299999237060547, 17.299999237060547, 19.399999618530273, 666.7999877929688, 214.89999389648438, 212.3000030517578, 125.80000305175781, 67.69999694824219, 56.099998474121094, 45.79999923706055, 38.29999923706055, 33, 35.400001525878906, 22.700000762939453, 19.399999618530273, 19.899999618530273, 24.100000381469727, 19.299999237060547, 21.299999237060547, 3508.699951171875, 204.10000610351563, 125.4000015258789, 65.30000305175781, 60.79999923706055, 44.099998474121094, 36.29999923706055, 30.5, 28.600000381469727, 16.5, 18.600000381469727, 23.700000762939453, 22.299999237060547, 17.600000381469727, 19.200000762939453, 448.79998779296875, 124.4000015258789, 66.5999984741211, 53.5, 51, 45.20000076293945, 28.399999618530273, 29.200000762939453, 26.700000762939453, 25.899999618530273, 18.100000381469727, 17.600000381469727, 20.100000381469727, 25.200000762939453, 3332, 67.5, 53.599998474121094, 56.599998474121094, 39.900001525878906, 27.600000381469727, 29.600000381469727, 33.5, 17.200000762939453, 18.799999237060547, 25.200000762939453, 16.700000762939453, 16.899999618530273, 240.1999969482422, 52.400001525878906, 42.099998474121094, 33.900001525878906, 28, 28.600000381469727, 17.299999237060547, 20, 21, 22.799999237060547, 16.700000762939453, 19.200000762939453, 175.39999389648438, 43.5, 34.70000076293945, 29.700000762939453, 34.900001525878906, 25.799999237060547, 17.299999237060547, 22.600000381469727, 17.600000381469727, 17.200000762939453, 19.200000762939453, 111.80000305175781, 35.400001525878906, 27.600000381469727, 25.399999618530273, 21.899999618530273, 18.600000381469727, 18.100000381469727, 21.200000762939453, 17.899999618530273, 17, 80.5999984741211, 29.799999237060547, 30.100000381469727, 16, 26.799999237060547, 17.5, 22.299999237060547, 16.799999237060547, 22.399999618530273, 77.4000015258789, 31, 29.700000762939453, 28.700000762939453, 26, 16.899999618530273, 15.800000190734863, 19, 52.599998474121094, 25.200000762939453, 16.700000762939453, 17.899999618530273, 21, 19.799999237060547, 18.799999237060547, 46.5, 17.5, 16.799999237060547, 18.299999237060547, 18.299999237060547, 14.899999618530273, 41, 18.299999237060547, 17.299999237060547, 17, 17.5, 32.29999923706055, 22.600000381469727, 16.600000381469727, 17.899999618530273, 25.600000381469727, 17.5, 20.299999237060547, 25.200000762939453, 18.600000381469727, 17.700000762939453 ]

        transSquare =
            transform
                << window [ ( [ wiOp woRowNumber ], "row" ) ] []
                << calculateAs "1000/datum.data" "fps"
                << calculateAs "'Square Crossfilter (3M)'" "system"

        transFalcon =
            transform
                << window [ ( [ wiOp woRowNumber ], "row" ) ] []
                << calculateAs "1000/datum.data" "fps"
                << calculateAs "'Falcon'" "system"

        enc =
            encoding
                << position X [ pName "row", pQuant, pAxis [ axGrid False, axTitle "Trial" ], pScale [ scNice niFalse ] ]
                << position Y [ pName "fps", pAxis [ axGrid False, axTitle "Frames per Second (fps)" ], pScale [ scType scLog ] ]
                << color [ mName "system", mLegend [ leOrient loBottomRight, leTitle "System" ] ]
                << size [ mNum 1 ]

        specFalcon =
            asSpec [ dataFromSource "falcon" [], transFalcon [], line [] ]

        specSquare =
            asSpec [ dataFromSource "square" [], transSquare [], line [] ]
    in
    toVegaLite
        [ width 400
        , height 200
        , datasets [ ( "falcon", dataFromJson falconData [] ), ( "square", dataFromJson squareData [] ) ]
        , enc []
        , layer [ specFalcon, specSquare ]
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
