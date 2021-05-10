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
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.2/data/"


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

        ps =
            params
                << param "myBrush"
                    [ paSelect seInterval
                        [ seEncodings [ chX ]
                        , seSelectionMark [ smFill "hsl(320,100%,40%)" ]
                        ]
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
            asSpec [ width w, height 60, ps [], enc2 [], bar [ maColor "lightgrey" ] ]
    in
    toVegaLite [ data, vConcat [ spec1, spec2 ] ]
```

---

## Responsive Table

We can use the same idea to create a table of data using the [textMark](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#textMark) that is dependent on the current selection from a linked scatterplot.

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

        ps =
            params
                << param "brush" [ paSelect seInterval [] ]

        encPoint =
            encoding
                << position X [ pName "Body Mass (g)", pQuant, pScale [ scZero False ] ]
                << position Y [ pName "Flipper Length (mm)", pQuant, pScale [ scZero False ] ]
                << color [ mCondition (prParam "brush") [ mName "Species" ] [ mStr "grey" ] ]

        specPoint =
            asSpec [ ps [], encPoint [], point [] ]

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

        ps =
            params
                << param "myBrush" [ paSelect seInterval [ seEncodings [ chX ] ] ]

        selTrans =
            transform
                << filter (fiSelectionEmpty "myBrush")

        enc =
            encoding
                << position X [ pRepeat arColumn, pBin [ biMaxBins 20 ] ]
                << position Y [ pAggregate opCount ]

        spec1 =
            asSpec [ enc [], bar [] ]

        spec2 =
            asSpec [ ps [], selTrans [], enc [], bar [ maColor "goldenrod" ] ]
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

The position scales are bound to an interval selection allowing a scatterplot to be zoomed and panned. By resolving the scaling globally, the scaling in any one plot is applied across all views. Selections may also be made by holding down the shift key. The selection is projected across all views.

_Try dragging the pointer in any scatterplot and shift-dragging to select a set of points to highlight._

```elm {v l interactive}
linkedSplom : Spec
linkedSplom =
    let
        data =
            dataFromUrl (vegaPath ++ "penguins.json") []

        ps =
            params
                << param "brush"
                    [ paSelect
                        seInterval
                        [ seOn "[mousedown[event.shiftKey], window:mouseup] > window:mousemove!"
                        , seTranslate "[mousedown[event.shiftKey], window:mouseup] > window:mousemove!"
                        , seZoom "wheel![event.shiftKey]"
                        , seResolve seUnion
                        ]
                    ]
                << param "zoom"
                    [ paSelect seInterval
                        [ seTranslate "[mousedown[!event.shiftKey], window:mouseup] > window:mousemove!"
                        , seZoom "wheel![event.shiftKey]"
                        , seResolve seGlobal
                        ]
                    , paBindScales
                    ]

        enc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]
                << color [ mCondition (prParam "brush") [ mName "Species" ] [ mStr "lightgrey" ] ]
    in
    toVegaLite
        [ data
        , repeat
            [ rowFields [ "Beak Length (mm)", "Beak Depth (mm)", "Body Mass (g)" ]
            , columnFields [ "Body Mass (g)", "Beak Depth (mm)", "Beak Length (mm)" ]
            ]
        , specification (asSpec [ data, ps [], enc [], point [] ])
        ]
