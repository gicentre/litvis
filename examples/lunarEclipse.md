---
id: "litvis"
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

@import "assets/robotoStyle.less"

# Lunar Eclipse Mapping

There was a lunar eclipse on the 27th of July, 2018.

Unlike solar eclipses, the shadow cast on the moon by the earth is large in comparison to the moon's size, so it is in shadow for much longer (1hr45 in July).

Because the sun emits light over its surface area, the shadow cast by the earth on the moon has a 'hazy' edge to it known as the _penumbra_. Inside the penumbra is the crisper edge or the _umbra_ of the earth's shadow.

Where and when the eclipse is seen from earth obviously depends on the moon being visible above the horizon. This can be shown on a map that takes into account the rotation of the earth allowing different regions to see the eclipse at different times.

^^^elm v=(eclipse Wide equirectangular 0 0 True)^^^

Viewing a phenomenon at this scale is a good way of appreciating the effect of different map projections on those regions able to see some or all of the eclipse.

Here are the same regions shown with Orthographic (left), Stereographic (middle) and Transverse Mercator projections.

^^^elm v=[(eclipse Square orthographic 0 -15 False ),(eclipse Square stereographic 40 -30 False),(eclipse Square transverseMercator 0 -15 False )]^^^

And here is the effect of rotating the centre of a stereographic projection by 0, 20 and 40 degrees of longitude:

^^^elm v=[(eclipse Square stereographic 0 0 False),(eclipse Square stereographic 20 0 False),(eclipse Square stereographic 40 0 False)]^^^

The same rotations, but applied to the Transverse Mercator projection:

^^^elm v=[(eclipse Square transverseMercator 0 0 False),(eclipse Square transverseMercator 20 0 False),(eclipse Square transverseMercator 40 0 False)]^^^

And finally, a rotation of the conic Albers projection by 0, 40 an 80 degrees of latitude:

^^^elm v=[(eclipse Square albers 0 0 False),(eclipse Square albers 0 40 False),(eclipse Square albers 0 80 False)]^^^

```elm {l=hidden}
import VegaLite exposing (..)


type Aspect
    = Wide
    | Square


path : String
path =
    "https://gicentre.github.io/data/"


eclipse : Aspect -> Projection -> Float -> Float -> Bool -> Spec
eclipse aspect projType lonRotate latRotate showLabels =
    let
        ( w, h ) =
            case aspect of
                Wide ->
                    ( 520, 250 )

                Square ->
                    ( 150, 150 )

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        mapData =
            dataFromUrl (path ++ "geoTutorials/world-110m.json")
                [ topojsonFeature "countries1" ]

        eclipseData =
            dataFromUrl (path ++ "geoTutorials/eclipse.json")
                [ topojsonFeature "eclipse" ]

        labelData =
            dataFromColumns []
                << dataColumn "label" (strs [ "No eclipse visible", "Eclipse at moonrise", "All eclipse visible", "Eclipse at moonset", "p1", "p4", "u4", "u3", "u2", "u1", "p1", "p4", "u4", "u3", "u2", "u1" ])
                << dataColumn "lon" (nums [ -122, -46, 58, 155, -175, -70, -52, -33, -10, 8, 25, 90, 108, 126, 149, 167 ])
                << dataColumn "lat" (nums [ -35, -35, -35, -35, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ])

        proj =
            projection [ prType projType, prRotate lonRotate latRotate 0 ]

        pDetails =
            [ width w, height h, proj ]

        countrySpec =
            asSpec
                (pDetails
                    ++ [ mapData
                       , geoshape
                            [ maStroke "white"
                            , maFill "black"
                            , maStrokeWidth 0.1
                            , maFillOpacity 0.1
                            ]
                       ]
                )

        umbraSpec =
            let
                trans =
                    transform
                        << filter (fiExpr "datum.id != 'p1' && datum.id != 'p4'")
            in
            asSpec
                (pDetails
                    ++ [ eclipseData
                       , trans []
                       , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.1 ]
                       ]
                )

        penumbraSpec =
            let
                trans =
                    transform
                        << filter (fiExpr "datum.id === 'p1' || datum.id == 'p4'")
            in
            asSpec
                (pDetails
                    ++ [ eclipseData
                       , trans []
                       , geoshape [ maStrokeOpacity 0, maFill "#003", maFillOpacity 0.1 ]
                       ]
                )

        labelSpec =
            let
                enc =
                    encoding
                        << position Longitude [ pName "lon" ]
                        << position Latitude [ pName "lat" ]
                        << text [ tName "label" ]
            in
            asSpec
                (pDetails
                    ++ [ labelData []
                       , textMark [ maSize 9, maColor "#333" ]
                       , enc []
                       ]
                )

        layers =
            if showLabels then
                [ countrySpec, umbraSpec, penumbraSpec, labelSpec ]

            else
                [ countrySpec, umbraSpec, penumbraSpec ]
    in
    toVegaLite [ cfg [], layer layers ]
```
