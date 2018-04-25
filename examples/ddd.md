---
id: "litvis"
elm:
    dependencies:
        gicentre/elm-vega: latest
narrative-schemas:
        - ../narrative-schemas/ddd
---

@import "assets/robotoStyle.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

# Dynamic Design Documents

_This is an example of a dynamic design document where design options are offered to users of the visualization in order to solicit feedback from those most likely to benefit from it and have knowledge and expertise in the context of its use._

## Representing Signals Geographically

Here is a map of the reporting areas with familiar colours representing the eight different NPUs.
The sizes of the units vary considerably.
To show a summary visualization in each area requires us to make all reporting areas the same size. We can do this with a tile map, which will distort the familiar geography.

```elm {v}
fig1 : Spec
fig1 =
    toVegaLite [ config, layer [ geoMap 300 ] ]
```

This tile map uses the same colours to show NPUs.
The reporting areas are well aligned, and the overall layout represents the original geography well.
There is now room to add information for each reporting area in the map.

```elm {v}
fig2 : Spec
fig2 =
    toVegaLite [ config, layer [ gridMapSpec 300 FixedOpacity ] ]
```

## Comparing Multiple Maps

Since we have made the graphics in the neighbourhoods quite simple, we are able to make them small, and view crime signals in multiple maps simultaneously. Here we facet on crime type.
We have have added an opacity slider for the background.

{(userQuestion|}

What opacity levels work for you?
Is there a mid-point between NPU legibility and signal pop-out?

{|userQuestion)}

```elm {v interactive}
gridmapCrimes : Spec
gridmapCrimes =
    let
        crimeData =
            dataFromUrl "https://gicentre.github.io/data/westMidlands/westMidsCrimesShort.tsv" []

        crimeTrans =
            transform
                << filter (FExpr "datum.month == '2016-06'")
                << filter (FExpr "abs(datum.runs) >= 7")
                << calculateAs "11 - datum.gridY" "gridN"
                << calculateAs "datum.gridX - 1" "gridE"
                << calculateAs "datum.zScore < 0 ? 'low' : 'high'" "crimeCats"

        res =
            resolve << resolution (RScale [ ( ChColor, Independent ) ])

        w =
            220
    in
    toVegaLite
        [ config
        , crimeData
        , crimeTrans []
        , facet [ RowBy [ FName "crimeType", FmType Ordinal, FHeader [ HTitle "" ] ] ]
        , specification (asSpec [ res [], layer [ gridMapSpec w UserOpacity, crimeOverlay w ] ])
        ]
```

---

```elm {l=hidden}
geoMap : Float -> Spec
geoMap w =
    asSpec
        [ width w
        , height (w / 1.54)
        , dataFromUrl "https://gicentre.github.io/data/westMidlands/westMidsTopo.json" [ TopojsonFeature "NPU" ]
        , mark Geoshape [ MStroke "white", MStrokeWidth (w * 0.00214) ]
        , encoding (color [ MName "id", MmType Nominal, MScale npuColours, MLegend [] ] [])
        ]


gridMapSpec : Float -> OpacityVal -> Spec
gridMapSpec w op =
    let
        gSize =
            w / 26

        gridData =
            dataFromUrl "https://gicentre.github.io/data/westMidlands/westMidsGridmapOpacity.tsv" []

        gridTrans =
            case op of
                FixedOpacity ->
                    transform
                        << filter (FExpr "datum.opacity == 100")
                        << calculateAs "11 - datum.gridY" "gridN"
                        << calculateAs "datum.gridX - 1" "gridE"

                UserOpacity ->
                    transform
                        << filter (FSelection "userOpacity")
                        << calculateAs "11 - datum.gridY" "gridN"
                        << calculateAs "datum.gridX - 1" "gridE"

        gridEnc =
            encoding
                << position X [ PName "gridE", PmType Quantitative, PAxis [] ]
                << position Y [ PName "gridN", PmType Quantitative, PAxis [] ]
                << color [ MName "NPU", MmType Nominal, MScale npuColours, MLegend [] ]
                << size [ MNumber ((gSize - 1) * (gSize - 1)) ]

        gridSel =
            selection
                << select "userOpacity"
                    Single
                    [ Fields [ "opacity" ]
                    , Bind [ IRange "opacity" [ InName "Opacity ", InMin 0, InMax 100, InStep 10 ] ]
                    , Empty
                    ]
    in
    case op of
        FixedOpacity ->
            asSpec
                [ width w
                , height (w / 2.36)
                , gridData
                , gridTrans []
                , (gridEnc << opacity [ MNumber 1 ]) []
                , mark Square []
                ]

        UserOpacity ->
            asSpec
                [ width w
                , height (w / 2.36)
                , gridData
                , gridTrans []
                , gridSel []
                , (gridEnc
                    << opacity
                        [ MName "opacity"
                        , MmType Quantitative
                        , MScale [ SDomain (DNumbers [ 40, 100 ]) ]
                        , MLegend []
                        ]
                  )
                    []
                , mark Square []
                ]


crimeOverlay : Float -> Spec
crimeOverlay w =
    let
        crimeEnc =
            encoding
                << position X [ PName "gridE", PmType Quantitative, PAxis [] ]
                << position Y [ PName "gridN", PmType Quantitative, PAxis [] ]
                << shape [ MName "crimeCats", MmType Nominal, MScale crimeSymbols, MLegend [] ]
                << color [ MName "crimeCats", MmType Nominal, MScale crimeColours, MLegend [] ]
                << opacity [ MNumber 1 ]
                << size [ MNumber (w / 3) ]
    in
    asSpec [ width w, height (w / 2.36), crimeEnc [], mark Point [ MFilled True ] ]


type OpacityVal
    = FixedOpacity
    | UserOpacity


npuColours : List ScaleProperty
npuColours =
    categoricalDomainMap
        [ ( "Birmingham East", "#197F8E" )
        , ( "Birmingham West", "#A11F43" )
        , ( "Coventry", "#02B395" )
        , ( "Dudley", "#94C607" )
        , ( "Sandwell", "#18324A" )
        , ( "Solihull", "#FF6528" )
        , ( "Walsall", "#DC102F" )
        , ( "Wolverhampton", "#FFBA01" )
        ]


crimeSymbols =
    categoricalDomainMap
        [ ( "high", "triangle-up" )
        , ( "low", "triangle-down" )
        ]


crimeColours : List ScaleProperty
crimeColours =
    categoricalDomainMap
        [ ( "high", "rgb(202,0,32)" )
        , ( "low", "rgb(5,113,176)" )
        ]


config =
    configure (configuration (View [ Stroke Nothing ]) [])
```
