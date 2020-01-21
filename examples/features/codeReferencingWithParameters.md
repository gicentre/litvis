---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

^^^elm v=[(sparkline "1"), (sparkline "2"), (sparkline "3")]^^^

# Sparklines

```elm {l=hidden}
import VegaLite exposing (..)


sparkline : String -> Spec
sparkline groupName =
    let
        config =
            configure
                << configuration (coView [ vicoStroke Nothing, vicoHeight 15, vicoWidth 80 ])

        data =
            dataFromUrl "https://gicentre.github.io/data/randomWalk.csv"
                [ parse [ ( "x", foNum ), ( "y", foNum ) ] ]

        trans =
            transform << filter (fiExpr ("datum.group == " ++ groupName))

        enc =
            encoding
                << position X [ pName "x", pQuant, pAxis [] ]
                << position Y [ pName "y", pQuant, pAxis [], pScale [ scZero False ] ]
    in
    toVegaLite
        [ config []
        , data
        , trans []
        , enc []
        , line [ maColor "black", maStrokeWidth 1 ]
        ]
```

1.  ^^^elm v=(sparkline "1")^^^
2.  ^^^elm v=(sparkline "2")^^^
3.  ^^^elm v=(sparkline "3")^^^

^^^elm v=(sparkline "1")^^^ text ^^^elm v=(sparkline "2")^^^ more text ^^^elm v=(sparkline "3")^^^.
