---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Table-based charts

Visualizations that use a regular gridded layout of some kind.

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Simple gridded "heatmap"

A so-called "table heatmap" showing engine power associated with engine size and country of origin.

```elm {v l}
tableGrid : Spec
tableGrid =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Cylinders", pAxis [ axLabelAngle 0 ] ]
                << position Y [ pName "Origin", pTitle "" ]
                << color [ mName "Horsepower", mAggregate opMean, mScale [ scScheme "reds" [] ] ]
    in
    toVegaLite [ width 200, height 100, data, enc [], rect [] ]
```

---

## Calendar View

A temporal sequence of measurements can be displayed as a grid by splitting time into two components such as years/months, months/days or days/hours. This allows cyclical patterns such as day-night cycles or seasonal trends to be revealed.

Here is maximum daily temperature in Seattle shown as a calendar grid:

```elm {v l}
calendarPlot : Spec
calendarPlot =
    let
        data =
            dataFromUrl (path ++ "seattle-weather.csv") []

        cfg =
            configure
                << configuration (coView [ vicoStrokeWidth 0, vicoStep 15 ])
                << configuration (coAxis [ axcoDomain False ])

        trans =
            transform
                -- Convert Fahrenheit to celsius
                << calculateAs "(datum.temp_max - 32) * 5 / 9" "tempC"

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pOrdinal -- Treat day of month as an ordinal category
                    , pTimeUnit date -- Extract day of month from full date
                    , pAxis [ axTitle "Day", axLabelAngle 0, axFormat "%e" ]
                    ]
                << position Y [ pName "date", pOrdinal, pTimeUnit month, pTitle "Month" ]
                << color [ mName "tempC", mAggregate opMax, mScale [ scScheme "yellowgreenblue" [ 1, 0 ] ], mTitle "" ]
    in
    toVegaLite
        [ title "Daily Max Temperatures (C) in Seattle, WA" []
        , cfg []
        , data
        , trans []
        , enc []
        , rect []
        ]
```

---

## 2d Histogram

Rather than display a scatterplot comparing two variables, we can instead 'bin' the variables into categories and count the number of observations in each category. We then use colour to show the frequency in each bin.

Here we create a 2d histogram comparing movie ratings from IMDB and Rotten Tomatoes.

```elm {v l}
histo2d : Spec
histo2d =
    let
        data =
            dataFromUrl (path ++ "movies.json") []

        enc =
            encoding
                << position X [ pName "IMDB Rating", pBin [ biMaxBins 40 ] ]
                << position Y [ pName "Rotten Tomatoes Rating", pBin [ biMaxBins 40 ] ]
                << color
                    [ mAggregate opCount
                    , mScale [ scType scSqrt ] -- Scale by square root to emphasise high freqs.
                    ]
    in
    toVegaLite [ data, enc [], rect [] ]
```

---

## Tabled Bubbleplot

Rather than use colour to symbolise values in a grid, we can size a symbol. Here frequency of daily GitHub activities is shown in a 'punched card' style with time arranged as a calendar view. This allows us to see if there are any weekly or daily patterns in GitHub activity.

```elm {v l}
punchedCard : Spec
punchedCard =
    let
        data =
            dataFromUrl (path ++ "github.csv") []

        enc =
            encoding
                << position X
                    [ pName "time"
                    , pOrdinal
                    , pTimeUnit hours -- Extract hour of day from full date-time
                    , pAxis [ axTitle "Hour of day", axLabelAngle 0 ]
                    ]
                << position Y
                    [ pName "time"
                    , pOrdinal
                    , pTimeUnit day -- Extract day of week from full date-time
                    , pTitle ""
                    ]
                << size
                    [ mName "count"
                    , mAggregate opSum -- Find total in each group
                    , mTitle "Number of activities"
                    ]
    in
    toVegaLite [ data, enc [], circle [] ]
```

---

## 'Lasagna chart' (dense time-series heatmap)

For regular sampling over time we can colour by magnitude and separate different categories vertically. Can be useful when showing many categories that would otherwise be too complex as a multi-line chart.

