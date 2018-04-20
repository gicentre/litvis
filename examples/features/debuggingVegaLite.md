---
elm:
  dependencies:
    gicentre/elm-vega: latest
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
                << position X [ PName "Horsepower", PmType Quantitative ]
                << position Y [ PmType Quantitative, PAggregate Count ]
    in
    toVegaLite [ data, enc [], mark Bar [] ]
```
