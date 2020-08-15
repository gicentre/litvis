---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Radial charts

Visualizations that use radial, polar projections such as pie charts.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Pie Chart

Useful for emphasising part-to-whole relationships, but care should be taken if purpose is to allow accurate estimation of magnitudes, in which case a bar chart may be more appropriate.

Polar angles of marks are set with [position Theta](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#Position), which would be equivalent to `position X` on a conventional bar chart. Radial marks are specified with the [arc](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#arc) mark.

```elm {v l}
pie : Spec
pie =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "category" (strs [ "A", "B", "C", "D", "E", "F" ])
                << dataColumn "value" (nums [ 4, 6, 10, 3, 7, 8 ])

        enc =
            encoding
                << position Theta [ pName "value", pQuant ]
                << color [ mName "category" ]
    in
    toVegaLite [ cfg [], data [], enc [], arc [] ]
```

---

## Donut Chart

Similar to pie chart but with the centre removed to emphasise area over angle. The centre 'hole' can be set with [maInnerRadius](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#maInnerRadius)

```elm {v l}
donut : Spec
donut =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "category" (strs [ "A", "B", "C", "D", "E", "F" ])
                << dataColumn "value" (nums [ 4, 6, 10, 3, 7, 8 ])

        enc =
            encoding
                << position Theta [ pName "value", pQuant ]
                << color [ mName "category" ]
    in
    toVegaLite [ cfg [], data [], enc [], arc [ maInnerRadius 50 ] ]
```

---

## Pie chart with direct labelling of segments

We can label pie segments directly by creating two layers, one for the segments and one for the labels.
Both use the same `position Theta` with the former using an [arc](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#arc) mark and the latter the [textMark](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#textMark).

```elm {v l}
pieLabels : Spec
pieLabels =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "category" (strs [ "A", "B", "C", "D", "E", "F" ])
                << dataColumn "value" (nums [ 4, 6, 10, 3, 7, 8 ])

        enc =
            encoding
                << position Theta [ pName "value", pQuant, pStack stZero ]
                << color [ mName "category", mLegend [] ]

        pieSpec =
            asSpec [ arc [ maOuterRadius 80 ] ]

        labelEnc =
            encoding
                << text [ tName "category" ]

        labelSpec =
            asSpec [ labelEnc [], textMark [ maRadius 90 ] ]
    in
    toVegaLite [ cfg [], data [], enc [], layer [ pieSpec, labelSpec ] ]
```

---

## Custom Pie Chart

As with any other chart, we can create custom colours and category names. This example reproduces this [datavis joke](https://robslink.com/SAS/democd91/pyramid_pie.htm). It uses the [order](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#order) channel to rotate the arc segments so the pyramid points upwards.

```elm {v l}
sunnyPyramid : Spec
sunnyPyramid =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        sky =
            "Sky"

        shade =
            "Shady side of a pyramid"

        sun =
            "Sunny side of a pyramid"

        data =
            dataFromColumns []
                << dataColumn "category" (strs [ sky, shade, sun ])
                << dataColumn "value" (nums [ 75, 10, 15 ])
                << dataColumn "order" (nums [ 3, 1, 2 ])

        colours =
            categoricalDomainMap
                [ ( sky, "#416D9D" )
                , ( shade, "#674028" )
                , ( sun, "#DEAC58" )
                ]

        enc =
            encoding
                << position Theta
                    [ pName "value"
                    , pQuant
                    , pScale [ scRange (raNums [ 2.356, 8.639 ]) ]
                    , pStack stZero
                    ]
                << color
                    [ mName "category"
                    , mScale colours
                    , mLegend [ leOrient loNone, leTitle "", leColumns 1, leX 200, leY 80 ]
                    ]
                << order [ oName "order", oQuant ]
    in
    toVegaLite [ cfg [], data [], enc [], arc [ maOuterRadius 80 ] ]
```

---

## Radial Plot

Pie charts use angle alone to indicate magnitude, but a radial plot can use both angle and radius as two position channels to convey two variables at once. In the example below we double encode the same `mag` variable with both angle and radius, but they could be independent variables. Radius is scaled by the square root of magnitude to avoid over-emphasising larger values (area of segment is enlarged both via radius and angle).

```elm {v l}
radial4 : Spec
radial4 =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "mag" (nums [ 12, 23, 47, 6, 52, 19 ])

        enc =
            encoding
                << position Theta [ pName "mag", pQuant, pStack stZero ]
                << position R [ pName "mag", pScale [ scZero True, scType scSqrt, scRange (raMin 20) ] ]
                << color [ mName "mag", mLegend [] ]

        segSpec =
            asSpec [ arc [ maInnerRadius 20, maStroke "white" ] ]

        labelEnc =
            encoding
                << text [ tName "mag", tQuant ]

        labelSpec =
            asSpec [ labelEnc [], textMark [ maRadiusOffset 10 ] ]
    in
    toVegaLite [ cfg [], data [], enc [], layer [ segSpec, labelSpec ] ]
```

---

## Nightingale Chart

Used by Florence Nightingale, the 'nightingale chart' is equivalent to the stacked bar chart but on a radial projection. Here is a reproduction of Nightingale's [Causes of mortality in the army of the east](https://en.wikipedia.org/wiki/Pie_chart#/media/File:Nightingale-mortality.jpg).

```elm {v l}
radial6 : Spec
radial6 =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "month" (strs [ "1854/04", "1854/05", "1854/06", "1854/07", "1854/08", "1854/09", "1854/10", "1854/11", "1854/12", "1855/01", "1855/02", "1855/03" ])
                << dataColumn "disease" (nums [ 1, 12, 11, 359, 828, 788, 503, 844, 1725, 2761, 2120, 1205 ])
                << dataColumn "wounds" (nums [ 0, 0, 0, 0, 1, 81, 132, 287, 114, 83, 42, 32 ])
                << dataColumn "other" (nums [ 5, 9, 6, 23, 30, 70, 128, 106, 131, 324, 361, 172 ])

        trans =
            transform
                << foldAs [ "disease", "wounds", "other" ] "cause" "deaths"

        transLabels =
            transform
                << filter (fiExpr "datum.cause == 'disease'")
                << calculateAs "upper(monthFormat((substring(datum.month,length(datum.month)-2))-1))" "monthLabel"
                << calculateAs "max(datum.disease,150)" "labelRadius"

        colours =
            categoricalDomainMap
                [ ( "disease", "rgb(120,160,180)" )
                , ( "wounds", "rgb(255,190,180)" )
                , ( "other", "rgb(80,80,80)" )
                ]

        enc =
            encoding
                << position Theta [ pName "month", pOrdinal ]

        encSector =
            encoding
                << position R [ pName "deaths", pScale [ scType scSqrt ], pStack stNone ]
                << order [ oName "cause", oOrdinal ]
                << color
                    [ mName "cause"
                    , mScale colours
                    , mLegend [ leTitle "", leLabelFont "Girassol", leOrient loNone, leX 80, leY 190 ]
                    ]

        specSector =
            asSpec
                [ encSector []
                , arc
                    [ maThetaOffset (degrees -90)
                    , maStroke "black"
                    , maStrokeWidth 0.2
                    , maOpacity 0.6
                    ]
                ]

        encLabels =
            encoding
                << angle [ mName "month", mOrdinal, mScale [ scRange (raNums [ -75, 255 ]) ] ]
                << position R [ pName "labelRadius", pQuant ]
                << text [ tName "monthLabel" ]

        specLabels =
            asSpec
                [ transLabels []
                , encLabels []
                , textMark [ maFont "Girassol", maThetaOffset (degrees -90), maDy -10 ]
                ]
    in
    toVegaLite
        [ cfg []
        , title "DIAGRAM of the CAUSES of MORTALITY"
            [ tiFont "Girassol"
            , tiFontSize 20
            , tiSubtitle "IN THE ARMY OF THE EAST\nAPRIL 1854 to MARCH 1855"
            , tiSubtitleFont "Girassol"
            , tiOffset -110
            ]
        , width 500
        , height 560
        , data []
        , trans []
        , enc []
        , layer [ specSector, specLabels ]
        ]
```
