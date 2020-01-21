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
            dataFromUrl "https://vega.github.io/vega-lite/data/cars.json"
                []

        enc =
            encoding
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pAggregate opCount, pQuant ]
    in
    toVegaLite [ data, enc [], bar [] ]
```
