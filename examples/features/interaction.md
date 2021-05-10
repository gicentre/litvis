---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Bicycle Hires

Drag selection across upper scatterplot to see a frequency distribution of highlighted points.

```elm {v interactive}
interactive : Spec
interactive =
    let
        data =
            dataFromUrl "https://gicentre.github.io/data/bicycleHiresLondon.csv" []

        ps =
            params
                << param "myBrush" [ paSelect seInterval [] ]

        encScatter =
            encoding
                << position X [ pName "NumberOfHires", pQuant ]
                << position Y [ pName "AvHireTime", pQuant ]
                << color
                    [ mCondition (prParam "myBrush")
                        [ mStr "rgb(76,120,168)" ]
                        [ mStr "lightgrey" ]
                    ]

        specScatter =
            asSpec [ width 300, height 150, ps [], encScatter [], circle [] ]

        trans =
            transform
                << filter (fiSelection "myBrush")

        encBars =
            encoding
                << position X
                    [ pName "AvHireTime"
                    , pScale [ scDomain (doNums [ 14, 27 ]) ]
                    , pQuant
                    ]
                << position Y
                    [ pAggregate opCount
                    , pScale [ scDomain (doMax 20) ]
                    ]

        specBars =
            asSpec [ width 300, height 120, trans [], encBars [], bar [ maSize 15 ] ]
    in
    toVegaLite [ data, vConcat [ specScatter, specBars ] ]
```
