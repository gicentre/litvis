---
elm:
  dependencies:
    gicentre/elm-vega: latest
---

Teaser 

^^^elm v=barChart^^^

```elm {l}
import VegaLite exposing (..)
```

# Simple litvis chart

```elm {l}
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

Frequency histogram: ^^^elm v=barChart^^^