```elm {v l}
lasagna : Spec
lasagna =
    let
        data =
            dataFromUrl (path ++ "stocks.csv") []

        trans =
            transform
                << filter (fiExpr "datum.symbol !== 'GOOG'")

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pOrdinal
                    , pTimeUnit yearMonthDate
                    , pAxis
                        [ axTitle ""
                        , axFormat "%Y"
                        , axLabelAngle 0
                        , axLabelOverlap osNone
                        , axDataCondition
                            (fiEqual "value" (dt [ dtMonth Jan, dtDate 1 ]) |> fiOpTrans (mTimeUnit monthDate))
                            (cAxLabelColor "black" "")
                        , axDataCondition
                            (fiEqual "value" (dt [ dtMonth Jan, dtDate 1 ]) |> fiOpTrans (mTimeUnit monthDate))
                            (cAxTickColor "black" "")
                        ]
                    ]
                << position Y [ pName "symbol", pTitle "" ]
                << color
                    [ mAggregate opSum
                    , mName "price"
                    , mTitle "Price"
                    , mLegend [ leGradientLength 100, leGradientThickness 10 ]
                    ]

        cfg =
            configure
                << configuration (coScale [ sacoBandPaddingInner 0, sacoBandPaddingOuter 0 ])
                << configuration (coText [ maBaseline vaMiddle ])
    in
    toVegaLite [ width 400, height 120, cfg [], data, trans [], enc [], rect [] ]
```

---

## Annotated grid

When colour does not provide sufficient detail to convey values, we can overlay a text annotation on a tabled view.

```elm {v l}
labelledGrid : Spec
labelledGrid =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        encPosition =
            encoding
                << position X [ pName "Cylinders", pAxis [ axLabelAngle 0 ] ]
                << position Y [ pName "Origin", pTitle "" ]

        -- Separate encoding for rectangles
        encRect =
            encoding
                << color
                    [ mAggregate opCount -- Count number of values
                    , mScale [ scScheme "reds" [ 0.5, 1 ] ] -- Darker end of range so text visible
                    , mTitle "Number of cars"
                    ]

        specRect =
            asSpec [ encRect [], rect [] ]

        -- Separate encoding for text overlay
        encText =
            encoding
                << text [ tAggregate opCount ]

        specText =
            asSpec [ textMark [ maColor "white", maBaseline vaMiddle ], encText [] ]
    in
    toVegaLite
        [ width 200
        , height 100
        , data
        , encPosition [] -- Position encoding commmon to both rectangles and text.
        , layer [ specRect, specText ] -- Layer the text spec on top of rectangle spec
        ]
```

---

## ISOTYPE chart

