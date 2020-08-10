---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Layered charts

Charts that use layers to build up more complex visualizations.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Candlestick chart

Like box and whisker plots, so-called "candlestick charts" can show four related values as a single glyph. The box and whisker glyphs are created by overlaying two layers – one for the whiskers using a [rule](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#rule) mark and the other for the boxes using the [bar](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#bar) mark.

This example inspired by the one [originally specified with Protovis](http://mbostock.github.io/protovis/ex/candlestick.html) shows daily June summaries of a stock price with colour indicating whether the stock gained (blue) or lost (orange) price during each day.

```elm {v l}
candlestick : Spec
candlestick =
    let
        table =
            """date,open,high,low,close
                01-Jun-2009,28.70,30.05,28.45,30.04
                02-Jun-2009,30.04,30.13,28.30,29.63
                03-Jun-2009,29.62,31.79,29.62,31.02
                04-Jun-2009,31.02,31.02,29.92,30.18
                05-Jun-2009,29.39,30.81,28.85,29.62
                08-Jun-2009,30.84,31.82,26.41,29.77
                09-Jun-2009,29.77,29.77,27.79,28.27
                10-Jun-2009,26.90,29.74,26.90,28.46
                11-Jun-2009,27.36,28.11,26.81,28.11
                12-Jun-2009,28.08,28.50,27.73,28.15
                15-Jun-2009,29.70,31.09,29.64,30.81
                16-Jun-2009,30.81,32.75,30.07,32.68
                17-Jun-2009,31.19,32.77,30.64,31.54
                18-Jun-2009,31.54,31.54,29.60,30.03
                19-Jun-2009,29.16,29.32,27.56,27.99
                22-Jun-2009,30.40,32.05,30.30,31.17
                23-Jun-2009,31.30,31.54,27.83,30.58
                24-Jun-2009,30.58,30.58,28.79,29.05
                25-Jun-2009,29.45,29.56,26.30,26.36
                26-Jun-2009,27.09,27.22,25.76,25.93
                29-Jun-2009,25.93,27.18,25.29,25.35
                30-Jun-2009,25.36,27.38,25.02,26.35"""
                |> fromCSV

        data =
            dataFromColumns []
                << dataColumn "date" (strColumn "date" table |> strs)
                << dataColumn "open" (numColumn "open" table |> nums)
                << dataColumn "high" (numColumn "high" table |> nums)
                << dataColumn "low" (numColumn "low" table |> nums)
                << dataColumn "close" (numColumn "close" table |> nums)

        enc =
            encoding
                << position X [ pName "date", pTemporal, pTitle "" ]
                << color
                    [ mDataCondition
                        [ ( expr "datum.open < datum.close", [ mStr "orange" ] ) ]
                        [ mStr "steelBlue" ]
                    ]

        encRule =
            encoding
                << position Y [ pName "low", pQuant, pScale [ scZero False ] ]
                << position Y2 [ pName "high" ]

        specRule =
            asSpec [ encRule [], rule [] ]

        encBar =
            encoding
                << position Y [ pName "open", pQuant ]
                << position Y2 [ pName "close" ]

        specBar =
            asSpec [ encBar [], bar [ maSize 8 ] ]
    in
    toVegaLite [ width 400, data [], enc [], layer [ specRule, specBar ] ]
```

---

## Ranged dot plot

A ranged dot plot that uses 'layer' to convey changing life expectancy for the five most populous countries (between 1955 and 2000).

```elm {v l}
rangedDotPlot : Spec
rangedDotPlot =
    let
        data =
            dataFromUrl (path ++ "countries.json") []

        trans =
            transform
                << filter (fiOneOf "country" (strs [ "China", "India", "United States", "Indonesia", "Brazil" ]))
                << filter (fiOneOf "year" (nums [ 1955, 2000 ]))

        encCountry =
            encoding
                << position Y
                    [ pName "country"
                    , pAxis [ axTitle "Country", axOffset 5, axTicks False, axMinExtent 70, axDomain False ]
                    ]

        encLine =
            encoding
                << position X [ pName "life_expect", pQuant ]
                << detail [ dName "country" ]

        specLine =
            asSpec [ line [ maColor "#db646f" ], encLine [] ]

        encPoints =
            encoding
                << position X
                    [ pName "life_expect"
                    , pQuant
                    , pTitle "Life Expectancy (years)"
                    ]
                << color
                    [ mName "year"
                    , mOrdinal
                    , mScale (domainRangeMap ( 1955, "#e6959c" ) ( 2000, "#911a24" ))
                    , mTitle "Year"
                    ]

        specPoints =
            asSpec [ encPoints [], point [ maFilled True, maOpacity 1, maSize 100 ] ]
    in
    toVegaLite [ data, trans [], encCountry [], layer [ specLine, specPoints ] ]
```

---

## Bullet Chart

Used typically to display performance data, bullet charts function like bar charts, but are accompanied by extra visual elements for context. Originally developed by Stephen Few as a more space efficient alternative to dashboard gauges and meters. This example based on the [dataviz catalogue example](https://datavizcatalogue.com/methods/bullet_graph.html).

```elm {v l}
layer3 : Spec
layer3 =
    let
        desc =
            description "Bullet chart"

        cfg =
            configure << configuration (coTick [ maThickness 2 ])

        row title ranges measures marker =
            Json.Encode.object
                [ ( "title", Json.Encode.string title )
                , ( "ranges", Json.Encode.list Json.Encode.float ranges )
                , ( "measures", Json.Encode.list Json.Encode.float measures )
                , ( "markers", Json.Encode.list Json.Encode.float [ marker ] )
                ]

        data =
            dataFromJson
                (Json.Encode.list identity
                    [ row "Revenue" [ 150, 225, 300 ] [ 220, 270 ] 250
                    , row "Profit" [ 20, 25, 30 ] [ 21, 23 ] 26
                    , row "Order size" [ 350, 500, 600 ] [ 100, 320 ] 550
                    , row "New customers" [ 1400, 2000, 2500 ] [ 1000, 1650 ] 2100
                    , row "Satisfaction" [ 3.5, 4.25, 5 ] [ 3.2, 4.7 ] 4.4
                    ]
                )

        res =
            resolve << resolution (reScale [ ( chX, reIndependent ) ])

        enc1 =
            encoding
                << position X
                    [ pName "ranges[2]"
                    , pQuant
                    , pScale [ scNice niFalse ]
                    , pTitle ""
                    ]

        spec1 =
            asSpec [ enc1 [], bar [ maColor "#eee" ] ]

        enc2 =
            encoding
                << position X [ pName "ranges[1]", pQuant ]

        spec2 =
            asSpec [ enc2 [], bar [ maColor "#ddd" ] ]

        enc3 =
            encoding
                << position X [ pName "ranges[0]", pQuant ]

        spec3 =
            asSpec [ enc3 [], bar [ maColor "#ccc" ] ]

        enc4 =
            encoding
                << position X [ pName "measures[1]", pQuant ]

        spec4 =
            asSpec [ enc4 [], bar [ maColor "lightsteelblue", maSize 10 ] ]

        enc5 =
            encoding
                << position X [ pName "measures[0]", pQuant ]

        spec5 =
            asSpec [ enc5 [], enc5 [], bar [ maColor "steelblue", maSize 10 ] ]

        enc6 =
            encoding
                << position X [ pName "markers[0]", pQuant ]

        spec6 =
            asSpec [ enc6 [], tick [ maColor "black" ] ]
    in
    toVegaLite
        [ desc
        , cfg []
        , data []
        , res []
        , facet
            [ rowBy
                [ fName "title"
                , fOrdinal
                , fHeader
                    [ hdLabelAngle 0
                    , hdLabelAlign haLeft
                    , hdTitle ""
                    ]
                ]
            ]
        , specification (asSpec [ layer [ spec1, spec2, spec3, spec4, spec5, spec6 ] ])
        ]
```

---

## Dual Axis Chart

A bar/area chart with dual axes created by setting the y scales in a layered chart to be independent.

```elm {v l}
dualAxes : Spec
dualAxes =
    let
        data =
            dataFromUrl (path ++ "weather.csv") []

        trans =
            transform
                << filter (fiExpr "datum.location == \"Seattle\"")
                << calculateAs "datum.precipitation * 25.4" "precipitationmm"

        encTime =
            encoding
                << position X
                    [ pName "date"
                    , pTimeUnit month
                    , pAxis [ axFormat "%b", axTitle "" ]
                    ]

        encArea =
            encoding
                << position Y
                    [ pName "temp_max"
                    , pAggregate opMean
                    , pScale [ scDomain (doNums [ 0, 30 ]) ]
                    , pAxis [ axTitle "Avgerage Temperature (°C)", axTitleColor "#85C5A6" ]
                    ]
                << position Y2 [ pName "temp_min", pAggregate opMean ]

        specArea =
            asSpec [ encArea [], area [ maOpacity 0.3, maColor "#85C5A6" ] ]

        encLine =
            encoding
                << position Y
                    [ pName "precipitationmm"
                    , pAggregate opMean
                    , pAxis [ axTitle "Precipitation (mm)", axTitleColor "#85A9C5" ]
                    ]

        specLine =
            asSpec [ encLine [], line [ maStroke "#85A9C5", maInterpolate miMonotone ] ]

        res =
            resolve
                << resolution (reScale [ ( chY, reIndependent ) ])
    in
    toVegaLite
        [ width 400
        , height 300
        , data
        , trans []
        , encTime []
        , res []
        , layer [ specArea, specLine ]
        ]
```

---

## "Bar-bell" Chart

Inspired by this [Vega example](https://vega.github.io/vega-editor/?mode=vega&spec=weather). Weekly weather data plot representing high/low ranges of record temperatures (light grey), average temperatures (dark grey), and both predicted and observed temperatures (black) for the given week. The first five days have high/low ranges of observed temperatures, and the last five days have ranges of predicted temperatures, where the upper barbell represents the range of high temperature predictions and the lower barbell represents the range of low temperature predictions. Created by @melissatdiamond.

```elm {v l}
barbell : Spec
barbell =
    let
        data =
            dataFromUrl (path ++ "weather.json") []

        enc1 =
            encoding
                << position Y
                    [ pName "record.low"
                    , pQuant
                    , pScale [ scDomain (doNums [ 10, 70 ]) ]
                    , pAxis [ axTitle "Temperature (F)" ]
                    ]
                << position Y2 [ pName "record.high" ]
                << position X [ pName "id", pTitle "Day" ]

        spec1 =
            asSpec [ enc1 [], bar [ maSize 20, maColor "lightgrey" ] ]

        enc2 =
            encoding
                << position Y [ pName "normal.low", pQuant ]
                << position Y2 [ pName "normal.high" ]
                << position X [ pName "id" ]

        spec2 =
            asSpec [ enc2 [], bar [ maSize 20, maColor "grey" ] ]

        enc3 =
            encoding
                << position Y [ pName "actual.low", pQuant ]
                << position Y2 [ pName "actual.high" ]
                << position X [ pName "id" ]

        spec3 =
            asSpec [ enc3 [], bar [ maSize 12, maColor "black" ] ]

        enc4 =
            encoding
                << position Y [ pName "forecast.low.low", pQuant ]
                << position Y2 [ pName "forecast.low.high" ]
                << position X [ pName "id" ]

        spec4 =
            asSpec [ enc4 [], bar [ maSize 12, maColor "black" ] ]

        enc5 =
            encoding
                << position Y [ pName "forecast.low.high", pQuant ]
                << position Y2 [ pName "forecast.high.low" ]
                << position X [ pName "id" ]

        spec5 =
            asSpec [ enc5 [], bar [ maSize 3, maColor "black" ] ]

        enc6 =
            encoding
                << position Y [ pName "forecast.high.low", pQuant ]
                << position Y2 [ pName "forecast.high.high" ]
                << position X [ pName "id" ]

        spec6 =
            asSpec [ enc6 [], bar [ maSize 12, maColor "black" ] ]

        enc7 =
            encoding
                << position X
                    [ pName "id"
                    , pOrdinal
                    , pAxis
                        [ axDomain False
                        , axTicks False
                        , axLabels False
                        , axTitle "Day"
                        , axTitlePadding 25
                        , axOrient siTop
                        ]
                    ]
                << text [ tName "day" ]

        spec7 =
            asSpec [ enc7 [], textMark [ maAlign haCenter, maDy -105 ] ]
    in
    toVegaLite
        [ title "Weekly Weather Observations and Predictions" []
        , width 250
        , height 200
        , data
        , layer [ spec1, spec2, spec3, spec4, spec5, spec6, spec7 ]
        ]
```
