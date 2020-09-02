---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Bicycle Hires

```elm {l}
barChart : Spec
barChart =
    let
        enc =
            encoding
                << position X [ pName "AvHireTime" ]
                << position Y [ pAggregate opCount ]
    in
    toVegaLite
        [ dataFromUrl "https://gicentre.github.io/data/bicycleHiresLondon.csv" []
        , enc []
        , bar []
        ]
```

```elm {v}
fDistrib : Spec
fDistrib =
    barChart
```
