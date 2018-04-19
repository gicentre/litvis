---
elm:
  dependencies:
    gicentre/elm-vega: latest
---

^^^elm v=[(sparkline "1"), (sparkline "2"), (sparkline "3")]^^^

# Sparklines

```elm {l=hidden}
import VegaLite exposing (..)


sparkline : String -> Spec
sparkline groupName =
    let
        config =
            configure << configuration (View [ Stroke Nothing, ViewHeight 15, ViewWidth 80 ])

        data =
            dataFromUrl "https://gicentre.github.io/data/randomWalk.csv"

        trans =
            transform << filter (FExpr ("datum.group == " ++ groupName))

        enc =
            encoding
                << position X [ PName "x", PmType Quantitative, PAxis [] ]
                << position Y [ PName "y", PmType Quantitative, PAxis [], PScale [ SZero False ] ]
                << color [ MString "black" ]
    in
    toVegaLite [ config [], data [], trans [], enc [], mark Line [] ]
```

1.  ^^^elm v=(sparkline "1")^^^
2.  ^^^elm v=(sparkline "2")^^^
3.  ^^^elm v=(sparkline "3")^^^

^^^elm v=(sparkline "1")^^^ text ^^^elm v=(sparkline "2")^^^ more text ^^^elm v=(sparkline "3")^^^.