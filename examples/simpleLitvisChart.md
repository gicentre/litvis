---
elm:
  dependencies:
    gicentre/elm-vega: latest
---

```elm {l}
import VegaLite exposing (..)
```

# Simple litvis chart

```elm {l v}
barChart : Spec
barChart =
    let
        data =
            dataFromUrl "https://vega.github.io/vega-lite/data/cars.json"
                []

        enc =
            encoding
                << position Y [ PName "Horsepower", PmType Quantitative ]
                << position X [ PmType Quantitative, PAggregate Count ]
    in
    toVegaLite [ data, enc [], mark Bar [] ]
```
