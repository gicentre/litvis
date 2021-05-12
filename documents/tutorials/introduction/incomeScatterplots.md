---
follows: incomeRoot
---

# Scatterplot experiments

Rather than separate the 5% and 95% income quantiles, consider a scatterplot that compares both measures for each year of the sample.

```elm {l=hidden}
cfg =
    let
        font =
            "Roboto Condensed"
    in
    configure
        << configuration (coAxis [ axcoTitleFont font, axcoLabelFont font, axcoGrid False ])
        << configuration (coView [ vicoStroke Nothing, vicoContinuousWidth 500, vicoContinuousHeight 500 ])
        << configuration (coText [ maAlign haRight, maFontSize 7, maAngle 20, maDx -4 ])
```

```elm {l=hidden}
enc =
    encoding
        << position X
            [ pName "5pcIncome"
            , pQuant
            , pAxis [ axTitle "Poorest 5% (£)" ]
            , pScale [ scZero True ]
            ]
        << position Y
            [ pName "95pcIncome"
            , pQuant
            , pAxis [ axTitle "Richest 5% (£)" ]
            , pScale [ scZero True ]
            ]
        << order [ oName "Year", oTemporal ]
```

```elm {v siding}
scatter : Spec
scatter =
    toVegaLite [ cfg [], data, enc [], point [ maFilled True ] ]
```

While this shows some structure, which is revealing, we cannot see the temporal trend. We could get a better idea by creating a [connected scatterplot](https://eagereyes.org/papers/the-connected-scatterplot-for-presenting-paired-time-series) that joins the points in temporal order (1961 in bottom left, 2016 at top right):

```elm {v siding}
scatter : Spec
scatter =
    toVegaLite
        [ cfg []
        , data
        , enc []
        , line
            [ maInterpolate miMonotone
            , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
            ]
        ]
```

The plot still lacks important context (which dots refer to which years), so we can overlay some text labels indicating the year of every new Prime Minister:

```elm {l=hidden}
labelEnc =
    encoding
        << position X [ pName "5pcIncome", pQuant ]
        << position Y [ pName "95pcIncome", pQuant ]
        << text [ tName "PMLabel" ]
```

```elm {v siding}
scatter : Spec
scatter =
    let
        lineSpec =
            asSpec
                [ enc []
                , line
                    [ maInterpolate miMonotone
                    , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
                    ]
                ]

        labelSpec =
            asSpec [ textMark [], labelEnc [] ]
    in
    toVegaLite [ cfg [], data, layer [ lineSpec, labelSpec ] ]
```

Labels look too crowded towards the top of the scatterplot, so for now let's make the chart zoomable.

```elm {v interactive siding}
scatter : Spec
scatter =
    let
        ps =
            params
                << param "view" [ paSelect seInterval [], paBindScales ]

        lineSpec =
            asSpec
                [ enc []
                , line
                    [ maInterpolate miMonotone
                    , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
                    ]
                ]

        labelSpec =
            asSpec [ ps [], labelEnc [], textMark [] ]
    in
    toVegaLite [ cfg [], data, layer [ lineSpec, labelSpec ] ]
```
