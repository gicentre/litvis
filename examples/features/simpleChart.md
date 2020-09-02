---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Bicycle Hires

```elm {v}
barChart : Spec
barChart =
    let
        enc =
            encoding
                << position X [ pName "AvHireTime" ]
                << position Y [ pAggregate opCount ]
    in
    toVegaLite
        [ dataFromUrl "http://gicentre.github.io/data/bicycleHiresLondon.csv" [], enc [], bar [] ]
```
