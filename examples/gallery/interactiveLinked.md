---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Interactive Linked Views

Interactive visualizations that link views together.

_For all interactive examples on this page, the code block header must include the `interactive` keyword._

Examples that use data from external sources tend to use files from the Vega-Lite and giCentre data servers. For consistency the paths to these data locations are defined here:

```elm {l}
vegaPath : String
vegaPath =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"


giCentrePath : String
giCentrePath =
    "https://gicentre.github.io/data/"
```

## Zoom and Overview

We can concatenate a zoomed view and an overview together and use interaction with the overview to select the zoomed scale. _Try dragging a rectangle in the lower grey area chart in order to zoom and pan the main chart._

```elm {v l interactive}
globalTemperatures : Spec
globalTemperatures =
    let
        w =
            800

        data =
            dataFromUrl (giCentrePath ++ "temperatureAnomalies.json")
                [ parse [ ( "Anomaly", foNum ) ] ]

        sel =
            selection
                << select "myBrush"
                    seInterval
                    [ seEncodings [ chX ]
                    , seSelectionMark [ smFill "hsl(320,100%,40%)" ]
                    ]

        enc1 =
            encoding
                << position X
                    [ pName "Date"
                    , pTemporal
                    , pScale [ scDomain (doSelection "myBrush") ]
                    , pTitle ""
                    ]
                << position Y [ pName "Anomaly", pQuant ]
                << color
                    [ mName "Anomaly"
                    , mQuant
                    , mScale [ scScheme "redblue" [ 1, 0 ], scDomain (doNums [ -1.5, 1.5 ]) ]
                    ]

        spec1 =
            asSpec [ width w, bar [], enc1 [] ]

        enc2 =
            encoding
                << position X [ pName "Date", pTemporal, pAxis [ axFormat "%Y", axTitle "" ] ]
                << position Y [ pName "Anomaly", pQuant, pAxis [] ]

        spec2 =
            asSpec [ width w, height 60, sel [], enc2 [], bar [ maColor "lightgrey" ] ]
    in
    toVegaLite [ data, vConcat [ spec1, spec2 ] ]
```

---

## Bar chart with minimap

The same idea is useful for large charts, where we can show a 'minimap' of the entire chart and use a selection to show only part of it at full size.

_Drag a selection on the minimap to show part of it._

```elm {v l interactive}
minimap : Spec
minimap =
    let
        data =
            dataFromUrl (vegaPath ++ "cars.json") []

        sel =
            selection
                << select "brush" seInterval [ seEncodings [ chY ] ]

        trans =
            transform
                << joinAggregate [ opAs opCount "Name" "numModels" ] [ wiGroupBy [ "Name" ] ]
                << window [ ( [ wiOp woRowNumber ], "rowNumber" ) ] [ wiSort [ wiDescending "numCars" ] ]

        transFilter =
            transform
                << filter (fiSelection "brush")

        encMain =
            encoding
                << position Y
                    [ pName "Name"
                    , pAxis [ axMinExtent 200, axTitle "", axLabelFontSize 7 ]
                    , pSort [ soByChannel chX, soDescending ]
                    ]
                << position X
                    [ pName "numModels"
                    , pQuant
                    , pScale [ scDomain (doNums [ 0, 6 ]) ]
                    , pAxis [ axOrient siTop, axTitle "Number of models" ]
                    ]

        specMain =
            asSpec [ heightStep 7, transFilter [], encMain [], bar [] ]

        encMini =
            encoding
                << position Y
                    [ pName "Name"
                    , pSort [ soByChannel chX, soDescending ]
                    , pAxis []
                    ]
                << position X [ pAggregate opCount, pAxis [] ]

        specMini =
            asSpec [ width 50, height 200, sel [], encMini [], bar [] ]
    in
    toVegaLite [ data, trans [], hConcat [ specMain, specMini ] ]
```

---

## Responsive Table

