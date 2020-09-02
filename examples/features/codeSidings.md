---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)


globe : Projection -> List ProjectionProperty -> Spec
globe proj props =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        pDetails =
            [ width 300, height 150, projection (prType proj :: props) ]

        graticuleSpec =
            asSpec
                (pDetails
                    ++ [ graticule [ grStep ( 10, 10 ) ]
                       , geoshape [ maFilled False, maStroke "#000", maStrokeWidth 0.1 ]
                       ]
                )

        countrySpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl "https://gicentre.github.io/data/geoTutorials/world-110m.json" [ topojsonFeature "countries1" ]
                       , geoshape [ maStroke "white", maFill "#232", maOpacity 0.7, maStrokeWidth 0.1 ]
                       ]
                )
    in
    toVegaLite [ cfg [], layer [ graticuleSpec, countrySpec ] ]
```

# Map Projections

```elm {v siding}
worldMap : Spec
worldMap =
    globe orthographic []
```

```elm {v}
worldMap : Spec
worldMap =
    globe equalEarth []
```
