---
id: "litvis"
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

@import "../css/tutorial.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

_This is one of a series of 'geo' tutorials for use with litvis._

1.  [geospatial File Formats](geoFormats.md)
2.  **Generating Global Map Projection Geo Files**
3.  [Importing geographic datasets into elm-vegalite](geoImporting.md)
4.  [Importing and displaying OpenStreetMap data](openstreetmap.md)

---

# Generating Global Map Projection Geo Files

This tutorial shows how you can explore the distortion effects of different map projections by generating graticule, circle and Tissot files and then viewing them with elm-vegalite in a litvis document.

## 0. Setup

If you haven't already [set up your system to import geographic data](importingGeo.md), you will need to install the following in order to generate the input files we will be using.

Open a terminal or shell window and type the following:

```bash
npm install -g  ndjson-cli topojson d3-geo
```

For details of what `d3-geo` provides, see the [d3-geo documentation](https://github.com/d3/d3-geo).

To keep things flexible, we'll also define a `path` function in Elm pointing to the base directory where all data for this tutorial are stored. You can leave the default as shown below to load the data from the giCentre data repository or replace it with a local folder if you have your own copy of the data.

```elm {l}
path : String -> String
path fileName =
    "https://gicentre.github.io/data/geoTutorials/" ++ fileName
```

## 1. Generate a graticule file

The lines of longitude (running north-south from pole to pole) and the latitude (running east-west) form a grid or _graticule_ that we can use to view the globe as it is projected onto a 2d plane.
We can use d3 to generate the graticule for us and convert it into a topoJSON file for display:

```bash
echo "{}"  \
  | ndjson-map -r d3 'd3.geoGraticule()()' \
  | geo2topo graticule="-" \
  > data/graticule.json
```

This will generate a graticule at the default resolution of 10 degrees (i.e. lines of latitude and longitude are each 10 degrees apart).

We can view the file, along with contextual country outlines with some simple elm-vegalite:

```elm {l v s}
graticule : Spec
graticule =
    let
        graticuleSpec =
            asSpec
                [ projection [ prType equirectangular ]
                , dataFromUrl (path "graticule.json") [ topojsonMesh "graticule" ]
                , geoshape [ maStroke "black", maStrokeWidth 0.1 ]
                ]

        countrySpec =
            asSpec
                [ projection [ prType equirectangular ]
                , dataFromUrl (path "world-110m.json") [ topojsonFeature "countries1" ]
                , geoshape [ maStroke "white", maFill "black", maStrokeWidth 0.1, maFillOpacity 0.1 ]
                ]
    in
    toVegaLite
        [ width 500
        , height 250
        , configure (configuration (coView [ vicoStroke Nothing ]) [])
        , layer [ graticuleSpec, countrySpec ]
        ]
```

You can generate graticules at arbitrary resolutions by parameterising `d3.geoGraticule`, for example:

```bash
echo "{}"  \
  | ndjson-map -r d3 'd3.geoGraticule().step([15,30])()' \
  | geo2topo graticule="-" \
  > data/graticule30.json
```

```elm {v s}
graticule : Spec
graticule =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        graticuleSpec =
            asSpec
                [ projection [ prType equirectangular ]
                , dataFromUrl (path "graticule30.json") [ topojsonMesh "graticule" ]
                , geoshape [ maStroke "black", maStrokeWidth 0.1 ]
                ]

        countrySpec =
            asSpec
                [ projection [ prType equirectangular ]
                , dataFromUrl (path "world-110m.json") [ topojsonFeature "countries1" ]
                , geoshape [ maStroke "white", maFill "black", maStrokeWidth 0.1, maFillOpacity 0.1 ]
                ]
    in
    toVegaLite [ width 500, height 250, cfg [], layer [ graticuleSpec, countrySpec ] ]
```

For other options for customising graticule generation, see the [geoGraticule documentation](https://github.com/d3/d3-geo/blob/master/README.md#geoGraticule).

## 2. Generating Small Circles

A _great circle_ on a sphere is any circle whose centre is also the centre of the sphere. For example, the equator or any circle crossing both poles along lines of longitude. Any other circle on a sphere is a known as _small circle_ and is useful in representing a fixed distance away from a point (at the small circle's centre).

d3's `geoCircle` function can be used to generate small circles centred at any location on the globe with any radius. The following, for example, generates a circle of 30 degrees radius centred on Paris by providing a two-element array of Paris's longitude and latitude:

```bash
echo "{}"  \
  | ndjson-map -r d3 'd3.geoCircle().radius(30).center([2.35,48.86])()' \
  | geo2topo parisCircle="-" \
  > data/paris.json
```

<details><summary>click to see code</summary>

```elm {l}
type alias Proj =
    ( VLProperty, Spec )


paris : String -> Proj -> Spec
paris projName proj =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        pDetails =
            [ width 300, height 200, proj ]

        graticuleSpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl (path "graticule.json") [ topojsonMesh "graticule" ]
                       , geoshape [ maStroke "black", maFilled False, maStrokeWidth 0.1 ]
                       ]
                )

        countrySpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl (path "world-110m.json") [ topojsonFeature "countries1" ]
                       , geoshape [ maStroke "white", maFill "black", maStrokeWidth 0.1, maFillOpacity 0.1 ]
                       ]
                )

        circleSpec =
            asSpec
                (pDetails
                    ++ [ dataFromUrl (path "paris.json") [ topojsonFeature "parisCircle" ]
                       , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.3 ]
                       ]
                )
    in
    toVegaLite
        [ title (projName ++ " projection") []
        , cfg []
        , layer [ graticuleSpec, countrySpec, circleSpec ]
        ]
```

</details>

^^^elm v=(paris "Equirectangular" (projection [ prType equirectangular ]))^^^

Note how the small circle is no longer circular when projected onto a plane. We can see the distortion effect by viewing the same circle with different map projections

^^^elm v=(paris "Albers" (projection [ prType albers ]))^^^
^^^elm v=(paris "Conic equal area" (projection [ prType conicEqualArea ]))^^^

^^^elm v=(paris "Orthographic" (projection [ prType orthographic, prRotate 0 -30 0 ]))^^^
^^^elm v=(paris "Azimuthal equal area" (projection [ prType azimuthalEqualArea ]))^^^

^^^elm v=(paris "Stereographic" (projection [ prType stereographic ]))^^^
^^^elm v=(paris "Gnomonic" (projection [ prType gnomonic, prClipAngle (Just 70) ]))^^^

^^^elm v=(paris "Mercator" (projection [ prType mercator ]))^^^
^^^elm v=(paris "Transverse Mercator" (projection [ prType transverseMercator ]))^^^

## 3. Generate a Tissot's Indicatrix file.

The example of the single small circle above shows that a circle is a useful visual indicator of distortion as we have a clear 'reference' with which to compare distorted shapes. We can project small circles at regular intervals across the globe to gain a more systematic impression of distortion. _Tissot's indicatrices_ are defined as circles of infinitesimal diameter that are projected from geographical (longitude, latitude) space to projected space. We can simulate Tissot's indicatrices by generating a geoJSON object containing a grid of small circles:

<details><summary>click to see Tissot generating code</summary>

```elm {l}
range : Float -> Float -> Float -> List Float
range mn mx step =
    List.range 0 ((mx - mn) / step |> round) |> List.map (\x -> mn + (toFloat x * step))


tissot : Float -> Geometry
tissot gStep =
    let
        degToRad15 x =
            15 * degToRad (toFloat x)

        degToRad x =
            x * pi / 180

        radToDeg x =
            x * 180 / pi

        rnd x =
            (x * 10 |> round |> toFloat) / 10

        circle cLng cLat r =
            let
                circ i =
                    let
                        lat =
                            cLat + radToDeg (degToRad r * cos (degToRad15 i))
                    in
                    ( cLng + radToDeg (degToRad r / cos (degToRad lat) * sin (degToRad15 i)), rnd lat |> rnd )
            in
            List.map circ (List.range 0 24)

        circles lng =
            List.map (\i -> circle lng i 2.5) (range -80 80 20)
    in
    List.map (\lng -> circles lng) (range -180 160 30) |> geoPolygons
```

</details>

```elm {v l s}
tissotMap : Spec
tissotMap =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        proj =
            projection [ prType equirectangular ]

        graticuleSpec =
            asSpec
                [ dataFromUrl (path "graticule.json") [ topojsonMesh "graticule" ]
                , proj
                , geoshape [ maStroke "black", maStrokeWidth 0.2 ]
                ]

        tissotSpec =
            asSpec
                [ dataFromJson (geometry (tissot 30) []) []
                , proj
                , geoshape [ maStroke "#00a2f3", maStrokeWidth 0.5, maFill "#00a2f3", maFillOpacity 0.1 ]
                ]

        countrySpec =
            asSpec
                [ dataFromUrl (path "world-110m.json") [ topojsonFeature "countries1" ]
                , proj
                , geoshape [ maStroke "white", maFill "black", maStrokeWidth 0.1, maFillOpacity 0.1 ]
                ]
    in
    toVegaLite [ width 500, height 250, cfg [], layer [ graticuleSpec, tissotSpec, countrySpec ] ]
```

> TODO: Can we pass d3 iterable actions into the command line tool rather than relying on elm code?
