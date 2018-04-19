---
id: "litvis"
elm:
    dependencies:
         gicentre/elm-vega: latest
---

@import "css/robotoStyle.less"

## Eclipse Mapping

There will be a lunar eclipse in the 27th of July, 2018.

Unlike solar eclipses, the shadow cast on the moon by the earth is large in comparison to the moon's size, so it is in shadow for much longer (1hr45 in July).

Because the sun emits light over its surface area, the shadow cast by the earth on the moon has a 'hazy' edge to it known as the _penumbra_.
Inside the penumbra is the crisper edge or the _umbra_ of the earth's shadow.

Where and when the eclipse is seen from earth obviously depends on the moon being visible above the horizon.
This can be shown on a map that takes into account the rotation of the earth allowing different regions to see the eclipse at different times.

^^^elm v=(eclipse Equirectangular 0 0 True)^^^

Viewing a phenomenon at this scale is a good way of appreciating the effect of different map projections on those regions able to see some or all of the eclipse.

Here are the same regions shown with Orthographic (left), Stereographic (middle) and Transverse Mercator projections.

^^^elm v=[(eclipse Orthographic 0 -15 False ),(eclipse Stereographic 40 -30 False),(eclipse TransverseMercator 0 -15 False )]^^^

And here is the effect of rotating the centre of a sterographic projection by 0, 20 and 40 degrees of longitude:

^^^elm v=[(eclipse Stereographic 0 0 False),(eclipse Stereographic 20 0 False),(eclipse Stereographic 40 0 False)]^^^

The same rotations, but applied to the Transverse Mercator projection:

^^^elm v=[(eclipse TransverseMercator 0 0 False),(eclipse TransverseMercator 20 0 False),(eclipse TransverseMercator 40 0 False)]^^^

And finally, a rotation of the conic Albers projection by 0, 40 an 80 degrees of latitude:

^^^elm v=[(eclipse Albers 0 0 False),(eclipse Albers 0 40 False),(eclipse Albers 0 80 False)]^^^

```elm {l=hidden}
import VegaLite exposing (..)


eclipse : Projection -> Float -> Float -> Bool -> Spec
eclipse proj lonRotate latRotate showLabels =
    let
        ( w, h ) =
            case proj of
                Equirectangular ->
                    ( 520, 250 )

                _ ->
                    ( 150, 150 )

        labelData =
            dataFromColumns []
                << dataColumn "label" (Strings [ "No eclipse visible", "Eclipse at moonrise", "All eclipse visible", "Eclipse at moonset", "p1", "p4", "u4", "u3", "u2", "u1", "p1", "p4", "u4", "u3", "u2", "u1" ])
                << dataColumn "lon" (Numbers [ -122, -46, 58, 155, -175, -70, -52, -33, -10, 8, 25, 90, 108, 126, 149, 167 ])
                << dataColumn "lat" (Numbers [ -35, -35, -35, -35, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ])

        pDetails =
            [ width w, height h, projection [ PType proj, PRotate lonRotate latRotate 0 ] ]

        countrySpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl "data/world-110m.json" [ TopojsonFeature "countries1" ]
                       , mark Geoshape [ MStroke "white", MFill "black", MStrokeWidth 0.1, MFillOpacity 0.1 ]
                       ]
                )

        umbraSpec =
            let
                trans =
                    transform << filter (FExpr "datum.id != 'p1' && datum.id != 'p4'")
            in
            asSpec
                (pDetails
                    ++ [ dataFromUrl "data/eclipse.json" [ TopojsonFeature "eclipse" ]
                       , trans []
                       , mark Geoshape [ MStroke "#00a2f3", MFill "#00a2f3", MFillOpacity 0.1 ]
                       ]
                )

        penumbraSpec =
            let
                trans =
                    transform << filter (FExpr "datum.id === 'p1' || datum.id == 'p4'")
            in
            asSpec
                (pDetails
                    ++ [ dataFromUrl "data/eclipse.json" [ TopojsonFeature "eclipse" ]
                       , trans []
                       , mark Geoshape [ MStrokeOpacity 0, MFill "#003", MFillOpacity 0.1 ]
                       ]
                )

        labelSpec =
            let
                enc =
                    encoding
                        << position Longitude [ PName "lon" ]
                        << position Latitude [ PName "lat" ]
                        << text [ TName "label", TmType Nominal ]
                        << size [ MNumber 9 ]
                        << color [ MString "#333" ]
            in
            asSpec (pDetails ++ [ labelData [], enc [], mark Text [] ])

        layers =
            if showLabels then
                [ countrySpec, umbraSpec, penumbraSpec, labelSpec ]
            else
                [ countrySpec, umbraSpec, penumbraSpec ]
    in
    toVegaLite
        [ configure (configuration (View [ Stroke Nothing ]) [])
        , layer layers
        ]
```
