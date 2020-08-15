---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

Teaser

^^^elm v=barChart^^^

```elm {l=hidden}
import VegaLite exposing (..)
```

```elm {l=hidden}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

# Simple litvis chart

```elm {l}
barChart : Spec
barChart =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pAggregate opCount ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

Frequency histogram: ^^^elm v=barChart^^^
