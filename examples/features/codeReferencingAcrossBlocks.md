---
elm:
  dependencies:
    gicentre/elm-vega: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Simple litvis chart

```elm {l=hidden}
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

```elm {v}
barChartCopy : Spec
barChartCopy =
    barChart
```
