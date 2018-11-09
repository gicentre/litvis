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

1.  [Geospatial File Formats](geoFormats.md)
2.  [Generating Global Map Projection Geo Files](geoGenerating.md)
3.  **Importing geographic datasets into elm-vegalite**

---

# Importing geographic datasets into elm-vegalite

This tutorial leads you through the workflow for importing spatial datasets into elm-vegalite, and therefore into litvis documents.
If the dataset you wish to import is a shapefile, the process involves the following steps (and if it is already in geoJSON format, just jump to step 3).

- Change the shapefile's projection to use longitude/latitude coordinates with the WGS84 ellipsoid.
- Convert the shapefile into a [geoJSON](http://geojson.org) file.
- Identify the attribute field you wish to store and associate it with an id.
- Convert from geoJSON to [topoJSON](https://github.com/topojson/topojson).
- Simplify geometry to reduce file size
- render file with elm-vegalite

_For related tutorials, see Mike Bostock's series [Command-Line Cartography](https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c) and Ændrew Rininsland's [Creating topoJSON using D3 v4](https://medium.com/@aendrew/creating-topojson-using-d3-v4-10838d1a9538) and for a thorough more London-centric example, Max Harlow's [Working with geographic data](https://github.com/maxharlow/tutorials/tree/master/working-with-geographical-data) tutorial._

## 0. Setup

Some of these steps involve using [Geospatial Abstraction Data Library (gdal)](http://www.gdal.org) and some d3 command line programs, so as a one-off setup stage you need to install the following with [homebrew](https://brew.sh) and [npm](https://docs.npmjs.com/getting-started/installing-node) (if you don't have them installed, do so first).

Open a terminal and install the relevant packages with the following

[comment]: # "Don't need  `d3-geo-projection` as we use gdal instead for projection, which offers a more comprehensive set of transformations that account for ellipsoids."

```bash
brew install gdal
npm install -g shapefile ndjson-cli topojson d3-geo-centroid
```

The `-g` option ensures the installed packages are available globally from any directory.
The `gdal` package will be used for the map projection work; `shapefile` for the conversion from shapefile to geoJSON; `ndjson-cli` splits JSON files into separate lines to ease processing; `topojson` does the conversion to topoJSON and the topology-preserving simplification; and `d3-geo-centroid` is used for generating centroid locations from polygons.

To keep things flexible, we'll also define a `path` function in Elm pointing to the base directory where all data for this tutorial are stored.
You can leave the default as shown below to load the data from the giCentre data repository or replace it with a local folder if you have your own copy of the data.

```elm {l}
path : String -> String
path fileName =
    "https://gicentre.github.io/data/geoTutorials/" ++ fileName
```

## 1. Reproject the shapefile to use longitude/latitude with WGS84

_If your data already use longitude/latitude with WGS84, you can skip this step._

Download the shapefiles, noting that you will need the geometry (_something_.shp), attribute (_something_.dbf) and index (_something_.shx) and projection (_something_.prj) files.
For this tutorial we will use `London_Borough_Excluding_MHW` from the [London Data Store](https://data.london.gov.uk/dataset/statistical-gis-boundary-files-london).

As part of the conversion we will convert the geometry from the projected coordinates it currently uses into 'unprojected' longitude/latitude spherical coordinates.
This requires us to know what the projection the source data are using.
Typically a shapefile collection will come with a `.proj` file that will contain the projection information.
We need to provide these projection parameters to `gdal`, but thankfully most standard projections have a [EPSG code](http://epsg.io) referencing this information which we can pass to the converter.
In our case the data use the Ordnance Survey National Grid with an [EPSG of 27700](http://epsg.io/27700).
The EPSG code for unprojected longitude/latitude using the WGS84 ellipsoid is [4326](http://epsg.io/4326).

To convert the shapefile, open a terminal and `cd` to the folder containing the downloaded shapefiles, then type

```bash
ogr2ogr -t_srs 'EPSG:4326' -s_srs 'EPSG:27700' boroughs_geo.shp London_Borough_Excluding_MHW.shp
```

substituting the name of the input and output .shp files with your own.

## 2. Convert the shapefile to geoJSON.

Type the following:

```bash
shp2json boroughs.shp > boroughs_geo.json
```

While you are getting used to this workflow it can be helpful to append a `_geo` to the output geoJSON file you create here so as not to get confused with the topoJSON file created later (both share the same `.json` file extension).

## 3. Identify the `id` attribute

When we render the data we will need an ID to refer to each spatial feature within the dataset (boroughs in our case).
GeoJSON and topoJSON files can have an optional `id` for each feature which we need to add as part of our workflow.
The original shape file should have had one or more attributes associated with each feature and these get transferred to the geoJSON as 'properties'.
You can see these properties by viewing the .json file in a text editor.
Choose the property you wish to make the id and then type the following:

```bash
ndjson-split 'd.features' < boroughs_geo.json > boroughs_geo.ndjson
ndjson-map 'd.id = d.properties.NAME, delete d.properties, d' < boroughs_geo.ndjson > boroughs_id_geo.ndjson
ndjson-reduce < boroughs_id_geo.ndjson | ndjson-map '{type: "FeatureCollection", features: d}' > boroughs_id_geo.json
```

replacing `NAME` with the name of the attribute property you wish to become the ID (in this London boroughs example, the property is actually called `NAME`, representing the name of each borough).

The first line splits the geoJSON file so that each feature (borough boundary in this example) is on its own line in the file.
The second line selects a property and adds it as an `id` to each line while deleting the other properties as they are no longer needed.
The third line converts the split feature-per-line file back into a geoJSON file with the new `id` as well as the original properties.

Note that if you wish to do more complex data manipulation such as combining attributes from multiple files or calculating new feature attributes, it is on these feature-per-line `ndjson` files that it is performed. See Mike Bostock's [command line cartography](https://medium.com/@mbostock/command-line-cartography-part-2-c3a82c5c0f3) for examples.

## 4. Convert to topoJSON

GeoJson files store each spatial object as a string of coordinates tracing its boundary (or boundaries for complex features).
This is rather inefficient for adjacent areas that share a common boundary and it makes it difficult to infer topological relationships such as adjacency.
By converting to the topoJSON format we can use a much more efficient data structure that stores common boundary lines only once:

```bash
geo2topo boroughs=boroughs_id_geo.json > boroughs_topo.json
```

In this conversion we give a name to the new feature object (here called `boroughs`) that we will reference later in elm-vegalite.

Again, as you are learning to use this workflow, it can be helpful to name the resulting file with `_topo` appended so we know the `.json` file is now in topoJSON, not geoJSON, format.

## 5. Simplify geometry

If you compare the sizes you will see that the topoJSON file is smaller than its geoJSON equivalent thanks to its more efficient data structure.
We can however shrink the file size much more by (i) simplifying complex lines; (ii) reducing the precision with which we store coordinates.
We can do this because our aim is to produce a file for rendering, not accurate geoprocessing.

To simplify the line we need to specify a _threshold_ that determines the degree of simplification.
You can think of this threshold as being the length of line details below which we attempt to make all boundary lines straight.
The larger the threshold, the simpler the boundary lines look.
Because we are dealing with latitude and longitude coordinates, that threshold is expressed as [steradians](https://en.wikipedia.org/wiki/Steradian).
Typically, useful thresholds will be in the order of 1e-9 steradians but it pays to experiment to find a suitable level of simplification.

To reduce the precision of coordinates we use `topoquantize` with a parameter typically of order 1e4 indicating 4 significant digits of precision.

Simplification and quantization can be combined by typing:

```bash
toposimplify -s 1e-9 -f < boroughs_topo.json | topoquantize 1e4 > londonBoroughs.json
```

Notice how this step radically reduces the size of the topoJSON file for complex shapefiles, in this case from 2Mb down to 15k.

### Combining conversion steps

Steps 2 to 5 above have been separated in order to explain the various stages of file conversion.
But the piping model of the d3 programs means that they can be combined into a more compact set of operations that avoid generating the intermediate files.
The following therefore can be used as a compact alternative to all 4 steps:

```bash
shp2json -n boroughs.shp \
  | ndjson-map 'd.id = d.properties.NAME, delete d.properties, d' \
  | geo2topo -q 1e4 -n boroughs="-" \
  | toposimplify -s 1e-9 -f \
  > londonBoroughs.json
```

## 6. Render in elm-vaga

Using the final output file after conversion (here, `londonBoroughs.json`), we can render all features with some simple elm-vegalite:

```elm {l v s}
boroughs : Spec
boroughs =
    toVegaLite
        [ width 600
        , height 400
        , configure
            (configuration
                (coView
                    [ vicoStroke
                        Nothing
                    ]
                )
                []
            )
        , dataFromUrl (path "londonBoroughs.json") [ topojsonFeature "boroughs" ]
        , geoshape []
        , encoding (color [ mName "id", mMType Nominal ] [])
        ]
```

# Generating New Data

We can use the d3 command line tools to generate some additional files that may be useful for rendering.
For example, suppose we wished to create a custom colour scheme to associate with each of the 33 boroughs in the dataset.
In elm-vegalite, custom categorical colours are generated with

```elm
categoricalDomainMap
      [ ( categoryName1, categoryColour1 )
      , ( categoryName2, categoryColour2 )
      , ...
      ]
```

We might generate a list of 33 categorical colours with some external service such [IWantHue](http://tools.medialab.sciences-po.fr/iwanthue).
To generate the equivalent list of category names we need to extract those IDs from the imported dataset, which we can do with

```bash
shp2json -n boroughs.shp | ndjson-map 'd.properties.NAME'
```

This allows us to create the elm-vegalite to generate a custom colour palette for the London map:

```elm {l}
boroughColors : List ScaleProperty
boroughColors =
    categoricalDomainMap
        [ ( "Kingston upon Thames", "#9db7b1" )
        , ( "Croydon", "#d4b4e5" )
        , ( "Bromley", "#afb9cb" )
        , ( "Hounslow", "#b2add6" )
        , ( "Ealing", "#e2f8ca" )
        , ( "Havering", "#a1bde6" )
        , ( "Hillingdon", "#e8aa95" )
        , ( "Harrow", "#8bd0eb" )
        , ( "Brent", "#dfb89b" )
        , ( "Barnet", "#a2e7ed" )
        , ( "Lambeth", "#e3aba7" )
        , ( "Southwark", "#86cbd1" )
        , ( "Lewisham", "#ecb1c2" )
        , ( "Greenwich", "#acd8ba" )
        , ( "Bexley", "#e4bad9" )
        , ( "Enfield", "#9bd6ca" )
        , ( "Waltham Forest", "#cec9f3" )
        , ( "Redbridge", "#c9d2a8" )
        , ( "Sutton", "#d1c1d9" )
        , ( "Richmond upon Thames", "#ddcba2" )
        , ( "Merton", "#a2acbd" )
        , ( "Wandsworth", "#deefd6" )
        , ( "Hammersmith and Fulham", "#b5d7a7" )
        , ( "Kensington and Chelsea", "#f6d4c9" )
        , ( "Westminster", "#add4e0" )
        , ( "Camden", "#d9b9ad" )
        , ( "Tower Hamlets", "#c6e1db" )
        , ( "Islington", "#e0c7ce" )
        , ( "Hackney", "#a6b79f" )
        , ( "Haringey", "#cbd5e7" )
        , ( "Newham", "#c2d2ba" )
        , ( "Barking and Dagenham", "#ebe2cf" )
        , ( "City of London", "#c7bfad" )
        ]
```

Setting the `mScale` to use this list gives us our new colour scheme:

```elm {l v s}
boroughs : Spec
boroughs =
    toVegaLite
        [ width 600
        , height 400
        , configure (configuration (coView [ vicoStroke Nothing ]) [])
        , dataFromUrl (path "londonBoroughs.json") [ topojsonFeature "boroughs" ]
        , geoshape [ maStroke "white", maStrokeWidth 2 ]
        , encoding (color [ mName "id", mMType Nominal, mScale boroughColors ] [])
        ]
```

We can use this approach to extract any of the properties (attributes) from the original shapefile.
For example, the following will extract the name and GSS code of each spatial feature:

```bash
shp2json -n boroughs.shp | ndjson-map '[d.properties.NAME,d.properties.GSS_CODE]'
```

giving

```javascript
    ["Kingston upon Thames","E09000021"]
    ["Croydon","E09000008"]
    ["Bromley","E09000006"]
    ["Hounslow","E09000018"]
    :
    :
```

But suppose we wished to label each borough directly on the map rather than via a colour legend.
We would need to generate a new dataset that contained the label position for each borough.
We can do that by calculating the centroid of each borough polygon using the d3's `geoCentroid()`:

```bash
shp2json -n boroughs.shp \
  | ndjson-map -r d3 'c=d3.geoCentroid(d.geometry),{"name":d.properties.NAME,"cx":c[0],"cy":c[1]}' \
  | ndjson-reduce \
  > londonCentroids.json
```

This generates the following json file which we can load into our visualization to display labels

```javascript
   [{"name":"Kingston upon Thames","cx":-0.28691465719243003,"cy":51.387893353778395},
    {"name":"Croydon","cx":-0.08716546101532906,"cy":51.355317416374},
    {"name":"Bromley","cx":0.051536586180461884,"cy":51.37198402033694},
    {"name":"Hounslow","cx":-0.3671516396902454,"cy":51.46838045919461},
    :
   ]
```

We create two layers, one for the coloured polygons, the other for the name labels placed at centroid locations.
Note also the use of the `transform` to display only the first word in a multi-word borough name.

```elm {l}
boroughsCustom : Float -> Float -> Spec
boroughsCustom w h =
    let
        polyEnc =
            encoding
                << color [ mName "id", mMType Nominal, mScale boroughColors, mLegend [] ]

        polySpec =
            asSpec
                [ dataFromUrl (path "londonBoroughs.json") [ topojsonFeature "boroughs" ]
                , geoshape [ maStroke "white", maStrokeWidth (2 * w / 700) ]
                , polyEnc []
                ]

        labelEnc =
            encoding
                << position Longitude [ pName "cx" ]
                << position Latitude [ pName "cy" ]
                << text [ tName "bLabel", tMType Nominal ]
                << size [ mNum (8 * w / 700) ]
                << opacity [ mNum 0.6 ]

        trans =
            transform
                << calculateAs "indexof (datum.name,' ') > 0  ? substring(datum.name,0,indexof(datum.name, ' ')) : datum.name" "bLabel"

        labelSpec =
            asSpec [ dataFromUrl (path "londonCentroids.json") [], trans [], textMark [], labelEnc [] ]
    in
    toVegaLite
        [ width w
        , height h
        , configure (configuration (coView [ vicoStroke Nothing ]) [])
        , layer [ polySpec, labelSpec ]
        ]
```

```elm {v s}
boroughs : Spec
boroughs =
    boroughsCustom 700 500
```

topoJSON files are not limited to areal units.
Here, for example, we can import a file containing the geographical routes of selected London Underground tube lines.
The conversion of the [tfl_lines.json](https://github.com/oobrien/vis/tree/master/tube/data) follows a similar pattern to the conversion of the borough boundary files, but with some minor differences:

- The file is already in unprojected geoJSON format so does not need reprojecting or conversion from a shapefile.
- `ndjson-cat` converts the original geoJSON file to a single line necessary for further processing.
- the file contains details of more rail lines than we need to map so `ndjson.filter` is used with a regular expression to select data for tube and DLR lines only.
- the property we will use for the id (the tube line name) is inside the first element of an array so we reference it with `[0]` (where there is more than one element in the array it indicates more than one named tube line shares the same physical line).

```bash
ndjson-cat < tfl_lines.json \
  | ndjson-split 'd.features' \
  | ndjson-filter 'd.properties.lines[0].name.match("Ci.*|Di.*|No.*|Ce.*|DLR|Ha.*|Ba.*|Ju.*|Me.*|Pi.*|Vi.*|Wa.*")' \
  | ndjson-map 'd.id = d.properties.lines[0].name,delete d.properties,d' \
  | geo2topo -n -q 1e4 line="-" \
  > londonTubeLines.json
```

We can display the newly created topoJSON file of the tube lines much as we did the original London map:

```elm {l v s}
tubeLines : Spec
tubeLines =
    toVegaLite
        [ width 700
        , height 400
        , dataFromUrl (path "londonTubeLines.json") [ topojsonFeature "line" ]
        , geoshape [ maFilled False ]
        , encoding (color [ mName "id", mMType Nominal ] [])
        ]
```

We can improve the design by thickening the lines, giving them their standard tube line colours and moving the legend to the bottom-right corner:

```elm {l=hidden}
tubeLineColors : List ScaleProperty
tubeLineColors =
    categoricalDomainMap
        [ ( "Bakerloo", "rgb(137,78,36)" )
        , ( "Central", "rgb(220,36,30)" )
        , ( "Circle", "rgb(255,206,0)" )
        , ( "District", "rgb(1,114,41)" )
        , ( "DLR", "rgb(0,175,173)" )
        , ( "Hammersmith & City", "rgb(215,153,175)" )
        , ( "Jubilee", "rgb(106,114,120)" )
        , ( "Metropolitan", "rgb(114,17,84)" )
        , ( "Northern", "rgb(0,0,0)" )
        , ( "Piccadilly", "rgb(0,24,168)" )
        , ( "Victoria", "rgb(0,160,226)" )
        , ( "Waterloo & City", "rgb(106,187,170)" )
        ]
```

```elm {l v s}
tubeLines : Spec
tubeLines =
    let
        enc =
            encoding
                << color
                    [ mName "id"
                    , mMType Nominal
                    , mLegend [ leTitle "", leOrient loBottomRight ]
                    , mScale tubeLineColors
                    ]
    in
    toVegaLite
        [ width 700
        , height 500
        , configure (configuration (coView [ vicoStroke Nothing ]) [])
        , dataFromUrl (path "londonTubeLines.json") [ topojsonFeature "line" ]
        , geoshape [ maFilled False, maStrokeWidth 2 ]
        , enc []
        ]
```

Finally, we can overlay the routes onto the borough boundaries to provide more of a geographical context:

```elm {l v s}
tubeLines : Spec
tubeLines =
    let
        polySpec =
            asSpec
                [ dataFromUrl (path "londonBoroughs.json") [ topojsonFeature "boroughs" ]
                , geoshape [ maStroke "white", maStrokeWidth 2 ]
                , encoding (color [ mStr "#eee" ] [])
                ]

        labelEnc =
            encoding
                << position Longitude [ pName "cx" ]
                << position Latitude [ pName "cy" ]
                << text [ tName "bLabel", tMType Nominal ]
                << size [ mNum 8 ]
                << opacity [ mNum 0.6 ]

        trans =
            transform
                << calculateAs "indexof (datum.name,' ') > 0  ? substring(datum.name,0,indexof(datum.name, ' ')) : datum.name" "bLabel"

        labelSpec =
            asSpec [ dataFromUrl (path "londonCentroids.json") [], trans [], textMark [], labelEnc [] ]

        tubeEnc =
            encoding
                << color
                    [ mName "id"
                    , mMType Nominal
                    , mLegend [ leTitle "", leOrient loBottomRight, leOffset 0 ]
                    , mScale tubeLineColors
                    ]

        routeSpec =
            asSpec
                [ dataFromUrl (path "londonTubeLines.json") [ topojsonFeature "line" ]
                , geoshape [ maFilled False, maStrokeWidth 2 ]
                , tubeEnc []
                ]
    in
    toVegaLite
        [ width 700
        , height 500
        , configure (configuration (coView [ vicoStroke Nothing ]) [])
        , layer [ polySpec, labelSpec, routeSpec ]
        ]
```
