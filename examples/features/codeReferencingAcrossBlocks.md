---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Simple litvis chart

```elm {l=hidden}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

```elm {l=hidden}
barChart : Spec
barChart =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pAggregate opCount, pQuant ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

```elm {v}
barChartCopy : Spec
barChartCopy =
    barChart
```
