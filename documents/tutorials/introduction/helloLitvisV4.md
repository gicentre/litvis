---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Hello Litvis

```elm {l=hidden}
data =
    dataFromUrl "https://gicentre.github.io/data/tiobeIndexMay2018.csv"
```

Top 50 programming languages according to the [TIOBE index](https://www.tiobe.com/tiobe-index).

```elm {v siding}
helloLitvis : Spec
helloLitvis =
    let
        enc =
            encoding
                << position X
                    [ pName "language"
                    , pNominal
                    , pSort [ soByField "rating" opMean, soDescending ]
                    ]
                << position Y [ pName "rating", pQuant ]
    in
    toVegaLite [ data [], bar [], enc [] ]
```

Here are the same data but displayed as horizontal bars arranged in alphabetical order:

```elm {v siding}
helloLitvis : Spec
helloLitvis =
    let
        enc =
            encoding
                << position Y [ pName "language", pNominal ]
                << position X [ pName "rating", pQuant ]
    in
    toVegaLite [ data [], bar [], enc [] ]
```
