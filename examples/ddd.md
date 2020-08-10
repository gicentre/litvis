---
id: "litvis"
elm:
  dependencies:
    gicentre/elm-vegalite: latest
narrative-schemas:
  - ../narrative-schemas/ddd
---

@import "assets/robotoStyle.less"

```elm {l=hidden}
import VegaLite exposing (..)


path : String
path =
    "https://gicentre.github.io/data/"
```

# Dynamic Design Documents

_This is an example of a dynamic design document where design options are offered to users of the visualization in order to solicit feedback from those most likely to benefit from it and have knowledge and expertise in the context of its use._

## Representing Signals Geographically

Here is a map of the reporting areas with familiar colours representing the eight different NPUs.
The sizes of the units vary considerably. To show a summary visualization in each area requires us to make all reporting areas the same size. We can do this with a tile map, which will distort the familiar geography.

```elm {v}
fig1 : Spec
fig1 =
    toVegaLite [ cfg [], layer [ geoMap 300 ] ]
```

This tile map uses the same colours to show NPUs. The reporting areas are well aligned, and the overall layout represents the original geography well. There is now room to add information for each reporting area in the map.

```elm {v}
fig2 : Spec
fig2 =
    toVegaLite [ cfg [], layer [ gridMapSpec 300 FixedOpacity ] ]
```

## Comparing Multiple Maps

Since we have made the graphics in the neighbourhoods quite simple, we are able to make them small, and view crime signals in multiple maps simultaneously. Here we facet on crime type. We have have added an opacity slider for the background.

{(userQuestion|}

What opacity levels work for you? Is there a mid-point between NPU legibility and signal pop-out?

{|userQuestion)}

```elm {v interactive}
gridmapCrimes : Spec
gridmapCrimes =
    let
        crimeData =
            dataFromUrl (path ++ "westMidlands/westMidsCrimesShort.tsv") []

        crimeTrans =
            transform
                << filter (fiExpr "datum.month == '2016-06'")
                << filter (fiExpr "abs(datum.runs) >= 7")
                << calculateAs "11 - datum.gridY" "gridN"
                << calculateAs "datum.gridX - 1" "gridE"
                << calculateAs "datum.zScore < 0 ? 'low' : 'high'" "crimeCats"

        res =
            resolve << resolution (reScale [ ( chColor, reIndependent ) ])

        w =
            220
    in
    toVegaLite
        [ cfg []
        , crimeData
        , crimeTrans []
        , facet [ rowBy [ fName "crimeType", fOrdinal, fHeader [ hdTitle "" ] ] ]
        , specification (asSpec [ res [], layer [ gridMapSpec w UserOpacity, crimeOverlay w ] ])
        ]
```

---

```elm {l=hidden}
geoMap : Float -> Spec
geoMap w =
    let
        data =
            dataFromUrl (path ++ "westMidlands/westMidsTopo.json") [ topojsonFeature "NPU" ]

        enc =
            encoding
                << color [ mName "id", mScale npuColours, mLegend [] ]
    in
    asSpec
        [ width w
        , height (w / 1.54)
        , data
        , enc []
        , geoshape [ maStroke "white", maStrokeWidth (w * 0.00214) ]
        ]


gridMapSpec : Float -> OpacityVal -> Spec
gridMapSpec w op =
    let
        gSize =
            w / 26

        gridData =
            dataFromUrl (path ++ "westMidlands/westMidsGridmapOpacity.tsv") []

        gridTrans =
            case op of
                FixedOpacity ->
                    transform
                        << filter (fiExpr "datum.opacity == 100")
                        << calculateAs "11 - datum.gridY" "gridN"
                        << calculateAs "datum.gridX - 1" "gridE"

                UserOpacity ->
                    transform
                        << filter (fiExpr "datum.opacity == userOpacity_opacity")
                        << calculateAs "11 - datum.gridY" "gridN"
                        << calculateAs "datum.gridX - 1" "gridE"

        gridEnc =
            encoding
                << position X [ pName "gridE", pQuant, pAxis [] ]
                << position Y [ pName "gridN", pQuant, pAxis [] ]
                << color [ mName "NPU", mScale npuColours, mLegend [] ]

        gridSel =
            selection
                << select "userOpacity"
                    seSingle
                    [ seFields [ "opacity" ]
                    , seInit [ ( "opacity", num 70 ) ]
                    , seBind [ iRange "opacity" [ inName "Opacity ", inMin 0, inMax 100, inStep 10 ] ]
                    , seEmpty
                    ]
    in
    case op of
        FixedOpacity ->
            asSpec
                [ width w
                , height (w / 2.36)
                , gridData
                , gridTrans []
                , gridEnc []
                , square [ maOpacity 1, maSize ((gSize - 1) * (gSize - 1)) ]
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
                        [ mName "opacity"
                        , mQuant
                        , mScale [ scDomain (doNums [ 40, 100 ]) ]
                        , mLegend []
                        ]
                  )
                    []
                , square []
                ]


crimeOverlay : Float -> Spec
crimeOverlay w =
    let
        crimeEnc =
            encoding
                << position X [ pName "gridE", pQuant, pAxis [] ]
                << position Y [ pName "gridN", pQuant, pAxis [] ]
                << shape [ mName "crimeCats", mScale crimeSymbols, mLegend [] ]
                << color [ mName "crimeCats", mScale crimeColours, mLegend [] ]
    in
    asSpec
        [ width w
        , height (w / 2.36)
        , crimeEnc []
        , point [ maOpacity 1, maSize (w / 3), maFilled True ]
        ]


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


cfg =
    configure
        << configuration (coView [ vicoStroke Nothing ])
```
