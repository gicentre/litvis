---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

_Teaser_ ^^^elm v=barChart^^^

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
        [ dataFromUrl "http://gicentre.github.io/data/bicycleHiresLondon.csv" []
        , enc []
        , bar []
        ]
```

## Frequency distribution

^^^elm v=barChart^^^
