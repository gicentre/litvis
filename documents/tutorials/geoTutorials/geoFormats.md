---
id: "litvis"
elm:
    dependencies:
        gicentre/elm-vega: latest
---

@import "../css/tutorial.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

_This is one of a series of 'geo' tutorials for use with litvis._

1.  **Geospatial File Formats**
2.  [Generating Global Map Projection Geo Files](geoGenerating.md)
3.  [Importing geographic datasets into elm-vega](geoImporting.md)

---

# Geospatial File Formats

Geospatial features can be represented either with conventional (x,y) coordinates or with 'speherical' longitude, latitude angles.
While the planar (x,y) coordinate system is simpler and probably more familiar, it provides a poor representation of larger regions of the earth where its spheroidal shape cannot be accurately represented as a flat surface.
This tutorial considers the [geoJson](http://geojson.org) and [topoJson](https://github.com/topojson/topojson/wiki) file formats that can be used for more faithful representation of geographic data.

## 1. Planar and Spherical Coordinates

Let's first consider how we might represent a broadly rectangular region with simple (x,y) coordinates.

```elm {l}
myRegion : List DataColumn -> Data
myRegion =
    dataFromColumns []
        << dataColumn "order" (nums [ 1, 2, 3, 4, 5 ])
        << dataColumn "easting" (nums [ -3, 4, 4, -3, -3 ])
        << dataColumn "northing" (nums [ 52, 52, 45, 45, 52 ])
```

Note that we need to provide an `order` field to define the order in which the coordinates representing each point of the boundary are to be linked with a line mark.
Note also that while the region has only 4 corners, we provide 5 sets of coordinate pairs, the last one matching the first one to _close_ the shape.

With the boundary region defined we can encode it as a `line` mark using the `X` and `Y` `position` channels:

```elm {l v s}
planar : Spec
planar =
    let
        enc =
            encoding
                << position X [ pName "easting", pMType Quantitative, pScale [ scZero False ] ]
                << position Y [ pName "northing", pMType Quantitative, pScale [ scZero False ] ]
                << order [ oName "order", oMType Ordinal ]
    in
    toVegaLite [ myRegion [], enc [], line [] ]
```

But if those `easting` and `northing` values represent longitude and latitude, have we produced a sufficiently accurate two-dimensional visual representation of what is a three-dimensional portion of the earth's surface?

Here's the representation assuming spherical coordinates, noting that we are now encoding the position coordinates with `Longitude` and `Latitude` types rather than the Cartesian `X` and `Y` types.

```elm {v l s}
geo : Spec
geo =
    let
        proj =
            projection [ prType Orthographic ]

        enc =
            encoding
                << position Longitude [ pName "easting", pMType Quantitative ]
                << position Latitude [ pName "northing", pMType Quantitative ]
                << order [ oName "order", oMType Ordinal ]
    in
    toVegaLite [ width 250, height 250, myRegion [], proj, enc [], line [] ]
```

The `Orthographic` map projection used above gives a more accurate indication of the east-west distances of region's corners, here demonstrating the northern boundary is shorter than the southern one.
Viewing it in a global context makes it clearer why this is the case:

```elm {v l=hidden}
globe : Spec
globe =
    let
        pDetails =
            [ width 250, height 250, projection [ prType Orthographic, prRotate 0 -15 0 ] ]

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
                    ++ [ dataFromUrl (path "topoJson1.json") [ topojsonMesh "myRegion" ]
                       , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.3 ]
                       ]
                )
    in
    toVegaLite
        [ configure (configuration (coView [ vicoStroke Nothing ]) [])
        , layer [ graticuleSpec, countrySpec, circleSpec ]
        ]
```

We have established that there can be good reason to represent geographic regions with spherical coordinates.
But how do we represent boundaries more complex than simple squares?
This is where the 'geoJSON' and 'topoJSON' file formats are useful.

## 2. Simple Geometry Files

Let's first consider the [geoJson](http://geojson.org) file format which is commonly used for representing geo data.
The simple rectangle above can be represented by the following geoJSON file:

```Javascript
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [ [-3, 52], [4, 52], [4, 45], [-3, 45], [-3, 52] ]
    ]
  }
}
```

Again, we see the 5 coordinate pairs representing the points along the region's boundary including a duplicated first and last point to close the region.
GeoJSON files can represent a range of geometry types such as individual points, lines, complex polygons with holes and islands as well as collections of these features.
But for the moment let's just stick with the simple polygon.

To display the file, simply load it as any normal data file and encode it with the `geoshape` function.

To keep things flexible, we'll define a `path` function in Elm pointing to the base directory where all data are stored.
You can leave the default as shown below to load the data from the giCentre data repository or replace it with a local folder if you have your own copy of the data.

```elm {l}
path : String -> String
path fileName =
    "https://gicentre.github.io/data/geoTutorials/" ++ fileName
```

```elm {s l v}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "geoJson1.json") []
        , projection [ prType Orthographic ]
        , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.5 ]
        ]
```

Notice that not only is the `geoshape` a more concise specification than the region boundary as a `line`, but also the bounding lines themselves are not straight, more accurately reflecting the projection from the sphere onto the plane.

As we shall see, larger geo data are more efficiently stored not as geoJSON, but as [topoJson](https://github.com/topojson/topojson/wiki) files.
These store the same geometric information as their geoJSON counterparts but addtionally represent the _topology_ of the features.
Here is the equivalent topoJSON file representing the geoJSON above:

```Javascript
{
  "type": "topology",
  "objects": {
    "myRegion": {
      "type": "Polygon",
      "arcs": [ [0] ]
    }
  },
  "arcs": [
    [ [-3, 52], [4, 52], [4, 45], [-3, 45], [-3, 52] ]
  ]
}
```

Similarly, we can display this file directly in elm-vega with `geoshape`.
Because topojson files can contain many `objects`, we have to specify which object we are loading (in this case `myRegion`).
Objects themselves can be treated either as _meshes_ or _features_.
A `topojsonMesh` treats the entire object as a single entity and is quicker to render.
On the other hand a `topojsonFeature` allows individual features within the object to be handled separately.
In this simple example, we can store the object as a `topojsonMesh`:

```elm {s l}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson1.json") [ topojsonMesh "myRegion" ]
        , projection [ prType Orthographic ]
        , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.5 ]
        ]
```

But why do we use a topoJSON file rather than what looks like a simpler geoJSON file?
The answer is clearer if we consider a file representing two adjacent regions:

```elm {s v l=hidden}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson2.json") [ topojsonFeature "myRegions" ]
        , projection [ prType Orthographic ]
        , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.5 ]
        ]
```

Here is its geoJSON representation:

```Javascript
{
  "type": "FeatureCollection",
  "features": [{
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 52], [4, 52], [4, 45], [-3, 45], [-3, 52] ]
        ]
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 59], [4, 59], [4, 52], [-3, 52], [-3, 59] ]
        ]
      }
    }
  ]
}
```

This file contains not one but two `Polygon` features.
Both are nested within an outer `features` array which in this case contains two elements, but could contain many more.
Notice how the common edge between these two adjacent regions is duplicated (the boundary between (-3,52) and (4,52)).
In this case that duplication isn't a big problem, but imagine that boundary was a complex meandering line with many hundreds of coordinate pairs.

The topoJSON format instead stores all boundaries as distinct _arcs_ that are then resassembled to form area boundaries.
If more than one feature shares a common arc, it is only stored once:

```javascript
{
  "type": "topology",
  "objects": {
    "myRegions": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "arcs": [ [0, 1] ]
      }, {
        "type": "Polygon",
        "arcs": [ [-1, 2] ]
      }]
    }
  },
  "arcs": [
    [ [-3, 52], [4, 52] ],
    [ [ 4, 52], [ 4, 45], [-3, 45], [-3, 52] ],
    [ [-3, 52], [-3, 59], [ 4, 59], [ 4, 52] ]
  ]
}
```

The arcs are referenced by their array position (0, 1 and 2 in this example) to form the two polygons.

_Why do you think arc 1 is referenced by `-1` rather than `1` for the second polygon?
Try drawing out the vertices, boundary lines and regions if you are not sure._

## 3. Feature IDs

So far we have only considered the geometry of features.
Each feature can addtionally have an `id` that stores some property to be associated with the feature, for example a country name, or population count.

Keeping with our simple two-region example, let's attach a text `id` with each of the features (in the objects placed in the `geometries` array):

```Javascript
{
  "type": "topology",
  "objects": {
    "myRegions": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "arcs": [ [0, 1] ],
        "id" : "southern region"
      }, {
        "type": "Polygon",
        "arcs": [ [-1, 2] ],
        "id" : "northern region"
      }]
    }
  },
  "arcs": [
    [ [-3, 52], [4, 52] ],
    [ [ 4, 52], [ 4, 45], [-3, 45], [-3, 52] ],
    [ [-3, 52], [-3, 59], [ 4, 59], [ 4, 52] ]
  ]
}
```

We can now encode the `id` in its visualization specification:

```elm {s l v}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson3.json") [ topojsonFeature "myRegions" ]
        , projection [ prType Orthographic ]
        , encoding (color [ mName "id", mMType Nominal ] [])
        , geoshape []
        ]
```

## 4. Feature Properties

The `id` is a useful and concise way of identifying a single property in a topoJSON file, but only one `id` is permitted for each feature.
TopoJSON and GeoJSON files that need to store multiple attributes for each feature may store `properties` objects that can have any number of json objects associated with them.
Here is an example of our two-region topoJSON file where each feature contains no `id` but instead the properties `myRegionName` and `myPopulationCount`:

```Javascript
{
  "type": "topology",
  "objects": {
    "myRegions": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "properties": {
            "myRegionName": "southern region",
            "myPopulationCount": 27000,
          },
        "arcs": [ [0, 1] ]
      }, {
        "type": "Polygon",
        "properties": {
            "myRegionName": "northern region",
            "myPopulationCount": 18000,
          },
        "arcs": [ [-1, 2] ]
      }]
    }
  },
  "arcs": [
    [ [-3, 52], [4, 52] ],
    [ [ 4, 52], [ 4, 45], [-3, 45], [-3, 52] ],
    [ [-3, 52], [-3, 59], [ 4, 59], [ 4, 52] ]
  ]
}
```

We can access any of the properties by using dot notation to identify nested json elements.
For example to access `myRegionName` for each feature we would use `properties.myRegionName` in its specification instead of `id`.
Below we access all instances of the `myPopulationCount` property to colour each feature:

```elm {s l v}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson4.json") [ topojsonFeature "myRegions" ]
        , projection [ prType Orthographic ]
        , encoding (color [ mName "properties.myPopulationCount", mMType Quantitative ] [])
        , geoshape []
        ]
```

## 5. Complex Geometry

So far the features we have considered have been 'simple polygons', i.e. each polygon is defined by a single ring of coordinates.
Features can be more complex than this though, for example, a single feature might be made up of a collection of simple polygons in a geoJSON file:

```Javascript
{
  "type": "FeatureCollection",
  "features": [{
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 52], [4, 52], [4, 45], [-3, 45], [-3, 52] ]
        ]
      },
      "properties": {"myRegionName": "southern region"}
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 59], [ 4, 59], [ 4, 52], [-3, 52], [-3, 59] ],
          [ [-6, 58], [-4, 58], [-4, 56], [-6, 56], [-6, 58] ]
        ]
      },
      "properties": {"myRegionName": "northern region"}
    }
  ]
}
```

Notice that the coordinates array for the northern region now contains two elements, each of which is a ring of 5 coordinate pairs.
Its equivalent topoJSON file looks like this:

```Javascript
{
  "type": "topology",
  "objects": {
    "myRegions": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "arcs": [ [0, 1] ],
        "properties": { "myRegionName": "southern region" }
      }, {
        "type": "Polygon",
        "arcs": [ [-1, 2], [3] ],
        "properties": { "myRegionName": "northern region" }
      }]
    }
  },
  "arcs": [
    [ [-3, 52], [ 4, 52] ],
    [ [ 4, 52], [ 4, 45], [-3, 45], [-3, 52] ],
    [ [-3, 52], [-3, 59], [ 4, 59], [ 4, 52] ],
    [ [-6, 58], [-4, 58], [-4, 56], [-6, 56], [-6, 58] ]
  ]
}
```

We can display topojson in much the same way as for the simple polygons:

```elm {s l v}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson5.json") [ topojsonFeature "myRegions" ]
        , projection [ prType Orthographic ]
        , encoding (color [ mName "properties.myRegionName", mMType Nominal ] [])
        , geoshape []
        ]
```

Finally, it is possible to have 'holes' within polygons and even 'islands' within those holes in cases where one polygon ring is within another.
Here is the geoJSON that defines two further rings within the southern region.
Note that in order to specify a hole, the order of coordinates is anti-clockwise whereas the outer ring and inner island, bounding 'positive' areas are in clockwise order.

```Javascript
{
  "type": "FeatureCollection",
  "features": [{
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 52], [ 4, 52], [4, 45], [-3, 45], [-3, 52] ],
          [ [-1, 50], [-1, 47], [2, 47], [ 2, 50], [-1, 50] ],
          [ [ 0, 49], [ 1, 49], [1, 48], [ 0, 48], [ 0, 49] ]
        ]
      },
      "properties": {"myRegionName": "southern region"}
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [ [-3, 59], [ 4, 59], [ 4, 52], [-3, 52], [-3, 59] ],
          [ [-6, 58], [-4, 58], [-4, 56], [-6, 56], [-6, 58] ]
        ]
      },
      "properties": {"myRegionName": "northern region"}
    }
  ]
}
```

The topojson equivalent is much as we have seen before, but now incorporating the two extra rings:

```Javascript
{
  "type": "topology",
  "objects": {
    "myRegions": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "arcs": [ [0, 1], [2], [3] ],
        "properties": { "myRegionName": "southern region" }
      }, {
        "type": "Polygon",
        "arcs": [ [-1, 4], [5]],
        "properties": { "myRegionName": "northern region" }
      }]
    }
  },
  "arcs": [
    [ [-3, 52], [ 4, 52] ],
    [ [ 4, 52], [ 4, 45], [-3, 45], [-3, 52] ],
    [ [-1, 50], [-1, 47], [ 2, 47], [ 2, 50], [-1, 50] ],
    [ [ 0, 49], [ 1, 49], [ 1, 48], [ 0, 48], [ 0, 49] ],
    [ [-3, 52], [-3, 59], [ 4, 59], [ 4, 52] ],
    [ [-6, 58], [-4, 58], [-4, 56], [-6, 56], [-6, 58] ]
  ]
}
```

```elm {s v}
geo : Spec
geo =
    toVegaLite
        [ width 200
        , height 200
        , dataFromUrl (path "topoJson6.json") [ topojsonFeature "myRegions" ]
        , projection [ prType Orthographic ]
        , encoding (color [ mName "properties.myRegionName", mMType Nominal ] [])
        , geoshape []
        ]
```

## 6. Creating JSON files programatically

In all the examples above the topoJSON and geoJSON has been read from external files.
This is likely the most common use-case, but sometimes it can be useful to generate the content programmtically.
This can be achieved using elm-vega's [dataFromJson](http://package.elm-lang.org/packages/gicentre/elm-vega/latest/VegaLite#dataFromJson) and supplying it with a `geometry` function.
Here, for example, is a simple rectangular feature (equivalent to `geoJson1.json` above) generated programmatically:

```elm {s l}
geo : Spec
geo =
    let
        geojson =
            geometry (geoPolygon [ [ ( -3, 59 ), ( 4, 59 ), ( 4, 52 ), ( -3, 52 ), ( -3, 59 ) ] ]) []
    in
    toVegaLite
        [ width 200
        , height 200
        , dataFromJson geojson []
        , projection [ prType Orthographic ]
        , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.5 ]
        ]
```

More complex features can be built up by assembling `geometry` specs as a `geoFeatureCollection`:

```elm {s l v}
geo : Spec
geo =
    let
        geojson =
            geoFeatureCollection
                [ geometry (geoPoint 5 55) []
                , geometry
                    (geoPolygons
                        [ [ [ ( -3, 52 ), ( 4, 52 ), ( 4, 45 ), ( -3, 45 ), ( -3, 52 ) ]
                          , [ ( -3, 59 ), ( 4, 59 ), ( 4, 52 ), ( -3, 52 ), ( -3, 59 ) ]
                          ]
                        , [ [ ( -7, 58 ), ( -5, 58 ), ( -5, 56 ), ( -7, 56 ), ( -7, 58 ) ] ]
                        ]
                    )
                    []
                ]
    in
    toVegaLite
        [ width 200
        , height 200
        , dataFromJson geojson []
        , projection [ prType Orthographic ]
        , geoshape [ maStroke "#00a2f3", maFill "#00a2f3", maFillOpacity 0.5 ]
        ]
```

Feature properties can be added to the last parameter of each `geometry` call and are expressed as a list of key, value pairs in the same way as they are when calling `dataRow`.
For example:

```elm {s l v}
geo : Spec
geo =
    let
        geojson =
            geoFeatureCollection
                [ geometry (geoPolygon [ [ ( -3, 52 ), ( 4, 52 ), ( 4, 45 ), ( -3, 45 ), ( -3, 52 ) ] ]) [ ( "myRegionName", str "Southern region" ) ]
                , geometry (geoPolygon [ [ ( -3, 59 ), ( 4, 59 ), ( 4, 52 ), ( -3, 52 ), ( -3, 59 ) ] ]) [ ( "myRegionName", str "Northern region" ) ]
                ]
    in
    toVegaLite
        [ width 200
        , height 200
        , dataFromJson geojson [ jsonProperty "features" ]
        , projection [ prType Orthographic ]
        , encoding (color [ mName "properties.myRegionName", mMType Nominal ] [])
        , geoshape []
        ]
```

### Programatically Generated Graticule

Generating geo data programmatically allows us to create features that contain regular structures quite easily.
The following creates a graticule (lines of longitude and latitude):

```elm {l}
range : Float -> Float -> Float -> List Float
range mn mx step =
    List.range 0 ((mx - mn) / step |> round) |> List.map (\x -> mn + (toFloat x * step))


graticule : Float -> Geometry
graticule gStep =
    let
        meridian lng =
            if round lng % 90 == 0 then
                List.map (\lat -> ( lng, lat )) (range -90 90 (min 10 gStep))
            else
                List.map (\lat -> ( lng, lat )) (range (gStep - 90) (90 - gStep) (min 5 gStep))

        parallel : Float -> List ( Float, Float )
        parallel lat =
            List.map (\lng -> ( lng, lat )) (range -180 180 (min 10 gStep))
    in
    geoLines (List.map parallel (range (gStep - 90) (90 - gStep) gStep) ++ List.map meridian (range -180 180 gStep))
```

```elm {s l v}
geo : Spec
geo =
    toVegaLite
        [ configure (configuration (coView [ vicoStroke Nothing ]) [])
        , width 200
        , height 200
        , dataFromJson (geometry (graticule 10) []) []
        , projection [ prType Orthographic, prRotate 5 -30 0 ]
        , geoshape [ maStrokeWidth 0.2, maFilled False ]
        ]
```

### Programatically Generated Tissot's Indicatrices

We can add a grid of small circles to simulate _Tissot's Indicatrices_ for showing local map projection distortion properties:

```elm {l}
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
                    ( rnd <| cLng + radToDeg (degToRad r / cos (degToRad lat) * sin (degToRad15 i)), rnd lat )
            in
            List.map circ (List.range 0 24)

        circles lng =
            List.map (\i -> circle lng i 5) (range -80 80 20)
    in
    geoPolygons <| List.map (\lng -> circles lng) (range -180 160 30)
```

```elm {s l v}
geo : Spec
geo =
    let
        proj =
            projection [ prType Orthographic, prRotate 45 -30 0 ]

        specGraticule =
            asSpec
                [ dataFromJson (geometry (graticule 10) []) []
                , proj
                , geoshape [ maStrokeWidth 0.2, maFilled False ]
                ]

        specTissot =
            asSpec
                [ dataFromJson (geometry (tissot 30) []) []
                , proj
                , geoshape [ maStroke "#00a2f3", maStrokeWidth 0.5, maFill "#00a2f3", maFillOpacity 0.1 ]
                ]
    in
    toVegaLite
        [ configure (configuration (coView [ vicoStroke Nothing ]) [])
        , width 400
        , height 400
        , layer [ specGraticule, specTissot ]
        ]
```
