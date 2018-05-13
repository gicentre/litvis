---
id: "litvis"
narrative-schemas:
  - ../narrative-schemas/dialogue
elm:
    dependencies:
        gicentre/elm-vega: latest
---

@import "assets/litvis.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

_LitVis note: This is an example of some literate visualization we might use to think about a 'Socratic dialogue' schema to encourage design justicication.
The narrative form of Socratic dialogue is an imaginary conversation between two people, one, often playing the 'simple man' (Socrates) querying the 'wise man'.
Currently blocks are styled with css classes referencing a custom stylesheet in the frontmatter, but we might consider how a schema could be used to in associated with a generated template litvis document with the headings defined._

# London Air Pollution

In July 2017, [Cyclists In The City](https://twitter.com/citycyclists/status/891926308833382400?ref_src=twsrc%5Etfw) observed a 'rare low pollition day' in London while a small number of roads were closed for a mass participation cycling event.

They showed a line chart representing concentration levels of Oxides of Nitrogen (NOx) in the air at Putney High Street during the Sunday when the road was closed along with the levels for the preceding 6 days as well as the day after the event.
They claimed this provided evidence of the benifical effect of the road closure.

The concentration of pollutants certainly seemed lower on the Sunday, but with a sample of only eight days covering only one Sunday, it wasn't clear how representative this contrast was.

{( voiceA |}

What are you trying to achieve with this visualization?

{| voiceA )}

{( voiceB |}

To design a more robust visualization that demonstrates whether or not the 'closed road Sunday' has different NOx levels compared to 'normal' Sundays.

To provide an impactful design that supports a 'call to action' to encourage a reduction in vehicle-induced pollutants.

{| voiceB )}

{( voiceA |}

Why have you chosen this data source and sample?

{| voiceA )}

{( voiceB |}

There are few regular sources of pollution monitoring data in London.
The most widespread are distributed as part of the [London Air Quality Network](http://www.londonair.org.uk/london/asp/datadownload.asp).
This was also the source used by Cyclists In The City, so provides a basis for comparison.

### Temporal Sample

Data to be sampled for Sundays through the year including the Sundays of closed roads.
The annual 'Ride London' events that result in closed roads are always on Sundays, so can compare like-with-like.
It is possible that it might be more comparable to compare only Sundays in July so as to adjust for seasonal changes, but this would reduce the sample size significantly.
Initial inspection suggests there is no strong seasonal effect.

### Spatial Sample

Initially selected just Putney 'High Street Facade' which was also the location of the original post so comparisons can be made.

### Measurement Sample

Some readings are 'unratified' and subject to measurement error.
No evidence of systematic bias in errors has been uncovered.
The only filtering was to remove erroneous negative values.

```elm {l v siding}
airPollution : Spec
airPollution =
    let
        data =
            dataFromUrl "https://gicentre.github.io/data/putneyAirQuality.csv" [ parse [ ( "dateTime", foDate "%Y-%m-%dT%H:%M" ) ] ]

        trans =
            transform
                << filter (fiExpr "datum.reading > 0")
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"

        enc =
            encoding
                << position X [ pName "time of day", pMType Quantitative ]
                << position Y [ pName "reading", pMType Quantitative ]
                << detail [ dName "day", dMType Ordinal ]
    in
    toVegaLite [ data, trans [], line [], enc [] ]
```

{| voiceB )}

{( voiceA |}

Why have you made these visual mark design choices?

{| voiceA )}

{( voiceB |}

- Roadside emission data are very peaky during the day, so it makes sense to overly the NOx levels for each 24 hour period to avoid having to spot patterns in rapidly oscillating signals.
- There are many hundreds of profiles, so need to be symbolised with thin semi-transparent lines that scale well when overlaid.
- Need to distinguish clearly between the 'Ride London' Sundays and all others while affording comparison, so using hue and line thickness to do this.
- Can summarise the complexity of the many hundreds of Sunday readings with an average making the 24 hour trend clearer.
- To reduce visual clutter, only show grid lines at 4 hour intervals. This helps also to anchor the day at midday.

```elm {v siding}
airPollution : Spec
airPollution =
    let
        data =
            dataFromUrl "https://gicentre.github.io/data/putneyAirQuality.csv"
                [ parse [ ( "dateTime", foDate "%Y-%m-%dT%H:%M" ) ] ]

        backgroundTrans =
            transform
                << filter (fiExpr "datum.reading > 0")
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"

        backgroundEnc =
            encoding
                << position X
                    [ pName "time of day"
                    , pMType Quantitative
                    , pAxis [ axValues [ 0, 4, 8, 12, 16, 20, 24 ], axFormat "05.2f" ]
                    ]
                << position Y
                    [ pName "reading"
                    , pMType Quantitative
                    , pAxis [ axValues [ 250, 500, 750, 1000 ], axTitle "Oxides of Nitrogen (μg m-3 )" ]
                    ]
                << detail [ dName "day", dMType Ordinal ]
                << color [ mStr "#200" ]
                << opacity [ mNum 0.5 ]

        backgroundSpec =
            asSpec [ backgroundTrans [], line [ maStrokeWidth 0.1 ], backgroundEnc [] ]

        avTrans =
            transform
                << filter (fiExpr "datum.reading > 0")
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"

        avEnc =
            encoding
                << position X [ pName "time of day", pMType Quantitative ]
                << position Y [ pAggregate Mean, pName "reading", pMType Quantitative ]
                << color [ mStr "#000" ]
                << opacity [ mNum 0.2 ]

        avSpec =
            asSpec [ avTrans [], line [ maStrokeWidth 4, maInterpolate Monotone ], avEnc [] ]

        rideTrans =
            transform
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"
                << filter (fiExpr "(year(datum.dateTime) == 2016 && month(datum.dateTime) == 6 && date(datum.dateTime) == 31) || (year(datum.dateTime) == 2015 && month(datum.dateTime) == 7 && date(datum.dateTime) == 2) || (year(datum.dateTime) == 2014 && month(datum.dateTime) == 7 && date(datum.dateTime) == 10) || (year(datum.dateTime) == 2013 && month(datum.dateTime) == 7 && date(datum.dateTime) == 4)")
                << filter (fiExpr "datum.reading > 0")

        rideEnc =
            encoding
                << position X [ pName "time of day", pMType Quantitative ]
                << position Y [ pName "reading", pMType Quantitative ]
                << detail [ dName "day", dMType Ordinal ]
                << color [ mStr "rgb(202,0,0)" ]

        rideSpec =
            asSpec [ rideTrans [], line [ maStrokeWidth 1, maInterpolate Monotone ], rideEnc [] ]
    in
    toVegaLite [ width 500, height 300, background "white", data, layer [ backgroundSpec, avSpec, rideSpec ] ]
```

### Iteration 3

> _Litvis Note: The commentary here is more about goal setting than justification, but feels a natural way of 'thinking aloud' while designing. Do we want to support/encourge this?_

- Most of the variation is in the 0-300 μg m-3 range, but the less frequent peaks dominate the scaling.
  Perhaps better to scale to the lower part of the range.
- Maximum EU NO2 limits are 200 μg m-3 in an hour and 40 μg m-3 average over the year.
  Would be good to show these, and by implication, how far above the limits 'normal' Sundays are, helping to meet objective II.
  It would be good to somehow anchor the chart to these legal limits in order to frame the data.

```elm {v siding}
airPollution : Spec
airPollution =
    let
        data =
            dataFromUrl "https://gicentre.github.io/data/putneyAirQuality.csv" [ Parse [ ( "dateTime", FoDate "%Y-%m-%dT%H:%M" ) ] ]

        backgroundTrans =
            transform
                << filter (fiExpr "datum.reading > 0")
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"

        backgroundEnc =
            encoding
                << position X
                    [ pName "time of day"
                    , pMType Quantitative
                    , pAxis [ axValues [ 0, 4, 8, 12, 16, 20, 24 ], axFormat "05.2f", axTitle "Time of day" ]
                    ]
                << position Y
                    [ pName "reading"
                    , pMType Quantitative
                    , pScale [ scDomain (doNums [ 0, 600 ]) ]
                    , pAxis [ axTitle "Oxides of Nitrogen (μg m-3 )" ]
                    ]
                << detail [ dName "day", dMType Ordinal ]
                << color [ mStr "#200" ]
                << opacity [ mNum 0.5 ]

        backgroundSpec =
            asSpec [ backgroundTrans [], line [ maClip True, maStrokeWidth 0.1 ], backgroundEnc [] ]

        avTrans =
            transform
                << filter (fiExpr "datum.reading > 0")
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"

        avEnc =
            encoding
                << position X [ pName "time of day", pMType Quantitative ]
                << position Y [ pAggregate Mean, pName "reading", pMType Quantitative, pAxis [] ]
                << color [ mStr "#000" ]
                << opacity [ mNum 0.2 ]

        avSpec =
            asSpec [ avTrans [], line [ maStrokeWidth 4, maInterpolate Monotone ], avEnc [] ]

        limitsData =
            dataFromColumns []
                << dataColumn "EULimits" (nums [ 200, 40 ])
                << dataColumn "max" (nums [ 600, 600 ])

        limitsEnc =
            encoding
                << position Y
                    [ pName "EULimits"
                    , pMType Quantitative
                    , pAxis
                        [ axTitle "EU limits: : 40 μg m-3 annaul average, 200 μg m-3 maximum in any hour"
                        , axValues [ 40, 200 ]
                        ]
                    ]
                << position Y2 [ pName "max", pMType Quantitative ]
                << color [ mStr "rgb(173,118,66)" ]
                << opacity [ mNum 0.15 ]

        limitsSpec =
            asSpec [ limitsData [], rect [], limitsEnc [] ]

        rideTrans =
            transform
                << calculateAs "datetime(year(datum.dateTime),month(datum.dateTime),date(datum.dateTime))" "day"
                << calculateAs "hours(datum.dateTime)+(minutes(datum.dateTime)/60)" "time of day"
                << filter (fiExpr "(year(datum.dateTime) == 2016 && month(datum.dateTime) == 6 && date(datum.dateTime) == 31) || (year(datum.dateTime) == 2015 && month(datum.dateTime) == 7 && date(datum.dateTime) == 2) || (year(datum.dateTime) == 2014 && month(datum.dateTime) == 7 && date(datum.dateTime) == 10) || (year(datum.dateTime) == 2013 && month(datum.dateTime) == 7 && date(datum.dateTime) == 4)")
                << filter (fiExpr "datum.reading > 0")

        rideEnc =
            encoding
                << position X [ pName "time of day", pMType Quantitative ]
                << position Y [ pName "reading", pMType Quantitative, pAxis [] ]
                << detail [ dName "day", dMType Ordinal ]
                << color [ mStr "rgb(202,0,0)" ]

        rideSpec =
            asSpec [ rideTrans [], line [ maStrokeWidth 1, maInterpolate Monotone ], rideEnc [] ]

        res =
            resolve
                << resolution (reAxis [ ( ChY, Independent ) ])

        annotationData =
            dataFromColumns []
                << dataColumn "text"
                    (strs
                        [ "Airborne Pollution, Putney High Street Facade"
                        , "All Sundays between 2013 and 2017"
                        , "Ride London Sundays 2013-2016"
                        ]
                    )
                << dataColumn "x" (nums [ 0.5, 0.5, 0.5 ])
                << dataColumn "y" (nums [ 570, 550, 530 ])
                << dataColumn "titleType" (strs [ "title", "subtitle1", "subtitle2" ])

        annotationEnc =
            encoding
                << position X [ pName "x", pMType Quantitative ]
                << position Y [ pName "y", pMType Quantitative ]
                << color
                    [ mName "titleType"
                    , mMType Nominal
                    , mScale (categoricalDomainMap [ ( "title", "#000" ), ( "subtitle1", "#666" ), ( "subtitle2", "#b00" ) ])
                    , mLegend []
                    ]
                << size [ mNum 14 ]
                << text [ tName "text", tMType Nominal ]

        annotationSpec =
            asSpec [ annotationData [], textMark [ maAlign AlignLeft ], annotationEnc [] ]
    in
    toVegaLite
        [ width 500
        , height 300
        , data
        , res []
        , layer [ limitsSpec, backgroundSpec, avSpec, rideSpec, annotationSpec ]
        ]
```

> _Litvis Note: The example above is a good one to illustrate a 'rejected' branch.
> The intention and justification seem sound, but the result is not very effective, but with some lessons that may be applied to a final accepted design (e.g. shaded regions rather than lines don't work well making the chart too 'busy')_

{| voiceB )}

{( voiceA |}

To what extent does your visualization meet your original objectives?

{| voiceA )}

{( voiceB |}

{| voiceB )}

{( voiceA |}

What would you like to be able to do but were unable to in this instance?

{| voiceA )}

{( voiceB |}

{| voiceB )}

{( voiceA |}

What would you do differently if you were to start the project again?

{| voiceA )}

{( voiceB |}

{| voiceB )}
