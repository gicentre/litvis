---
follows: gallery
id: litvis
---

@import "../assets/litvis.less"

# Labelling and Annotation

Examples that use data from external sources tend to use files from the Vega-Lite data server. For consistency the path to the data location is defined here:

```elm {l}
path : String
path =
    "https://cdn.jsdelivr.net/npm/vega-datasets@2.1/data/"
```

## Labelled bars

Text annotations can be added by creating a separate layer containing text marks. Note that because bar position and text position match (subject to text alignment), we only need to specify the position encoding (`enc`) once.

```elm {v l}
barLabels : Spec
barLabels =
    let
        data =
            dataFromColumns []
                << dataColumn "pet" (strs [ "Cats", "Dogs", "Guinea pigs" ])
                << dataColumn "value" (nums [ 28, 55, 43 ])

        enc =
            encoding
                << position X [ pName "value", pQuant, pTitle "" ]
                << position Y [ pName "pet", pTitle "" ]

        encText =
            encoding
                << text [ tName "value" ]

        specText =
            asSpec
                [ textMark
                    [ maAlign haRight -- Align text right
                    , maBaseline vaMiddle -- Centre vertical alignment in each bar
                    , maDx -3 -- Shift left 3 pixels
                    , maColor "white" -- Contrast with bar colour
                    ]
                , encText []
                ]
    in
    toVegaLite [ data [], enc [], layer [ asSpec [ bar [] ], specText ] ]
```

---

## Compact Labelled bars

Like the previous example, but we can move the y-axis labels into the bar area and drop the horizontal axis to create a more compact representation.

```elm {v l}
compactBarLabels : Spec
compactBarLabels =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "pet" (strs [ "Cats", "Dogs", "Guinea pigs" ])
                << dataColumn "value" (nums [ 28, 55, 43 ])

        enc =
            encoding
                << position X [ pName "value", pQuant, pAxis [] ]
                << position Y
                    [ pName "pet"
                    , pTitle ""
                    , pAxis
                        [ axLabelAlign haLeft -- Align labels on left side
                        , axZIndex 1 -- Ensure labels on top of bars
                        , axLabelColor "white" -- White text against dark bars
                        , axLabelPadding -3 -- Shift labels right a little
                        , axTicks False -- No need for tick marks
                        ]
                    ]

        encText =
            encoding
                << text [ tName "value", tQuant ]

        specText =
            asSpec
                [ textMark
                    [ maAlign haRight -- Align text right
                    , maBaseline vaMiddle -- Centre vertical alignment in each bar
                    , maDx -3 -- Shift left 3 pixels
                    , maColor "white" -- Contrast with bar colour
                    ]
                , encText []
                ]
    in
    toVegaLite [ cfg [], data [], enc [], layer [ asSpec [ bar [] ], specText ] ]
```

---

## Conditional Labels

Label colour can be made dependent on a data value so that we can ensure white text on a dark background and black text on a light background. Notice also the use of emoji for category labels.

```elm {v l}
conditionalLabel : Spec
conditionalLabel =
    let
        cfg =
            configure
                << configuration (coView [ vicoStroke Nothing ])

        data =
            dataFromColumns []
                << dataColumn "fruit" (strs [ "🍊", "🍇", "🍏", "🍌", "🍐", "🍋", "🍎", "🍉" ])
                << dataColumn "count" (nums [ 21, 13, 8, 5, 3, 2, 1, 1 ])

        enc =
            encoding
                << position X
                    [ pName "count"
                    , pQuant
                    , pAxis [ axGrid False, axTitle "" ]
                    ]
                << position Y
                    [ pName "fruit"
                    , pOrdinal
                    , pSort [ soByChannel chX, soDescending ]
                    , pAxis [ axTitle "", axTicks False ]
                    ]

        barEnc =
            encoding
                << color [ mName "count", mQuant, mLegend [] ]

        specBar =
            asSpec [ barEnc [], bar [] ]

        labelEnc =
            encoding
                << text [ tName "count", tQuant ]
                << color
                    [ mDataCondition [ ( expr "datum.count > 10", [ mStr "white" ] ) ]
                        [ mStr "black" ]
                    ]

        specText =
            asSpec [ labelEnc [], textMark [ maAlign haRight, maXOffset -4 ] ]
    in
    toVegaLite [ cfg [], width 400, data [], enc [], layer [ specBar, specText ] ]
```

---

## Overlaid mean

