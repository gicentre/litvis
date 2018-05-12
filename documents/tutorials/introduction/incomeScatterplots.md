---
follows: incomeRoot
---

## Scatterplot experiments

Rather than separate the 5% and 95% income quantiles, consider a scatterplot that compares both measures for each year of the sample.

```elm {l=hidden}
config =
    let
        font =
            "Roboto Condensed"
    in
    configure
        << configuration (coAxis [ axcoTitleFont font, axcoLabelFont font, axcoGrid False ])
        << configuration (coView [ vicoStroke Nothing, vicoWidth 300, vicoHeight 300 ])
        << configuration (coText [ maAlign AlignRight, maFontSize 7, maAngle 20, maDx -4 ])
```

```elm {l=hidden}
enc =
    encoding
        << position X
            [ pName "5pcIncome"
            , pMType Quantitative
            , pAxis [ axTitle "Poorest 5% (£)" ]
            , pScale [ scZero True ]
            ]
        << position Y
            [ pName "95pcIncome"
            , pMType Quantitative
            , pAxis [ axTitle "Richest 5% (£)" ]
            , pScale [ scZero True ]
            ]
        << order [ oName "Year", oMType Temporal ]
```

```elm {v siding}
scatter : Spec
scatter =
    toVegaLite [ config [], data, point [ maFilled True ], enc [] ]
```

While this shows some structure, which is revealing, we cannot see the temporal trend.
We could get a better idea by creating a [connected scatterplot](https://eagereyes.org/papers/the-connected-scatterplot-for-presenting-paired-time-series) that joins the points in temporal order (1961 in bottom left, 2016 at top right):

```elm {v siding}
scatter : Spec
scatter =
    toVegaLite
        [ config []
        , data
        , line
            [ maInterpolate Monotone
            , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
            ]
        , enc []
        ]
```

The plot still lacks important context (which dots refer to which years), so we can overlay some text labels indicating the year of every new Prime Minister:

```elm {l=hidden}
labelEnc =
    encoding
        << position X [ pName "5pcIncome", pMType Quantitative ]
        << position Y [ pName "95pcIncome", pMType Quantitative ]
        << text [ tName "PMLabel", tMType Nominal ]
```

```elm {v siding}
scatter : Spec
scatter =
    let
        lineSpec =
            asSpec
                [ line
                    [ maInterpolate Monotone
                    , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
                    ]
                , enc []
                ]

        labelSpec =
            asSpec [ textMark [], labelEnc [] ]
    in
    toVegaLite [ config [], data, layer [ lineSpec, labelSpec ] ]
```

Labels look too crowded towards the top of the scatterplot, so for now let's make the chart zoomable.

```elm {v interactive siding}
scatter : Spec
scatter =
    let
        lineSpec =
            asSpec
                [ line
                    [ maInterpolate Monotone
                    , maPoint (pmMarker [ maFill "black", maStroke "white", maStrokeWidth 1.5 ])
                    ]
                , enc []
                ]

        labelSpec =
            asSpec [ textMark [], labelEnc [], sel [] ]

        sel =
            selection << select "view" Interval [ BindScales ]
    in
    toVegaLite [ config [], data, layer [ lineSpec, labelSpec ] ]
```
