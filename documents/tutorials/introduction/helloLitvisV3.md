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
    dataFromColumns []
        << dataColumn "language" (strs [ "Java", "C", "C++", "Python", "C#" ])
        << dataColumn "rating" (nums [ 15.8, 13.6, 7.2, 5.8, 5.3 ])
```

Top 5 programming languages according to the [TIOBE index](https://www.tiobe.com/tiobe-index).

```elm {v siding}
helloLitvis : Spec
helloLitvis =
    let
        enc =
            encoding
                << position X [ pName "language", pMType Nominal, pSort [ soByField "rating" opMean, soDescending ] ]
                << position Y [ pName "rating", pMType Quantitative ]
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
                << position Y [ pName "language", pMType Nominal ]
                << position X [ pName "rating", pMType Quantitative ]
    in
    toVegaLite [ data [], bar [], enc [] ]
```