Monthly precipitation in Seattle with the annual mean precipitation overlaid using a [rule](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#rule) mark. This is created by specifying two [layers](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#layer) – one for the bars and one for the summary line.

```elm {v l}
meanOverlay : Spec
meanOverlay =
    let
        data =
            dataFromUrl (path ++ "seattle-weather.csv") []

        encBar =
            encoding
                << position X
                    [ pName "date"
                    , pTimeUnit month
                    , pAxis [ axTitle "", axLabelAngle 0 ]
                    , pOrdinal
                    ]
                << position Y [ pName "precipitation", pAggregate opMean, pQuant ]

        specBar =
            asSpec [ encBar [], bar [] ]

        encLine =
            encoding
                << position Y [ pName "precipitation", pAggregate opMean ]

        specLine =
            asSpec [ encLine [], rule [ maSize 2, maColor "hsl(0,30%,50%)" ] ]
    in
    toVegaLite [ width 300, data, layer [ specBar, specLine ] ]
```

---

## Threshold overlay

Bar chart that highlights values beyond a threshold. The [PM2.5 value](https://laqm.defra.gov.uk/public-health/pm25.html) (a measure of air pollution) for Beijing observed over 15 days, highlighting the days when PM2.5 level is hazardous to human health.

This makes use of multiple layers. A layer containing the blue bars is combined with one containing just the red bar segments that exceed the threshold (together they are `layer0` below). Further layers with the threshold line and the text annotation are combined as `layer1`. Both `layer0` and `layer1` are combined in the final specification.

```elm {v l}
thresholdBars : Spec
thresholdBars =
    let
        data =
            dataFromColumns []
                << dataColumn "day" (nums (List.map toFloat (List.range 1 15)))
                << dataColumn "pm25" (nums [ 54.8, 112.1, 63.6, 37.6, 79.7, 137.9, 120.1, 103.3, 394.8, 199.5, 72.3, 51.1, 112.0, 174.5, 130.5 ])

        thresholdData =
            dataFromRows []
                << dataRow [ ( "ThresholdValue", num 300 ), ( "Threshold", str "hazardous" ) ]

        encBar =
            encoding
                << position X [ pName "day", pAxis [ axLabelAngle 0 ], pOrdinal ]
                << position Y [ pName "pm25", pQuant ]

        specBar =
            asSpec [ encBar [], bar [] ]

        trans =
            transform
                << filter (fiExpr "datum.pm25 >= 300")
                << calculateAs "300" "baseline"

        encUpperBar =
            encoding
                -- Bars that exceed threshold have a bottom (baseline) and top (pm25) position
                << position X [ pName "day", pAxis [ axLabelAngle 0 ], pOrdinal ]
                << position Y [ pName "baseline", pQuant ]
                << position Y2 [ pName "pm25" ]

        specUpperBar =
            asSpec [ trans [], encUpperBar [], bar [ maColor "hsl(0,40%,50%)" ] ]

        layer0 =
            asSpec [ data [], layer [ specBar, specUpperBar ] ]

        specRule =
            asSpec [ rule [], encRule [] ]

        encRule =
            encoding
                << position Y [ pName "ThresholdValue", pQuant ]

        encText =
            encoding
                << position X [ pWidth ]
                << position Y [ pName "ThresholdValue", pTitle "PM2.5 concentration", pQuant ]
                << text [ tName "Threshold" ]

        specText =
            asSpec [ encText [], textMark [ maAlign haRight, maDx -2, maDy -6 ] ]

        layer1 =
            asSpec [ thresholdData [], layer [ specRule, specText ] ]
    in
    toVegaLite [ layer [ layer0, layer1 ] ]
```

---

## Labelled lines

Atmospheric carbon dioxide by decade. As we are positioning each decade line according to its carbon dioxide values, adding a text label for each allows us to identify which line corresponds to which decade.

```elm {v l}
label3 : Spec
label3 =
    let
        data =
            dataFromUrl (path ++ "co2-concentration.csv") []

        trans =
            transform
                << calculateAs "year(datum.Date)" "year"
                << calculateAs "month(datum.Date)" "month"
                << calculateAs "floor(datum.year / 10)" "decade"
                << calculateAs "(datum.year % 10) + (datum.month / 12)" "scaledDate"

        encPosition =
            encoding
                << position X
                    [ pName "scaledDate"
                    , pAxis [ axTitle "Year into decade", axTickCount (niTickCount 10) ]
                    , pQuant
                    ]
                << position Y
                    [ pName "CO2"
                    , pScale [ scZero False ]
                    , pTitle "CO2 concentration in ppm"
                    , pQuant
                    ]

        encLine =
            encoding
                << detail [ dName "decade" ]

        specLine =
            asSpec [ encLine [], line [ maOrient moVertical ] ]

        transText =
            transform
                << aggregate [ opAs (opArgMin Nothing) "scaledDate" "aggregated" ] [ "decade" ]
                << calculateAs "datum.aggregated.scaledDate" "scaledDate"
                << calculateAs "datum.aggregated.CO2" "CO2"

        encText =
            encoding
                << text [ tName "aggregated.year" ]

        specText =
            asSpec
                [ transText []
                , encText []
                , textMark [ maSize 8, maAlign haLeft, maBaseline vaTop, maDx 2, maDy 3 ]
                ]
    in
    toVegaLite
        [ width 600
        , height 300
        , data
        , trans []
        , encPosition []
        , layer [ specLine, specText ]
        ]
```

---

## Annotated time periods

The population of the German city of Falkensee over time with annotated time periods highlighted.

```elm {v l}
falkensee : Spec
falkensee =
    let
        data =
            dataFromColumns []
                << dataColumn "year" (strs [ "1875", "1890", "1910", "1925", "1933", "1939", "1946", "1950", "1964", "1971", "1981", "1985", "1989", "1990", "1991", "1992", "1993", "1994", "1995", "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014" ])
                << dataColumn "population" (nums [ 1309, 1558, 4512, 8180, 15915, 24824, 28275, 29189, 29881, 26007, 24029, 23340, 22307, 22087, 22139, 22105, 22242, 22801, 24273, 25640, 27393, 29505, 32124, 33791, 35297, 36179, 36829, 37493, 38376, 39008, 39366, 39821, 40179, 40511, 40465, 40905, 41258, 41777 ])

        highlightData =
            dataFromColumns []
                << dataColumn "start" (strs [ "1933", "1948" ])
                << dataColumn "end" (strs [ "1945", "1989" ])
                << dataColumn "event" (strs [ "Nazi Rule", "GDR (East Germany)" ])

        encRects =
            encoding
                << position X [ pName "start", pTimeUnit year ]
                << position X2 [ pName "end", pTimeUnit year ]
                << color [ mName "event" ]

        specRects =
            asSpec [ highlightData [], encRects [], rect [ maOpacity 0.5 ] ]

        encPopulation =
            encoding
                << position X [ pName "year", pTimeUnit year, pAxis [ axTitle "", axGrid False ] ]
                << position Y [ pName "population", pQuant ]

        specLine =
            asSpec
                [ encPopulation []
                , line
                    [ maColor "#666"
                    , maInterpolate miMonotone
                    , maPoint (pmMarker [ maColor "#666" ])
                    ]
                ]
    in
    toVegaLite [ width 500, data [], layer [ specRects, specLine ] ]
```

---

## Likert Questionnaire Chart

Distributions and medians of Likert Scale Ratings from Figure 9 of [Interactive Repair of Tables Extracted from PDF Documents on Mobile Devices](http://idl.cs.washington.edu/files/2019-InteractiveTableRepair-CHI.pdf).

This example uses inline data, but any Likert-scale data source can be shown in this way.

```elm {v l}
likert : Spec
likert =
    let
        medians =
            dataFromColumns []
                << dataColumn "name" (strs [ "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:" ])
                << dataColumn "median" (nums [ 1.999976, 2, 1.999969, 2.500045, 1.500022, 2.99998, 4.500007 ])
                << dataColumn "lo" (strs [ "Easy", "Easy", "Toolbar", "Toolbar", "Toolbar", "Toolbar", "Phone" ])
                << dataColumn "hi" (strs [ "Hard", "Hard", "Gesture", "Gesture", "Gesture", "Gesture", "Tablet" ])

        values =
            dataFromColumns []
                << dataColumn "value" (strs [ "P1", "2", "2", "3", "4", "2", "5", "5", "1", "1", "P2", "2", "3", "4", "5", "5", "5", "5", "1", "1", "P3", "2", "2", "2", "1", "2", "1", "5", "1", "0", "P4", "3", "3", "2", "2", "4", "1", "5", "1", "0", "P5", "2", "2", "4", "4", "4", "5", "5", "0", "1", "P6", "1", "3", "3", "4", "4", "4", "4", "0", "1", "P7", "2", "3", "4", "5", "3", "2", "4", "0", "0", "P8", "3", "1", "2", "4", "2", "5", "5", "0", "0", "P9", "2", "3", "2", "4", "1", "4", "4", "1", "1", "P10", "2", "2", "1", "1", "1", "1", "5", "1", "1", "P11", "2", "2", "1", "1", "1", "1", "4", "1", "0", "P12", "1", "3", "2", "3", "1", "3", "3", "0", "1", "P13", "2", "2", "1", "1", "1", "1", "5", "0", "0", "P14", "3", "3", "2", "2", "1", "1", "1", "1", "1", "P15", "4", "5", "1", "1", "1", "1", "5", "1", "0", "P16", "1", "3", "2", "2", "1", "4", "5", "0", "1", "P17", "3", "2", "2", "2", "1", "3", "2", "0", "0" ])
                << dataColumn "name" (strs [ "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First", "Participant ID", "Identify Errors:", "Fix Errors:", "Easier to Fix:", "Faster to Fix:", "Easier on Phone:", "Easier on Tablet:", "Device Preference:", "Tablet_First", "Toolbar_First" ])
                << dataColumn "id" (strs [ "P1", "P1", "P1", "P1", "P1", "P1", "P1", "P1", "P1", "P1", "P2", "P2", "P2", "P2", "P2", "P2", "P2", "P2", "P2", "P2", "P3", "P3", "P3", "P3", "P3", "P3", "P3", "P3", "P3", "P3", "P4", "P4", "P4", "P4", "P4", "P4", "P4", "P4", "P4", "P4", "P5", "P5", "P5", "P5", "P5", "P5", "P5", "P5", "P5", "P5", "P6", "P6", "P6", "P6", "P6", "P6", "P6", "P6", "P6", "P6", "P7", "P7", "P7", "P7", "P7", "P7", "P7", "P7", "P7", "P7", "P8", "P8", "P8", "P8", "P8", "P8", "P8", "P8", "P8", "P8", "P9", "P9", "P9", "P9", "P9", "P9", "P9", "P9", "P9", "P9", "P10", "P10", "P10", "P10", "P10", "P10", "P10", "P10", "P10", "P10", "P11", "P11", "P11", "P11", "P11", "P11", "P11", "P11", "P11", "P11", "P12", "P12", "P12", "P12", "P12", "P12", "P12", "P12", "P12", "P12", "P13", "P13", "P13", "P13", "P13", "P13", "P13", "P13", "P13", "P13", "P14", "P14", "P14", "P14", "P14", "P14", "P14", "P14", "P14", "P14", "P15", "P15", "P15", "P15", "P15", "P15", "P15", "P15", "P15", "P15", "P16", "P16", "P16", "P16", "P16", "P16", "P16", "P16", "P16", "P16", "P17", "P17", "P17", "P17", "P17", "P17", "P17", "P17", "P17", "P17" ])

        enc =
            encoding
                << position Y
                    [ pName "name"
                    , pSort []
                    , pAxis
                        [ axDomain False
                        , axOffset 50
                        , axLabelFontWeight fwBold
                        , axTicks False
                        , axGrid True
                        , axTitle ""
                        ]
                    ]

        trans =
            transform
                << filter (fiExpr "datum.name != 'Toolbar_First'")
                << filter (fiExpr "datum.name != 'Tablet_First'")
                << filter (fiExpr "datum.name != 'Participant ID'")

        encCircle =
            encoding
                << position X
                    [ pName "value"
                    , pQuant
                    , pScale [ scDomain (doNums [ 0, 6 ]) ]
                    , pAxis [ axGrid False, axValues (nums [ 1, 2, 3, 4, 5 ]) ]
                    ]
                << size [ mAggregate opCount, mLegend [ leTitle "Number of Ratings", leOffset 75 ] ]

        specCircle =
            asSpec
                [ dataFromSource "values" []
                , trans []
                , encCircle []
                , circle [ maColor "#6eb4fd" ]
                ]

        encTick1 =
            encoding
                << position X
                    [ pName "median"
                    , pQuant
                    , pScale [ scDomain (doNums [ 0, 6 ]) ]
                    , pTitle ""
                    ]

        specTick1 =
            asSpec [ encTick1 [], tick [ maColor "black" ] ]

        encTextLo =
            encoding
                << text [ tName "lo" ]

        specTextLo =
            asSpec [ encTextLo [], textMark [ maX -5, maAlign haRight ] ]

        encTextHi =
            encoding
                << text [ tName "hi" ]

        specTextHi =
            asSpec [ encTextHi [], textMark [ maX 255, maAlign haLeft ] ]

        cfg =
            configure << configuration (coView [ vicoStroke Nothing ])
    in
    toVegaLite
        [ cfg []
        , width 250
        , height 175
        , datasets [ ( "medians", medians [] ), ( "values", values [] ) ]
        , dataFromSource "medians" []
        , title "Questionnaire Ratings" []
        , enc []
        , layer [ specCircle, specTick1, specTextLo, specTextHi ]
        ]
```
