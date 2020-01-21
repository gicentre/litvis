---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
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
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pAggregate opCount, pQuant ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

Frequency histogram: ^^^elm v=barChart^^^
