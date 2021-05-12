---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Geographic Mapping

Visualizations that handle geographic data, usually in the form of topoJSON files and/or longitude/latitude coordinate pairs.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Choropleth Maps

Choropleth maps colour geographic areas by some data value. While uncluttered and appear to be easy to interpret, choropleths are vulnerable to misinterpretation when the size of geographic regions is not proportional to the phenomenon being investigated.

This example shows US unemployment rate by county, but larger, low density counties are more salient even if they contain fewer people.

```elm {v l}
choropleth : Spec
choropleth =
    let
        countyData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "counties" ]

        unemploymentData =
            dataFromUrl (path ++ "unemployment.tsv") []

        trans =
            transform
                << lookup "id" unemploymentData "id" (luFields [ "rate" ])

        proj =
            projection [ prType albersUsa ]

        enc =
            encoding
                << color [ mName "rate", mQuant ]
    in
    toVegaLite [ width 500, height 300, countyData, proj, trans [], enc [], geoshape [] ]
```

We can use [repeatFlow](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#repeatFlow) to juxtapose a series of choropleths, here at US State level.

```elm {v l}
choropleths : Spec
choropleths =
    let
        data =
            dataFromUrl (path ++ "population_engineers_hurricanes.csv") []

        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        proj =
            projection [ prType albersUsa ]

        trans =
            transform
                << lookup "id" boundaryData "id" (luAs "geo")

        enc =
            encoding
                << shape [ mName "geo", mGeo ]
                << color [ mRepeat arFlow, mQuant ]

        spec =
            asSpec [ width 300, data, trans [], proj, enc [], geoshape [] ]

        res =
            resolve
                << resolution (reScale [ ( chColor, reIndependent ) ])
    in
    toVegaLite
        [ columns 1
        , repeatFlow [ "population", "engineers", "hurricanes" ]
        , res []
        , specification spec
        ]
```

---

## Faceted Choropleth Maps

Income in the U.S. by state, faceted over income brackets. Default sorting order for string categories ("10000 to 14999", "15000 to 24999" etc) will be alphabetical which places "<10000" after all others, so we apply a custom sort placing it first. There is no need to specify the other categories as their alphabetic order is also numeric order.

```elm {v l}
facetedChoropleth : Spec
facetedChoropleth =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromUrl (path ++ "income.json") []

        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        proj =
            projection [ prType albersUsa ]

        trans =
            transform
                << lookup "id" boundaryData "id" (luAs "geo")

        enc =
            encoding
                << shape [ mName "geo", mGeo ]
                << color [ mName "pct", mQuant, mScale [ scScheme "goldorange" [] ] ]

        spec =
            asSpec [ width 130, height 80, proj, enc [], geoshape [] ]
    in
    toVegaLite
        [ cfg []
        , data
        , trans []
        , columns 5
        , facetFlow [ fName "group", fSort [ soCustom (strs [ "<10000" ]) ] ]
        , specification spec
        ]
```

---

## Dot maps

US zip-codes: One dot per zip-code coloured by first digit.

```elm {v l}
zipDots : Spec
zipDots =
    let
        zipcodeData =
            dataFromUrl (path ++ "zipcodes.csv") []

        proj =
            projection [ prType albersUsa ]

        trans =
            transform
                << calculateAs "substring(datum.zip_code, 0, 1)" "digit"

        enc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]
                << color [ mName "digit", mScale [ scScheme "category10" [] ] ]
    in
    toVegaLite
        [ width 500, height 300, zipcodeData, proj, trans [], enc [], circle [ maSize 1 ] ]
```

Similarly, one dot per airport in the US overlaid on a geoshape.

```elm {v l}
airports : Spec
airports =
    let
        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        airportData =
            dataFromUrl (path ++ "airports.csv") []

        proj =
            projection [ prType albersUsa ]

        backdropSpec =
            asSpec [ boundaryData, geoshape [ maColor "#eee" ] ]

        enc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]

        overlaySpec =
            asSpec [ airportData, circle [ maSize 5, maColor "steelblue" ], enc [] ]
    in
    toVegaLite [ width 500, height 300, proj, layer [ backdropSpec, overlaySpec ] ]
```

---

## Flow Map

Direct flights between Chicago O'Hare (ORD) and every other US airport. Line thickness indicates relative numbers of flights between Chicago and destination airport.

The source data on flights includes counts for all airports, so we need to filter just those whose origin is Chicago. The location of each airport, required to plot on a map, is stored in a separate data source, so we use [lookup](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#lookup) to join the two tables using the [iata code](https://en.wikipedia.org/wiki/IATA_airport_code) common to both.

```elm {v l}
flowMap : Spec
flowMap =
    let
        flightData =
            dataFromUrl (path ++ "flights-airport.csv") []

        airportData =
            dataFromUrl (path ++ "airports.csv") []

        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        trans =
            transform
                << filter (fiExpr "datum.origin == 'ORD'")
                << lookup "origin" airportData "iata" (luFields [ "latitude", "longitude" ])
                << calculateAs "datum.latitude" "origin_latitude"
                << calculateAs "datum.longitude" "origin_longitude"
                << lookup "destination" airportData "iata" (luFields [ "latitude", "longitude" ])
                << calculateAs "datum.latitude" "dest_latitude"
                << calculateAs "datum.longitude" "dest_longitude"

        backdropSpec =
            asSpec [ boundaryData, geoshape [ maColor "#eee" ] ]

        enc =
            encoding
                << position Longitude [ pName "origin_longitude" ]
                << position Latitude [ pName "origin_latitude" ]
                << position Longitude2 [ pName "dest_longitude" ]
                << position Latitude2 [ pName "dest_latitude" ]
                << strokeWidth
                    [ mName "count"
                    , mQuant
                    , mScale [ scRange (raNums [ 0.1, 20 ]) ]
                    ]

        flightsSpec =
            asSpec [ flightData, trans [], rule [ maOpacity 0.1, maColor "brown" ], enc [] ]

        proj =
            projection [ prType albersUsa ]
    in
    toVegaLite [ width 800, height 500, proj, layer [ backdropSpec, flightsSpec ] ]
```

---

## Multi-stage flow map

Line drawn between airports in the U.S. simulating a multi-trip flight itinerary between Seattle and Orlando.

```elm {v l}
multiStage : Spec
multiStage =
    let
        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        airportData =
            dataFromUrl (path ++ "airports.csv") []

        backdropSpec =
            asSpec [ boundaryData, geoshape [ maColor "#eee" ] ]

        airportsEnc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]

        airportsSpec =
            asSpec [ circle [ maSize 5, maColor "grey" ], airportsEnc [] ]

        itinerary =
            dataFromColumns []
                << dataColumn "airport"
                    (strs [ "SEA", "SFO", "LAX", "LAS", "DFW", "DEN", "ORD", "JFK", "ATL", "MCO" ])
                << dataColumn "order" (List.range 1 10 |> List.map toFloat |> nums)

        trans =
            transform
                << lookup "airport" airportData "iata" (luFields [ "latitude", "longitude" ])

        flightsEnc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]
                << order [ oName "order", oOrdinal ]

        flightsSpec =
            asSpec [ itinerary [], trans [], line [ maInterpolate miMonotone ], flightsEnc [] ]
    in
    toVegaLite
        [ width 800
        , height 500
        , airportData
        , projection [ prType albersUsa ]
        , layer [ backdropSpec, airportsSpec, flightsSpec ]
        ]
```

---

## Interactive map

Flights to/from airport nearest to mouse position.

Note the use of [lookup](#https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#lookup) to give separate names to the origin longitude/latitude (`"o"`) and destination longitude/latitude (`"d"`). The individual fields that have been renamed can be referenced with dot notation (`o.longitude`, `o.latitude`, `d.longitude` and `d.latitude`).

```elm {v l interactive}
interactiveMap : Spec
interactiveMap =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        ps =
            params
                << param "mySelection"
                    [ paSelect sePoint
                        [ seOn "mouseover"
                        , seNearest True
                        , seToggle tpFalse
                        , seFields [ "origin" ]
                        ]
                    ]

        dataAirports =
            dataFromUrl (path ++ "airports.csv") []

        dataFlights =
            dataFromUrl (path ++ "flights-airport.csv") []

        backdropSpec =
            asSpec
                [ dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]
                , geoshape [ maFill "#ddd", maStroke "#fff" ]
                ]

        lineTrans =
            transform
                << filter (fiSelectionEmpty "mySelection")
                << lookup "origin" dataAirports "iata" (luAs "o")
                << lookup "destination" dataAirports "iata" (luAs "d")

        lineEnc =
            encoding
                << position Longitude [ pName "o.longitude" ]
                << position Latitude [ pName "o.latitude" ]
                << position Longitude2 [ pName "d.longitude" ]
                << position Latitude2 [ pName "d.latitude" ]

        lineSpec =
            asSpec
                [ dataFlights
                , lineTrans []
                , lineEnc []
                , rule [ maColor "black", maOpacity 0.35 ]
                ]

        airportTrans =
            transform
                << aggregate [ opAs opCount "" "routes" ] [ "origin" ]
                << lookup "origin" dataAirports "iata" (luFields [ "state", "latitude", "longitude" ])
                << filter (fiExpr "datum.state !== 'PR' && datum.state !== 'VI'")

        airportEnc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]
                << size [ mName "routes", mQuant, mScale [ scRange (raNums [ 0, 1000 ]) ], mLegend [] ]
                << order [ oName "routes", oQuant, oSort [ soDescending ] ]

        airportSpec =
            asSpec [ dataFlights, airportTrans [], ps [], circle [], airportEnc [] ]
    in
    toVegaLite
        [ cfg []
        , width 800
        , height 500
        , projection [ prType albersUsa ]
        , layer [ backdropSpec, lineSpec, airportSpec ]
        ]
```

---

## Map with labels

US state capitals overlaid on a map of the US.

```elm {v l}
labelledMap : Spec
labelledMap =
    let
        boundaryData =
            dataFromUrl (path ++ "us-10m.json") [ topojsonFeature "states" ]

        data =
            dataFromUrl (path ++ "us-state-capitals.json") []

        backdropSpec =
            asSpec [ boundaryData, geoshape [ maFill "#dcc", maStroke "white" ] ]

        overlayEnc =
            encoding
                << position Longitude [ pName "lon" ]
                << position Latitude [ pName "lat" ]
                << text [ tName "city" ]

        overlaySpec =
            asSpec
                [ textMark [ maColor "#5a2d0c", maDy 2, maFontSize 8, maFont "serif" ]
                , overlayEnc []
                ]
    in
    toVegaLite
        [ width 800
        , height 500
        , data
        , projection [ prType albersUsa ]
        , layer [ backdropSpec, overlaySpec ]
        ]
```

---

## London Underground Lines

Geographic position of London Underground lines overlaid on a London borough map.

```elm {v l}
tubeLines : Spec
tubeLines =
    let
        boroughBounds =
            dataFromUrl (path ++ "londonBoroughs.json") [ topojsonFeature "boroughs" ]

        boroughCentroids =
            dataFromUrl (path ++ "londonCentroids.json") []

        tubeLineData =
            dataFromUrl (path ++ "londonTubeLines.json") [ topojsonFeature "line" ]

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

        polySpec =
            asSpec
                [ boroughBounds
                , geoshape [ maFill "#eee", maStroke "white", maStrokeWidth 2 ]
                ]

        labelEnc =
            encoding
                << position Longitude [ pName "cx" ]
                << position Latitude [ pName "cy" ]
                << text [ tName "bLabel" ]
                << size [ mNum 8 ]
                << opacity [ mNum 0.6 ]

        trans =
            transform
                << calculateAs "indexof (datum.name,' ') > 0  ? substring(datum.name,0,indexof(datum.name, ' ')) : datum.name" "bLabel"

        labelSpec =
            asSpec [ boroughCentroids, trans [], textMark [], labelEnc [] ]

        tubeEnc =
            encoding
                << color
                    [ mName "id"
                    , mLegend [ leTitle "", leOrient loBottomRight, leOffset 0 ]
                    , mScale tubeLineColors
                    ]

        routeSpec =
            asSpec
                [ tubeLineData
                , geoshape [ maFilled False, maStrokeWidth 2 ]
                , tubeEnc []
                ]

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
    in
    toVegaLite
        [ width 700
        , height 500
        , cfg []
        , layer [ polySpec, labelSpec, routeSpec ]
        ]
```

---

## Other Maps

For a more diverse range of examples, see these litvis [30 day map challenge](https://github.com/jwoLondon/30dayMapChallenge) examples.
