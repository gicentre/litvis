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
        path file =
            "https://gicentre.github.io/data/geoTutorials/" ++ file

        pDetails =
            [ width 300, height 150, projection (prType proj :: props) ]

        graticuleSpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl (path "graticule.json") [ topojsonMesh "graticule" ]
                       , geoshape [ maFilled False, maStroke "#000", maStrokeWidth 0.1 ]
                       ]
                )

        countrySpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl (path "world-110m.json") [ topojsonFeature "countries1" ]
                       , geoshape [ maStroke "white", maFill "#232", maOpacity 0.7, maStrokeWidth 0.1 ]
                       ]
                )
    in
    toVegaLite
        [ configure (configuration (coView [ vicoStroke Nothing ]) [])
        , layer [ graticuleSpec, countrySpec ]
        ]
```

# Map Projections

```elm {v siding}
projectedGlobe : Spec
projectedGlobe =
    globe equirectangular []
```

```elm {v}
projectedGlobe : Spec
projectedGlobe =
    globe orthographic []
```
