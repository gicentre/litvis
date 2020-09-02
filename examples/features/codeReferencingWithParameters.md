---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

# Sparklines

1.  ^^^elm v=(sparkline "1")^^^
1.  ^^^elm v=(sparkline "2")^^^
1.  ^^^elm v=(sparkline "3")^^^

^^^elm v=(sparkline "1")^^^ and then ^^^elm v=(sparkline "3")^^^

```elm {l=hidden}
import VegaLite exposing (..)


sparkline : String -> Spec
sparkline groupName =
    let
        cfg =
            configure
                << configuration
                    (coView
                        [ vicoStroke Nothing
                        , vicoContinuousHeight 15
                        , vicoContinuousWidth 80
                        ]
                    )

        trans =
            transform
                << filter (fiExpr ("datum.group == " ++ groupName))

        enc =
            encoding
                << position X
                    [ pName "x"
                    , pQuant
                    , pAxis []
                    ]
                << position Y
                    [ pName "y"
                    , pQuant
                    , pAxis []
                    , pScale [ scZero False ]
                    ]
    in
    toVegaLite
        [ cfg []
        , dataFromUrl "https://gicentre.github.io/data/randomWalk.csv" []
        , trans []
        , enc []
        , line [ maColor "black" ]
        ]
```
