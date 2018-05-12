---
follows: incomeRoot
---

## Line chart experiments

Household income of the richest 5 percent after housing costs and adjusted for inflation:

```elm {v}
richest : Spec
richest =
    let
        enc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pMType Quantitative, pAxis [ axTitle "Richest 5% (£)" ] ]
    in
    toVegaLite [ width 400, data, line [ maStroke "darkBlue" ], enc [] ]
```

And the same for the poorest 5% (5th percentile):

```elm {v}
poorest : Spec
poorest =
    let
        enc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pMType Quantitative, pAxis [ axTitle "Poorest 5% (£)" ] ]
    in
    toVegaLite [ width 400, data, line [ maStroke "darkRed" ], enc [] ]
```

Comparison between the two is quite hard, so perhaps it would be easier on the same chart:

```elm {v siding}
combinedLinechart : Spec
combinedLinechart =
    let
        enc5pc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pMType Quantitative, pAxis [ axTitle "Household income (£)" ] ]

        enc95pc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pMType Quantitative ]
    in
    toVegaLite
        [ width 400
        , data
        , layer
            [ asSpec [ line [ maStroke "darkred" ], enc5pc [] ]
            , asSpec [ line [ maStroke "darkblue" ], enc95pc [] ]
            ]
        ]
```

Noting that the income of the richest 5% is an order of magnitude greater than the poorest 5%, while we can now compare both sets of figures, it is difficult to see any significant variation in the 5% line (in red).
So perhaps it would be better to give each line its own scale on a dual-axis linechart:

```elm {v siding}
combinedLinechart : Spec
combinedLinechart =
    let
        enc5pc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pMType Quantitative, pAxis [ axTitle "Poorest 5% household income (£)" ] ]

        enc95pc =
            encoding
                << position X [ pName "Year", pMType Temporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pMType Quantitative, pAxis [ axTitle "Richest 5% household income (£)" ] ]

        res =
            resolve
                << resolution (reAxis [ ( ChY, Independent ) ])
                << resolution (reScale [ ( ChY, Independent ) ])
    in
    toVegaLite
        [ width 400
        , data
        , res []
        , layer
            [ asSpec [ line [ maStroke "darkred" ], enc5pc [] ]
            , asSpec [ line [ maStroke "darkblue" ], enc95pc [] ]
            ]
        ]
```

But now it is more dificult to know which line refers to which percentile, and those artibrary crossing lines are rather distracting.
And those [aren't the only problems](https://blog.datawrapper.de/dualaxis/) with dual-axis charts.
