---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

# Debugging Vega Lite

```elm {l r j v}
import VegaLite exposing (..)


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

```elm {l=hidden}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```
