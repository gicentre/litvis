---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Repeats and Concatenations

Joining multiple views together.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Weather comparisons (1)

Monthly weather information for individual years and overall average for Seattle and New York.
Uses [repeat](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#repeat) as the encoding is the same for all charts, but with a different data field. The encoding for each chart itself comprises two layered specifications – one for the yearly data and one for the mean over all years.

```elm {v l}
weatherComparison1 : Spec
weatherComparison1 =
    let
        data =
            dataFromUrl (path ++ "weather.csv") []

        enc1 =
            encoding
                << position X [ pName "date", pOrdinal, pTimeUnit month, pTitle "" ]
                << position Y [ pRepeat arColumn, pAggregate opMean ]
                << detail [ dName "date", dTimeUnit year ]
                << color [ mName "location" ]

        spec1 =
            asSpec [ enc1 [], line [ maOpacity 0.2 ] ]

        enc2 =
            encoding
                << position X [ pName "date", pOrdinal, pTimeUnit month ]
                << position Y [ pRepeat arColumn, pAggregate opMean ]
                << color [ mName "location" ]

        spec2 =
            asSpec [ enc2 [], line [ maInterpolate miMonotone ] ]
    in
    toVegaLite
        [ data
        , repeat [ columnFields [ "temp_max", "precipitation", "wind" ] ]
        , specification (asSpec [ layer [ spec1, spec2 ] ])
        ]
```

---

## Weather comparisons (2)

Two concatenated charts that show a histogram of precipitation in Seattle and the relationship between min and max temperature. As the encodings for each are different, we use [concat](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#concat) to juxtapose them.

```elm {v l}
weatherComparison2 : Spec
weatherComparison2 =
    let
        data =
            dataFromUrl (path ++ "weather.csv") []

        trans =
            transform
                << filter (fiExpr "datum.location === 'Seattle'")

        enc1 =
            encoding
                << position X [ pName "date", pTimeUnit month, pOrdinal, pTitle "" ]
                << position Y [ pName "precipitation", pAggregate opMean ]

        spec1 =
            asSpec [ bar [], enc1 [] ]

        enc2 =
            encoding
                << position X [ pName "temp_min", pBin [] ]
                << position Y [ pName "temp_max", pBin [] ]
                << size [ mAggregate opCount ]

        spec2 =
            asSpec [ enc2 [], circle [] ]
    in
    toVegaLite [ data, trans [], concat [ spec1, spec2 ] ]
```

---

## Weather comparisons (3)

We can summarise each year's wind speed distribution compactly with a boxplot and use faceting (via the `row` function) to order the boxplots by the median wind speed. We can use various `configuration` settings to provide a more compact layout of boxplots.

```elm {v l}
weatherComparison3 : Spec
weatherComparison3 =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
                << configuration (coHeader [ hdLabelAngle 0, hdLabelPadding -15 ])
                << configuration (coFacet [ facoSpacing 0 ])

        data =
            dataFromUrl (path ++ "weather.csv") []

        trans =
            transform
                << filter (fiExpr "datum.location === 'Seattle'")
                << calculateAs "year(datum.date)" "year"

        enc =
            encoding
                << row
                    [ fName "year"
                    , fSort [ soByField "wind" opMedian ]
                    , fHeader [ hdTitle "" ]
                    ]
                << position X [ pName "wind", pQuant, pTitle "Wind speed" ]
    in
    toVegaLite [ cfg [], data, trans [], enc [], boxplot [] ]
```

---

## Country-comparison of Car Characteristics

Repeated stacked histograms of various car engine characteristics.

```elm {v l}
carsByOrigin : Spec
carsByOrigin =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        trans =
            transform
                -- Convert pounds to kilograms
                << calculateAs "datum.Weight_in_lbs * 0.4536" "Weight"

        enc =
            encoding
                << position X [ pRepeat arFlow, pBin [] ]
                << position Y [ pAggregate opCount ]
                << color [ mName "Origin" ]
    in
    toVegaLite
        [ data
        , trans []
        , columns 2
        , repeatFlow [ "Horsepower", "Miles_per_Gallon", "Acceleration", "Weight" ]
        , specification (asSpec [ enc [], bar [] ])
        ]
```

---

## Scatterplot Matrix

Interactive scatterplot. Drag to rescale any pair of data variables. Shift-drag to select a set of points to highlight.

```elm {v l interactive}
splom : Spec
splom =
    let
        data =
            dataFromUrl (path ++ "penguins.json") []

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
                << position X [ pRepeat arColumn, pQuant, pScale [ scZero False ] ]
                << position Y [ pRepeat arRow, pQuant, pScale [ scZero False ] ]
                << color
                    [ mCondition (prParam "brush")
                        [ mName "Species" ]
                        [ mStr "black" ]
                    ]
                << opacity
                    [ mCondition (prParam "brush")
                        [ mNum 0.8 ]
                        [ mNum 0.1 ]
                    ]
    in
    toVegaLite
        [ data
        , repeat
            [ rowFields [ "Beak Length (mm)", "Beak Depth (mm)", "Flipper Length (mm)" ]
            , columnFields [ "Flipper Length (mm)", "Beak Depth (mm)", "Beak Length (mm)" ]
            ]
        , specification (asSpec [ ps [], enc [], circle [] ])
        ]
```

---

## Marginal Histograms

A composite view is used to create marginal histograms around a 2d binned histogram.

```elm {v l}
marginalHisto : Spec
marginalHisto =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        cfg =
            configure
                << configuration (coRange [ racoHeatmap "greenblue" ])
                << configuration (coView [ vicoStroke Nothing ])

        encPosition =
            encoding
                << position X [ pName "IMDB Rating", pBin [ biMaxBins 10 ] ]
                << position Y [ pName "Rotten Tomatoes Rating", pBin [ biMaxBins 10 ] ]

        enc1 =
            encoding
                << position X [ pName "IMDB Rating", pAxis [], pBin [] ]
                << position Y [ pAggregate opCount, pScale [ scDomain (doNums [ 0, 1000 ]) ], pAxis [] ]

        spec1 =
            asSpec [ height 60, enc1 [], bar [] ]

        spec2 =
            asSpec [ spacing 15, bounds boFlush, hConcat [ spec2_1, spec2_2 ] ]

        enc2_1 =
            encoding
                << position X [ pName "IMDB Rating", pBin [] ]
                << position Y [ pName "Rotten Tomatoes Rating", pBin [] ]
                << color [ mAggregate opCount ]

        spec2_1 =
            asSpec [ enc2_1 [], rect [] ]

        enc2_2 =
            encoding
                << position Y [ pName "Rotten Tomatoes Rating", pBin [], pAxis [] ]
                << position X [ pAggregate opCount, pScale [ scDomain (doNums [ 0, 1000 ]) ], pAxis [] ]

        spec2_2 =
            asSpec [ width 60, enc2_2 [], bar [] ]
    in
    toVegaLite [ cfg [], data, vConcat [ spec1, spec2 ] ]
```
