---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Area Charts and Streamgraphs

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Area Chart

Taking a simple line chart and changing the mark from [line](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#line) to [area](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#area) will fill the area under the line. Useful when the area under a line has some meaning to the viewer.

```elm {v l}
areaChart : Spec
areaChart =
    let
        data =
            dataFromUrl (path ++ "unemployment-across-industries.json") []

        enc =
            encoding
                << position X [ pName "date", pTimeUnit yearMonth, pAxis [ axTitle "", axFormat "%Y" ] ]
                << position Y [ pName "count", pAggregate opSum, pTitle "Number unemployed" ]
    in
    toVegaLite [ width 300, data, enc [], area [] ]
```

---

## Area chart with gradient fill

We can provide a linear gradient to the area fill colour to emphasise the upper line while retaining some emphasis on the area under the line.

```elm {v l}
areaWithGradient : Spec
areaWithGradient =
    let
        data =
            dataFromUrl (path ++ "unemployment-across-industries.json") []

        enc =
            encoding
                << position X [ pName "date", pTimeUnit yearMonth, pAxis [ axTitle "", axFormat "%Y" ] ]
                << position Y [ pName "count", pAggregate opSum, pTitle "Number unemployed" ]
    in
    toVegaLite
        [ width 300
        , data
        , enc []
        , area
            [ maLine (lmMarker [ maStroke "darkblue" ])
            , maFillGradient grLinear
                [ grX1 1
                , grY1 1
                , grX2 1
                , grY2 0
                , grStops [ ( 0, "white" ), ( 1, "darkblue" ) ]
                ]
            ]
        ]
```

---

## Stacked area chart

A stacked area chart is similar to a stacked bar chart except it uses an [area](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#area) mark. It creates a continuous set of stacked regions. Here showing unemployment numbers across industries.

```elm {v l}
stackedArea : Spec
stackedArea =
    let
        data =
            dataFromUrl (path ++ "unemployment-across-industries.json") []

        enc =
            encoding
                << position X [ pName "date", pTimeUnit yearMonth, pAxis [ axTitle "", axFormat "%Y" ] ]
                << position Y [ pName "count", pAggregate opSum, pTitle "Number unemployed" ]
                << color [ mName "series", mTitle "Sector" ]
    in
    toVegaLite [ width 300, data, enc [], area [] ]
```

---

## Normalised stacked area chart

As above but this time normalising the height of the area in order to allow comparison of proportions of unemployed people in each sector.

```elm {v l}
normalisedStackedArea : Spec
normalisedStackedArea =
    let
        data =
            dataFromUrl (path ++ "unemployment-across-industries.json") []

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pTimeUnit yearMonth
                    , pAxis [ axTitle "", axFormat "%Y" ]
                    ]
                << position Y
                    [ pName "count"
                    , pAggregate opSum
                    , pTitle "Number unemployed"
                    , pStack stNormalize
                    ]
                << color [ mName "series", mTitle "Sector" ]
    in
    toVegaLite [ width 300, data, enc [], area [] ]
```

---

## Streamgraph

As above but stacked categories are centred to create a [streamgraph](https://datavizcatalogue.com/methods/stream_graph.html).

```elm {v l}
streamgraph : Spec
streamgraph =
    let
        data =
            dataFromUrl (path ++ "unemployment-across-industries.json") []

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pTimeUnit yearMonth
                    , pAxis [ axTitle "", axFormat "%Y" ]
                    ]
                << position Y
                    [ pName "count"
                    , pAggregate opSum
                    , pTitle "Number unemployed"
                    , pStack stCenter
                    ]
                << color [ mName "series", mTitle "Sector" ]
    in
    toVegaLite [ width 300, data, enc [], area [] ]
```

---

## Horizon Chart

Horizon charts allow vertically compact designs to be created by slicing an area chart into bands and overlaying them on top of each other in increasingly darker colours. They can be created by creating a composite layout with [layer](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#layer) used to overlay each horizon band.

```elm {v l}
horizonChart : Spec
horizonChart =
    let
        data =
            dataFromColumns []
                << dataColumn "x" (nums (List.map toFloat (List.range 1 20)))
                << dataColumn "y" (nums [ 28, 55, 43, 91, 81, 53, 19, 87, 52, 48, 24, 49, 87, 66, 17, 27, 68, 16, 49, 15 ])

        trans =
            transform << calculateAs "datum.y - 50" "ny"

        encX =
            encoding
                << position X
                    [ pName "x"
                    , pQuant
                    , pScale [ scZero False, scNice niFalse ]
                    , pTitle ""
                    ]

        encLower =
            encoding
                << position Y
                    [ pName "y"
                    , pQuant
                    , pScale [ scDomain (doNums [ 0, 50 ]) ]
                    ]

        specLower =
            asSpec [ encLower [], area [ maClip True, maOpacity 0.4 ] ]

        encUpper =
            encoding
                << position Y
                    [ pName "ny"
                    , pQuant
                    , pScale [ scDomain (doNums [ 0, 50 ]) ]
                    , pTitle ""
                    ]
                << opacity [ mNum 0.3 ]

        specUpper =
            asSpec [ trans [], encUpper [], area [ maClip True ] ]

        cfg =
            configure
                << configuration (coArea [ maInterpolate miMonotone, maOrient moVertical ])
    in
    toVegaLite
        [ width 500
        , height 50
        , cfg []
        , data []
        , encX []
        , layer [ specLower, specUpper ]
        ]
```
