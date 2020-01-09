---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

# Hello Litvis

Top 5 programming languages according to the [TIOBE index](https://www.tiobe.com/tiobe-index).

```elm {v}
helloLitvis : Spec
helloLitvis =
    let
        data =
            dataFromColumns []
                << dataColumn "language" (strs [ "Java", "C", "C++", "Python", "C#" ])
                << dataColumn "rating" (nums [ 15.8, 13.6, 7.2, 5.8, 5.3 ])

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

```elm {v}
helloLitvis2 : Spec
helloLitvis2 =
    let
        data =
            dataFromColumns []
                << dataColumn "language" (strs [ "Java", "C", "C++", "Python", "C#" ])
                << dataColumn "rating" (nums [ 15.8, 13.6, 7.2, 5.8, 5.3 ])

        enc =
            encoding
                << position Y [ pName "language", pNominal ]
                << position X [ pName "rating", pQuant ]
    in
    toVegaLite [ data [], bar [], enc [] ]
```