Creating charts using symbols, following the [isotype](https://eagereyes.org/techniques/isotype) (**i**nternational **s**ystem **o**f **ty**pographic **p**icture **e**ducation) design approach, can be achieved by creating tables of custom symbols. This example creates a pair of ISOTYPE frequency histograms comparing British and US agricultural output (reproducing the chart in [Only An Ocean Between, 1943. Population Live Stock, p.13](https://eagereyes.org/isotope-books/isotype-book-florence-only-an-ocean-between)).

We first create a tidy table where `col` represents the position in the column position in the chart corresponding to the count in each category. For example, to depict a count of 3 items in a category we would have column value entries for 0, 1 and 2; to depict a count of 7 we would have column value entries from 0 to 8:

```elm {l}
animalTable : Table
animalTable =
    [ -- count, "country, animal"
      List.repeat 3 "GB,cattle"
    , List.repeat 2 "GB,pigs"
    , List.repeat 10 "GB,sheep"
    , List.repeat 9 "US,cattle"
    , List.repeat 6 "US,pigs"
    , List.repeat 7 "US,sheep"
    ]
        |> Tidy.fromGridRows
        |> Tidy.bisect "z"
            (\s -> ( String.left 2 s, String.dropLeft 3 s ))
            ( "country", "animal" )
        |> Tidy.removeColumn "row"
```

```elm {m}
display : List String
display =
    Tidy.tableSummary 6 animalTable
```

To display the chart we create custom SVG paths for each animal type (`cowPath`, `pigPath` and `sheepPath`) along with custom colours for each, extracting the count and category data from the tidy table.

```elm {v l}
isotype : Spec
isotype =
    let
        cowPath =
            "M4 -2c0 0 0.9 -0.7 1.1 -0.8c0.1 -0.1 -0.1 0.5 -0.3 0.7c-0.2 0.2 1.1 1.1 1.1 1.2c0 0.2 -0.2 0.8 -0.4 0.7c-0.1 0 -0.8 -0.3 -1.3 -0.2c-0.5 0.1 -1.3 1.6 -1.5 2c-0.3 0.4 -0.6 0.4 -0.6 0.4c0 0.1 0.3 1.7 0.4 1.8c0.1 0.1 -0.4 0.1 -0.5 0c0 0 -0.6 -1.9 -0.6 -1.9c-0.1 0 -0.3 -0.1 -0.3 -0.1c0 0.1 -0.5 1.4 -0.4 1.6c0.1 0.2 0.1 0.3 0.1 0.3c0 0 -0.4 0 -0.4 0c0 0 -0.2 -0.1 -0.1 -0.3c0 -0.2 0.3 -1.7 0.3 -1.7c0 0 -2.8 -0.9 -2.9 -0.8c-0.2 0.1 -0.4 0.6 -0.4 1c0 0.4 0.5 1.9 0.5 1.9l-0.5 0l-0.6 -2l0 -0.6c0 0 -1 0.8 -1 1c0 0.2 -0.2 1.3 -0.2 1.3c0 0 0.3 0.3 0.2 0.3c0 0 -0.5 0 -0.5 0c0 0 -0.2 -0.2 -0.1 -0.4c0 -0.1 0.2 -1.6 0.2 -1.6c0 0 0.5 -0.4 0.5 -0.5c0 -0.1 0 -2.7 -0.2 -2.7c-0.1 0 -0.4 2 -0.4 2c0 0 0 0.2 -0.2 0.5c-0.1 0.4 -0.2 1.1 -0.2 1.1c0 0 -0.2 -0.1 -0.2 -0.2c0 -0.1 -0.1 -0.7 0 -0.7c0.1 -0.1 0.3 -0.8 0.4 -1.4c0 -0.6 0.2 -1.3 0.4 -1.5c0.1 -0.2 0.6 -0.4 0.6 -0.4z"

        pigPath =
            "M1.2 -2c0 0 0.7 0 1.2 0.5c0.5 0.5 0.4 0.6 0.5 0.6c0.1 0 0.7 0 0.8 0.1c0.1 0 0.2 0.2 0.2 0.2c0 0 -0.6 0.2 -0.6 0.3c0 0.1 0.4 0.9 0.6 0.9c0.1 0 0.6 0 0.6 0.1c0 0.1 0 0.7 -0.1 0.7c-0.1 0 -1.2 0.4 -1.5 0.5c-0.3 0.1 -1.1 0.5 -1.1 0.7c-0.1 0.2 0.4 1.2 0.4 1.2l-0.4 0c0 0 -0.4 -0.8 -0.4 -0.9c0 -0.1 -0.1 -0.3 -0.1 -0.3l-0.2 0l-0.5 1.3l-0.4 0c0 0 -0.1 -0.4 0 -0.6c0.1 -0.1 0.3 -0.6 0.3 -0.7c0 0 -0.8 0 -1.5 -0.1c-0.7 -0.1 -1.2 -0.3 -1.2 -0.2c0 0.1 -0.4 0.6 -0.5 0.6c0 0 0.3 0.9 0.3 0.9l-0.4 0c0 0 -0.4 -0.5 -0.4 -0.6c0 -0.1 -0.2 -0.6 -0.2 -0.5c0 0 -0.4 0.4 -0.6 0.4c-0.2 0.1 -0.4 0.1 -0.4 0.1c0 0 -0.1 0.6 -0.1 0.6l-0.5 0l0 -1c0 0 0.5 -0.4 0.5 -0.5c0 -0.1 -0.7 -1.2 -0.6 -1.4c0.1 -0.1 0.1 -1.1 0.1 -1.1c0 0 -0.2 0.1 -0.2 0.1c0 0 0 0.9 0 1c0 0.1 -0.2 0.3 -0.3 0.3c-0.1 0 0 -0.5 0 -0.9c0 -0.4 0 -0.4 0.2 -0.6c0.2 -0.2 0.6 -0.3 0.8 -0.8c0.3 -0.5 1 -0.6 1 -0.6z"

        sheepPath =
            "M-4.1 -0.5c0.2 0 0.2 0.2 0.5 0.2c0.3 0 0.3 -0.2 0.5 -0.2c0.2 0 0.2 0.2 0.4 0.2c0.2 0 0.2 -0.2 0.5 -0.2c0.2 0 0.2 0.2 0.4 0.2c0.2 0 0.2 -0.2 0.4 -0.2c0.1 0 0.2 0.2 0.4 0.1c0.2 0 0.2 -0.2 0.4 -0.3c0.1 0 0.1 -0.1 0.4 0c0.3 0 0.3 -0.4 0.6 -0.4c0.3 0 0.6 -0.3 0.7 -0.2c0.1 0.1 1.4 1 1.3 1.4c-0.1 0.4 -0.3 0.3 -0.4 0.3c-0.1 0 -0.5 -0.4 -0.7 -0.2c-0.3 0.2 -0.1 0.4 -0.2 0.6c-0.1 0.1 -0.2 0.2 -0.3 0.4c0 0.2 0.1 0.3 0 0.5c-0.1 0.2 -0.3 0.2 -0.3 0.5c0 0.3 -0.2 0.3 -0.3 0.6c-0.1 0.2 0 0.3 -0.1 0.5c-0.1 0.2 -0.1 0.2 -0.2 0.3c-0.1 0.1 0.3 1.1 0.3 1.1l-0.3 0c0 0 -0.3 -0.9 -0.3 -1c0 -0.1 -0.1 -0.2 -0.3 -0.2c-0.2 0 -0.3 0.1 -0.4 0.4c0 0.3 -0.2 0.8 -0.2 0.8l-0.3 0l0.3 -1c0 0 0.1 -0.6 -0.2 -0.5c-0.3 0.1 -0.2 -0.1 -0.4 -0.1c-0.2 -0.1 -0.3 0.1 -0.4 0c-0.2 -0.1 -0.3 0.1 -0.5 0c-0.2 -0.1 -0.1 0 -0.3 0.3c-0.2 0.3 -0.4 0.3 -0.4 0.3l0.2 1.1l-0.3 0l-0.2 -1.1c0 0 -0.4 -0.6 -0.5 -0.4c-0.1 0.3 -0.1 0.4 -0.3 0.4c-0.1 -0.1 -0.2 1.1 -0.2 1.1l-0.3 0l0.2 -1.1c0 0 -0.3 -0.1 -0.3 -0.5c0 -0.3 0.1 -0.5 0.1 -0.7c0.1 -0.2 -0.1 -1 -0.2 -1.1c-0.1 -0.2 -0.2 -0.8 -0.2 -0.8c0 0 -0.1 -0.5 0.4 -0.8z"

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "col" (animalTable |> Tidy.numColumn "col" |> nums)
                << dataColumn "animal" (animalTable |> Tidy.strColumn "animal" |> strs)
                << dataColumn "country" (animalTable |> Tidy.strColumn "country" |> strs)

        enc =
            encoding
                << position X [ pName "col", pAxis [] ]
                << position Y [ pName "animal", pAxis [] ]
                << row [ fName "country", fHeader [ hdTitle "" ] ]
                << shape
                    [ mName "animal"
                    , mScale
                        (categoricalDomainMap
                            [ ( "cattle", cowPath )
                            , ( "pigs", pigPath )
                            , ( "sheep", sheepPath )
                            ]
                        )
                    , mLegend []
                    ]
                << color
                    [ mName "animal"
                    , mLegend []
                    , mScale
                        (categoricalDomainMap
                            [ ( "cattle", "rgb(194,81,64)" )
                            , ( "pigs", "rgb(93,93,93)" )
                            , ( "sheep", "rgb(91,131,149)" )
                            ]
                        )
                    ]
    in
    toVegaLite
        [ cfg []
        , width 800
        , height 200
        , data []
        , enc []
        , point [ maFilled True, maOpacity 1, maSize 200 ]
        ]
```

## Vector Field

We can use the [angle channel](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#angle) to orient a directional shape by some data value. Here we show wind direction and strength over NW Europe.

```elm {v l}
windVectorField : Spec
windVectorField =
    let
        cfg =
            configure
                << configuration (coView [ vicoStep 10, vicoFill (Just "black") ])

        data =
            dataFromUrl (path ++ "windvectors.csv") []

        geoData =
            dataFromUrl (path ++ "europe/nwEuropeLand.json") [ topojsonFeature "ne_10m_land" ]

        proj =
            projection [ prType equalEarth ]

        geoSpec =
            asSpec [ geoData, geoshape [ maStroke "white", maStrokeWidth 0.4, maFilled False ] ]

        enc =
            encoding
                << position Longitude [ pName "longitude" ]
                << position Latitude [ pName "latitude" ]
                << color
                    [ mName "dir"
                    , mQuant
                    , mLegend []
                    , mScale [ scDomain (doNums [ 0, 360 ]), scScheme "rainbow" [] ]
                    ]
                << angle
                    [ mName "dir"
                    , mQuant
                    , mScale [ scDomain (doNums [ 0, 360 ]), scRange (raNums [ 180, 540 ]) ]
                    ]
                << size [ mName "speed", mQuant ]

        windSpec =
            asSpec [ data, enc [], point [ maShape symWedge ] ]
    in
    toVegaLite
        [ cfg []
        , width 600
        , height 560
        , proj
        , layer [ geoSpec, windSpec ]
        ]
```
