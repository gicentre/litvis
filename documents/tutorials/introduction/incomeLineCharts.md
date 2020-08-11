---
follows: incomeRoot
---

# Line chart experiments

Household income of the richest 5 percent after housing costs and adjusted for inflation:

```elm {v}
richest : Spec
richest =
    let
        enc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pQuant, pTitle "Richest 5% (£)" ]
    in
    toVegaLite [ width 400, data, enc [], line [ maStroke "darkBlue" ] ]
```

And the same for the poorest 5% (5th percentile):

```elm {v}
poorest : Spec
poorest =
    let
        enc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pQuant, pTitle "Poorest 5% (£)" ]
    in
    toVegaLite [ width 400, data, enc [], line [ maStroke "darkRed" ] ]
```

Comparison between the two is quite hard, so perhaps it would be easier on the same chart:

```elm {v siding}
combinedLinechart : Spec
combinedLinechart =
    let
        enc5pc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pQuant, pTitle "Household income (£)" ]

        enc95pc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pQuant ]
    in
    toVegaLite
        [ width 400
        , data
        , layer
            [ asSpec [ enc5pc [], line [ maStroke "darkred" ] ]
            , asSpec [ enc95pc [], line [ maStroke "darkblue" ] ]
            ]
        ]
```

Noting that the income of the richest 5% is an order of magnitude greater than the poorest 5%, while we can now compare both sets of figures, it is difficult to see any significant variation in the 5% line (in red). So perhaps it would be better to give each line its own scale on a dual-axis linechart:

```elm {v siding}
combinedLinechart : Spec
combinedLinechart =
    let
        enc5pc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "5pcIncome", pQuant, pTitle "Poorest 5% household income (£)" ]

        enc95pc =
            encoding
                << position X [ pName "Year", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y [ pName "95pcIncome", pQuant, pTitle "Richest 5% household income (£)" ]

        res =
            resolve
                << resolution (reAxis [ ( chY, reIndependent ) ])
                << resolution (reScale [ ( chY, reIndependent ) ])
    in
    toVegaLite
        [ width 400
        , data
        , res []
        , layer
            [ asSpec [ enc5pc [], line [ maStroke "darkred" ] ]
            , asSpec [ enc95pc [], line [ maStroke "darkblue" ] ]
            ]
        ]
```

But now it is more difficult to know which line refers to which percentile, and those arbitrary crossing lines are rather distracting. And those [aren't the only problems](https://blog.datawrapper.de/dualaxis/) with dual-axis charts.