We can create a table of data using the [textMark](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#textMark) that is dependent on the current selection from a linked scatterplot.

_Drag a rectangular brush to show (first 20) selected points in a table._

```elm {v l interactive}
responsiveTable : Spec
responsiveTable =
    let
        data =
            dataFromUrl (vegaPath ++ "penguins.json") []

        trans =
            transform
                << window [ ( [ wiOp woRowNumber ], "rowNumber" ) ] []

        sel =
            selection
                << select "brush" seInterval []

        encPoint =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
                << color
                    [ mSelectionCondition (selectionName "brush")
                        [ mName "Species" ]
                        [ mStr "grey" ]
                    ]

        specPoint =
            asSpec [ sel [], encPoint [], point [] ]

        tableTrans =
            transform
                << filter (fiSelection "brush")
                << window [ ( [ wiOp woRank ], "rank" ) ] []
                << filter (fiLessThan "rank" (num 20))

        encBodyMassText =
            encoding
                << position Y [ pName "rowNumber", pAxis [] ]
                << text [ tName "Body Mass (g)" ]

        specBodyMassText =
            asSpec [ title "Body Mass" [], tableTrans [], textMark [], encBodyMassText [] ]

        encFlipperLengthText =
            encoding
                << position Y [ pName "rowNumber", pAxis [] ]
                << text [ tName "Flipper Length (mm)", tFormat ".1f" ]

        specFlipperLengthText =
            asSpec [ title "Flipper Length (mm)" [], tableTrans [], encFlipperLengthText [], textMark [] ]

        encSpeciesText =
            encoding
                << position Y [ pName "rowNumber", pAxis [] ]
                << text [ tName "Species" ]

        specSpeciesText =
            asSpec [ title "Species" [], tableTrans [], encSpeciesText [], textMark [] ]

        res =
            resolve
                << resolution (reLegend [ ( chColor, reIndependent ) ])

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
    in
    toVegaLite
        [ cfg []
        , data
        , trans []
        , res []
        , hConcat [ specPoint, specBodyMassText, specFlipperLengthText, specSpeciesText ]
        ]
```

---

## Cross Filtering

Comparison of flight distances, delays and times using cross-filtering. _Drag a rectangle in any one of the charts to select items that are highlighted across all three._

```elm {v l interactive}
crossFilter : Spec
crossFilter =
    let
        data =
            dataFromUrl (vegaPath ++ "flights-2k.json") []

        trans =
            transform
                << calculateAs "hours(datum.date)" "time"

        sel =
            selection
                << select "myBrush" seInterval [ seEncodings [ chX ], seEmpty ]

        selTrans =
            transform
                << filter (fiSelection "myBrush")

        enc =
            encoding
                << position X [ pRepeat arColumn, pBin [ biMaxBins 20 ] ]
                << position Y [ pAggregate opCount ]

        spec1 =
            asSpec [ enc [], bar [] ]

        spec2 =
            asSpec [ sel [], selTrans [], enc [], bar [ maColor "goldenrod" ] ]
    in
    toVegaLite
        [ data
        , trans []
        , repeat [ columnFields [ "distance", "delay", "time" ] ]
        , specification (asSpec [ layer [ spec1, spec2 ] ])
        ]
```

---

## Linked Scatterplot Matrix

The position scales are bound to an interval selection allowing a scatterplot to be zoomed and panned. By resolving the scaling globally, the scaling in any one plot is applied across all views. _Try dragging the pointer in any scatterplot._

```elm {v l interactive}
linkedSplom : Spec
linkedSplom =
    let
        data =
            dataFromUrl (vegaPath ++ "penguins.json") []

        sel =
            selection
                << select "myBrush"
                    seInterval
                    [ seOn "[mousedown[event.shiftKey], window:mouseup] > window:mousemove!"
                    , seTranslate "[mousedown[event.shiftKey], window:mouseup] > window:mousemove!"
                    , seZoom "wheel![event.shiftKey]"
                    , seResolve seUnion
                    ]
                << select "myZoom"
                    seInterval
                    [ seBindScales
                    , seTranslate "[mousedown[!event.shiftKey], window:mouseup] > window:mousemove!"
                    , seZoom "wheel![event.shiftKey]"
                    , seResolve seGlobal
                    ]

        enc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]
                << color
                    [ mSelectionCondition (selectionName "myBrush")
                        [ mName "Species" ]
                        [ mStr "lightgrey" ]
                    ]
    in
    toVegaLite
        [ data
        , repeat
            [ rowFields [ "Beak Length (mm)", "Beak Depth (mm)", "Body Mass (g)" ]
            , columnFields [ "Body Mass (g)", "Beak Depth (mm)", "Beak Length (mm)" ]
            ]
        , specification (asSpec [ data, sel [], enc [], point [] ])
        ]
```

---

## Bar Selection for 2d Histogram Filtering

Selecting film genres in the bar chart allows dynamic update of the 2d histogram.

```elm {v l interactive}
barSelection : Spec
barSelection =
    let
        data =
            dataFromUrl (vegaPath ++ "movies.json") []

        trans =
            transform
                << filter (fiExpr "datum['Major Genre'] != null")

        sel =
            selection
                << select "selectedGenre" seSingle [ seEncodings [ chX ] ]

        selTrans =
            transform
                << filter (fiSelection "selectedGenre")

        encPosition =
            encoding
                << position X [ pName "IMDB Rating", pBin [] ]
                << position Y [ pName "Rotten Tomatoes Rating", pBin [] ]

        enc2dHisto =
            encoding
                << color
                    [ mAggregate opCount
                    , mLegend
                        [ leTitle "Number of films"
                        , leDirection moHorizontal
                        , leGradientLength 120
                        ]
                    ]

        spec2dHisto =
            asSpec [ enc2dHisto [], rect [] ]

        encCircles =
            encoding
                << size [ mAggregate opCount, mTitle "in selected genre" ]

        specCircles =
            asSpec [ selTrans [], encCircles [], point [ maColor "grey" ] ]

        specHeat =
            asSpec [ encPosition [], layer [ spec2dHisto, specCircles ] ]

        encBar =
            encoding
                << position X [ pName "Major Genre", pAxis [ axTitle "", axLabelAngle -40 ] ]
                << position Y [ pAggregate opCount, pAxis [ axGrid False ] ]
                << color
                    [ mSelectionCondition (selectionName "selectedGenre")
                        [ mStr "steelblue" ]
                        [ mStr "lightgrey" ]
                    ]

        specBar =
            asSpec [ width 420, height 120, sel [], encBar [], bar [] ]

        res =
            resolve
                << resolution
                    (reLegend
                        [ ( chColor, reIndependent )
                        , ( chSize, reIndependent )
                        ]
                    )

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
                << configuration (coRange [ racoHeatmap "greenblue" ])
    in
    toVegaLite [ cfg [], data, trans [], res [], vConcat [ specHeat, specBar ] ]
```

---

## Two-way Selection Filtering

Selecting weather types in the bar chart allows dynamic update of the weather time-series. Selecting part of the time series updates the bar chart.

```elm {v l interactive}
twoWayFiltering : Spec
twoWayFiltering =
    let
        data =
            dataFromUrl (vegaPath ++ "seattle-weather.csv") []

        selTime =
            selection
                << select "timeBrush" seInterval [ seEncodings [ chX ] ]

        transTime =
            transform
                << filter (fiSelection "timeBrush")

        selBar =
            selection
                << select "barSelect" seMulti [ seEncodings [ chColor ] ]

        transBar =
            transform
                << filter (fiSelection "barSelect")

        weatherColours =
            categoricalDomainMap
                [ ( "sun", "#e7ba52" )
                , ( "fog", "#c7c7c7" )
                , ( "drizzle", "#aec7ea" )
                , ( "rain", "#1f77b4" )
                , ( "snow", "#9467bd" )
                ]

        encTime =
            encoding
                << position X
                    [ pName "date"
                    , pTimeUnit monthDate
                    , pAxis [ axTitle "", axFormat "%b" ]
                    ]
                << position Y
                    [ pName "temp_max"
                    , pQuant
                    , pScale [ scDomain (doNums [ -5, 40 ]) ]
                    , pAxis [ axTitle "Maximum Daily Temperature (C)" ]
                    ]
                << color
                    [ mSelectionCondition (selectionName "timeBrush")
                        [ mName "weather", mScale weatherColours ]
                        [ mStr "#cfdebe" ]
                    ]
                << size
                    [ mName "precipitation"
                    , mQuant
                    , mScale [ scDomain (doNums [ -1, 50 ]) ]
                    ]

        specTime =
            asSpec [ width 600, selTime [], transBar [], encTime [], point [] ]

        encBar =
            encoding
                << position X [ pAggregate opCount, pTitle "Number of days" ]
                << position Y [ pName "weather", pTitle "" ]
                << color
                    [ mSelectionCondition (selectionName "barSelect")
                        [ mName "weather", mScale weatherColours ]
                        [ mStr "#acbf98" ]
                    ]

        specBar =
            asSpec [ width 600, selBar [], transTime [], encBar [], bar [] ]
    in
    toVegaLite [ title "Seattle Weather, 2012-2015" [], data, vConcat [ specTime, specBar ] ]
```

---

## Smooth Zooming

A similar idea of of presenting both an overview (upper chart) and detailed view (lower chart), this time revealing a greater temporal resolution in the detailed view as the view extent gets smaller.

_Try dragging an interval selection in the upper chart and then changing the zoom extent._

```elm {v l interactive}
smoothZoom : Spec
smoothZoom =
    let
        data =
            dataFromUrl (vegaPath ++ "flights-5k.json") [ parse [ ( "date", foDate "" ) ] ]

        trans =
            transform
                << calculateAs "hours(datum.date) + minutes(datum.date) / 60" "time"

        sel =
            selection
                << select "brush" seInterval [ seEncodings [ chX ] ]

        enc1 =
            encoding
                << position X [ pName "time", pBin [ biMaxBins 30 ], pAxis [ axFormat ".2f" ] ]
                << position Y [ pAggregate opCount ]

        spec1 =
            asSpec [ width 700, height 100, sel [], enc1 [], bar [] ]

        enc2 =
            encoding
                << position X
                    [ pName "time"
                    , pBin [ biMaxBins 30, biSelectionExtent "brush" ]
                    , pAxis [ axFormat ".2f" ]
                    ]
                << position Y [ pAggregate opCount ]

        spec2 =
            asSpec [ width 700, height 100, enc2 [], bar [] ]
    in
    toVegaLite [ data, trans [], vConcat [ spec1, spec2 ] ]
```
