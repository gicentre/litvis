---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Faceted Charts

Charts that split views according to some categorical variable.

Examples that use data from external sources tend to use files from the Vega-Lite and giCentre data servers. For consistency the paths to these data locations are defined here:

```elm {l}
vegaPath : String
vegaPath =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"


giCentrePath : String
giCentrePath =
    "https://gicentre.github.io/data/"
```

## Faceted bar chart

Bar charts showing the reported crimes over time in the West Midlands, faceted by crime type.
Faceting is simply another form of data encoding, but rather than show different data values with different colours, or shapes or sizes, we use different charts. Here those charts are arranged horizontally with the [column](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#column) faceting operator.

```elm {v l highlight=22}
facetBars : Spec
facetBars =
    let
        data =
            dataFromUrl (giCentrePath ++ "westMidlands/westMidsCrimesAggregated.tsv") []

        crimeColours =
            categoricalDomainMap
                [ ( "Anti-social behaviour", "rgb(59,118,175)" )
                , ( "Burglary", "rgb(81,157,62)" )
                , ( "Criminal damage and arson", "rgb(141,106,184)" )
                , ( "Drugs", "rgb(239,133,55)" )
                , ( "Robbery", "rgb(132,88,78)" )
                , ( "Vehicle crime", "rgb(213,126,190)" )
                ]

        enc =
            encoding
                << position X [ pName "month", pTemporal, pTitle "" ]
                << position Y [ pName "reportedCrimes", pAggregate opSum ]
                << color [ mName "crimeType", mLegend [] ]
                << column [ fName "crimeType", fHeader [ hdTitle "" ] ]
    in
    toVegaLite [ height 100, width 120, data, enc [], bar [] ]
```

---

## Faceted Stacked Bars

Barley crop yields in 1931 and 1932 (i.e. faceted by year) shown as stacked bar
charts. The title of the collection of faceted views is controlled via [fHeader](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#fHeader), which in this case simply removes the redundant `year` title.

```elm {v l highlight=12}
facetStackedBars : Spec
facetStackedBars =
    let
        data =
            dataFromUrl (vegaPath ++ "barley.json") []

        enc =
            encoding
                << position X [ pName "yield", pAggregate opSum ]
                << position Y [ pName "variety" ]
                << color [ mName "site" ]
                << column [ fName "year", fHeader [ hdTitle "" ] ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

---

## Faceted Scatterplot

Scatterplots of US box-office takings vs profits for different MPAA film ratings.

```elm {v l highlight=11}
facetScatterplot : Spec
facetScatterplot =
    let
        data =
            dataFromUrl (vegaPath ++ "movies.json") []

        enc =
            encoding
                << position X [ pName "Worldwide Gross", pQuant ]
                << position Y [ pName "US DVD Sales", pQuant ]
                << column [ fName "MPAA Rating", fOrdinal ]
    in
    toVegaLite [ width 120, height 120, data, enc [], point [] ]
```

and the same faceted charts laid out in two columns:

```elm {v l highlight=[14,15]}
facetTwoCols : Spec
facetTwoCols =
    let
        data =
            dataFromUrl (vegaPath ++ "movies.json") []

        enc =
            encoding
                << position X [ pName "Worldwide Gross", pQuant ]
                << position Y [ pName "US DVD Sales", pQuant ]
    in
    toVegaLite
        [ data
        , columns 2
        , facetFlow [ fName "MPAA Rating", fOrdinal ]
        , specification (asSpec [ enc [], point [] ])
        ]
```

---

## Vertical Layout

Distributions of car engine power for different countries of origin. Here arranged vertically with [row](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#row).

```elm {v l highlight=11}
facetBars2 : Spec
facetBars2 =
    let
        data =
            dataFromUrl (vegaPath ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Horsepower", pBin [ biMaxBins 15 ] ]
                << position Y [ pAggregate opCount ]
                << row [ fName "Origin", fHeader [ hdTitle "" ] ]
    in
    toVegaLite [ data, enc [], bar [] ]
```

---

## Faceting with independent scales

Stock prices of five large companies as a small multiples of area charts. Here the small multiples use independent scales on the y-axis to account for the contrasting absolute prices.

```elm {v l highlight=[34-36]}
stocks : Spec
stocks =
    let
        data =
            dataFromUrl (vegaPath ++ "stocks.csv") []

        enc =
            encoding
                << position X
                    [ pName "date"
                    , pTemporal
                    , pAxis [ axFormat "%Y", axTitle "", axGrid False ]
                    ]
                << position Y
                    [ pName "price"
                    , pQuant
                    , pAxis [ axTitle "", axGrid False ]
                    ]
                << color [ mName "symbol", mLegend [] ]
                << row
                    [ fName "symbol"
                    , fHeader
                        [ hdTitle "Stock price"
                        , hdLabelAngle 0
                        , hdLabelAnchor anStart
                        ]
                    ]

        res =
            resolve
                << resolution (reScale [ ( chY, reIndependent ) ])

        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])
    in
    toVegaLite [ width 300, height 50, cfg [], data, res [], enc [], area [] ]
```

---

## Anscombe's Quartet

[Anscombe's Quartet](https://en.wikipedia.org/wiki/Anscombe%27s_quartet) famously illustrates the power of data visualization in detecting patterns not captured with numerical summaries (all four have the same means, standard deviations and correlation coefficient).

```elm {v l}
anscombe : Spec
anscombe =
    let
        data =
            dataFromUrl (vegaPath ++ "anscombe.json") []

        trans =
            transform
                << regression "Y" "X" [ rgExtent 0 20, rgAs "rx" "ry" ]

        encScatter =
            encoding
                << position X [ pName "X", pQuant, pAxis [ axTitle "", axGrid False ] ]
                << position Y [ pName "Y", pQuant, pAxis [ axTitle "", axGrid False ] ]

        encLine =
            encoding
                << position X [ pName "rx", pQuant ]
                << position Y [ pName "ry", pQuant ]

        scatter =
            asSpec [ encScatter [], circle [ maOpacity 1, maColor "black" ] ]

        rLine =
            asSpec [ trans [], encLine [], line [ maStrokeWidth 1 ] ]
    in
    toVegaLite
        [ data
        , columns 2
        , facetFlow [ fName "Series", fHeader [ hdTitle "" ] ]
        , specification (asSpec [ layer [ scatter, rLine ] ])
        ]
```

---

## Ordered Small Multiples

The 'trellis' display by Becker _et al._ helped establish small multiples as a "powerful mechanism for understanding interactions in studies of how a response depends on explanatory variables". Here reproduced as a set of small multiples of Barley yields from the 1930s, complete with ordering to facilitate comparison.

The arrangement uses [facetFlow](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#facetFlow) to create a flow layout, sorted by the median yield, and [columns](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#columns) to arrange the flow over two columns.

```elm {v l}
barleySmallMultiples : Spec
barleySmallMultiples =
    let
        data =
            dataFromUrl (vegaPath ++ "barley.json") []

        enc =
            encoding
                << position X [ pName "yield", pAggregate opMedian, pScale [ scZero False ] ]
                << position Y [ pName "variety", pOrdinal, pSort [ soByChannel chX, soDescending ] ]
                << color [ mName "year" ]
    in
    toVegaLite
        [ data
        , columns 2
        , facetFlow
            [ fName "site"
            , fSort [ soByField "yield" opMedian ]
            , fHeader [ hdTitle "" ]
            ]
        , specification (asSpec [ heightStep 12, enc [], point [] ])
        ]
```

---

## Compact Trellis Chart

Trellis charts are useful for comparing magnitudes across categories. This compact version makes it suitable for many small multiples.

```elm {v l}
trellis : Spec
trellis =
    let
        data =
            dataFromColumns []
                << dataColumn "a" (List.repeat 9 "a1" ++ List.repeat 9 "a2" ++ List.repeat 9 "a3" |> strs)
                << dataColumn "b" (List.repeat 3 "b1" ++ List.repeat 3 "b2" ++ List.repeat 3 "b3" |> List.repeat 3 |> List.concat |> strs)
                << dataColumn "c" (List.repeat 9 [ "x", "y", "z" ] |> List.concat |> strs)
                << dataColumn "p" (nums [ 0.14, 0.6, 0.03, 0.8, 0.38, 0.55, 0.11, 0.58, 0.79, 0.83, 0.87, 0.67, 0.97, 0.84, 0.9, 0.74, 0.64, 0.19, 0.57, 0.35, 0.49, 0.91, 0.38, 0.91, 0.99, 0.8, 0.37 ])

        enc =
            encoding
                << position X [ pName "p", pQuant, pAxis [ axFormat "%", axTitle "" ] ]
                << position Y [ pName "c", pAxis [] ]
                << color
                    [ mName "c"
                    , mLegend [ leOrient loBottom, leTitleOrient loLeft, leTitle "settings" ]
                    ]
                << row [ fName "a", fHeader [ hdTitle "Factor A", hdLabelAngle 0 ] ]
                << column [ fName "b", fHeader [ hdTitle "Factor B" ] ]

        res =
            resolve
                << resolution (reScale [ ( chY, reIndependent ) ])
    in
    toVegaLite [ width 60, heightStep 8, spacing 5, data [], enc [], bar [] ]
```
