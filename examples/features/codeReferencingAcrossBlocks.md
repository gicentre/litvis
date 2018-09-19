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

```elm {v}
barChartCopy : Spec
barChartCopy =
    barChart
```
