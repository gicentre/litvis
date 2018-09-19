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
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pMType Quantitative, pAggregate opCount ]
    in
    toVegaLite [ data, enc [], bar [] ]
```