```

---

## Bar Selection for 2d Histogram Filtering

Selecting film genres in the bar chart allows dynamic update of the 2d histogram.

```elm {v l interactive}
barSelection : Spec
barSelection =
    let
        cfg =
            configure
                << configuration (coRange [ racoHeatmap "greenblue" ])
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromUrl (vegaPath ++ "movies.json") []

        ps =
            params
                << param "selectedGenre"
                    [ paSelect sePoint
                        [ seEncodings [ chX ]
                        , seToggle tpFalse
                        ]
                    ]

        trans =
            transform
                << filter (fiExpr "isValid(datum['Major Genre'])")

        selTrans =
            transform
                << filter (fiSelection "selectedGenre")

        encPosition =
            encoding
                << position X
                    [ pName "IMDB Rating"
                    , pTitle "IMDB Rating"
                    , pBin [ biMaxBins 10 ]
                    ]
                << position Y
                    [ pName "Rotten Tomatoes Rating"
                    , pTitle "Rotten Tomatoes Rating"
                    , pBin [ biMaxBins 10 ]
                    ]

        enc1 =
            encoding
                << color
                    [ mAggregate opCount
                    , mLegend
                        [ leTitle "Number of films"
                        , leDirection moHorizontal
                        , leGradientLength 120
                        ]
                    ]

        spec1 =
            asSpec [ enc1 [], rect [] ]

        enc2 =
            encoding
                << size [ mAggregate opCount, mTitle "in selected genre" ]
                << color [ mStr "#666" ]

        spec2 =
            asSpec [ selTrans [], enc2 [], point [] ]

        heatSpec =
            asSpec [ encPosition [], layer [ spec1, spec2 ] ]

        barSpec =
            asSpec [ width 420, height 120, ps [], encBar [], bar [] ]

        encBar =
            encoding
                << position X [ pName "Major Genre", pAxis [ axTitle "", axLabelAngle -40 ] ]
                << position Y [ pAggregate opCount, pTitle "Number of films" ]
                << color [ mCondition (prParam "selectedGenre") [ mStr "steelblue" ] [ mStr "grey" ] ]

        res =
            resolve
                << resolution (reLegend [ ( chColor, reIndependent ), ( chSize, reIndependent ) ])
    in
    toVegaLite [ cfg [], data, trans [], res [], vConcat [ heatSpec, barSpec ] ]
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

        ps1 =
            params
                << param "selectedTime" [ paSelect seInterval [ seEncodings [ chX ] ] ]

        trans1 =
            transform << filter (fiSelection "selectedWeather")

        weatherColors =
            categoricalDomainMap
                [ ( "sun", "#e7ba52" )
                , ( "fog", "#c7c7c7" )
                , ( "drizzle", "#aec7ea" )
                , ( "rain", "#1f77b4" )
                , ( "snow", "#9467bd" )
                ]

        enc1 =
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
                    , pTitle "Maximum Daily Temperature (C)"
                    ]
                << color
                    [ mCondition (prParam "selectedWeather")
                        [ mName "weather", mTitle "Weather", mScale weatherColors ]
                        [ mStr "#cfdebe" ]
                    ]
                << size
                    [ mName "precipitation"
                    , mQuant
                    , mScale [ scDomain (doNums [ -1, 50 ]) ]
                    ]

        spec1 =
            asSpec
                [ width 600, height 300, ps1 [], trans1 [], enc1 [], point [] ]

        ps2 =
            params
                << param "selectedWeather" [ paSelect sePoint [ seEncodings [ chColor ] ] ]

        trans2 =
            transform << filter (fiSelection "selectedTime")

        enc2 =
            encoding
                << position X [ pAggregate opCount, pTitle "Number of days" ]
                << position Y [ pName "weather", pTitle "" ]
                << color
                    [ mCondition (prParam "selectedWeather")
                        [ mName "weather", mScale weatherColors ]
                        [ mStr "#acbf98" ]
                    ]

        spec2 =
            asSpec [ width 600, ps2 [], bar [], trans2 [], enc2 [] ]
    in
    toVegaLite [ title "Seattle Weather" [], data, vConcat [ spec1, spec2 ] ]
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

        ps =
            params
                << param "brush" [ paSelect seInterval [ seEncodings [ chX ] ] ]

        enc1 =
            encoding
                << position X
                    [ pName "time"
                    , pBin [ biMaxBins 30 ]
                    , pAxis [ axTitle "Time of day", axFormat ".2f" ]
                    ]
                << position Y [ pAggregate opCount ]

        spec1 =
            asSpec [ width 700, height 100, ps [], enc1 [], bar [] ]

        enc2 =
            encoding
                << position X
                    [ pName "time"
                    , pBin [ biMaxBins 30, biSelectionExtent "brush" ]
                    , pAxis [ axTitle "Selected time of day", axFormat ".2f" ]
                    ]
                << position Y [ pAggregate opCount ]

        spec2 =
            asSpec [ width 700, height 100, enc2 [], bar [] ]
    in
    toVegaLite [ data, trans [], vConcat [ spec1, spec2 ] ]
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

        ps =
            params
                << param "brush" [ paSelect seInterval [ seEncodings [ chY ] ] ]

        encMain =
            encoding
                << position Y
                    [ pName "Name"
                    , pScale [ scDomain (doSelection "brush") ]
                    , pAxis [ axMinExtent 200, axTitle "" ]
                    , pSort [ soByChannel chX, soDescending ]
                    ]
                << position X
                    [ pAggregate opCount
                    , pScale [ scDomain (doNums [ 0, 6 ]) ]
                    , pAxis [ axOrient siTop ]
                    ]

        specMain =
            asSpec [ encMain [], bar [] ]

        encMini =
            encoding
                << position Y
                    [ pName "Name"
                    , pSort [ soByChannel chX, soDescending ]
                    , pAxis []
                    ]
                << position X [ pAggregate opCount, pAxis [] ]

        specMini =
            asSpec [ width 50, height 200, ps [], encMini [], bar [] ]
    in
    toVegaLite [ data, hConcat [ specMain, specMini ] ]
```
