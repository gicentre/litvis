---
id: litvis

elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

@import "assets/litvis.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

# Apache Arrow for large volume datasets

_Note: This page may take some time to show in preview as it loads large volumes of data._

[Apache Arrow](https://arrow.apache.org) is a compact binary format that can store columnar data. While its main benefit is for efficient GPU and CPU data processing, some data that you may wish to visualize can be in this format.

Data in Arrow format can be read simply by specifying [arrow](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#arrow) in the format list of [dataFromUrl](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#dataFromUrl).

```elm {l=hidden}
cfg : List LabelledSpec -> ( VLProperty, Spec )
cfg =
    configure
        << configuration (coView [ vicoStroke Nothing ])
        << configuration (coAxis [ axcoGrid False ])
```

## Brexit Polling

```elm {l v}
smallExample : Spec
smallExample =
    let
        pollData =
            dataFromUrl "https://gicentre.github.io/data/euPolls.arrow" [ arrow ]

        enc =
            encoding
                << position X
                    [ pName "Answer"
                    , pTitle ""
                    , pSort [ soCustom (strs [ "remain", "leave" ]) ]
                    ]
                << position Y
                    [ pName "Percent"
                    , pAggregate opMean
                    , pAxis [ axTitle "", axLabelExpr "datum.value+'%'" ]
                    ]
                << color [ mName "Pollster", mLegend [] ]
                << column [ fName "Pollster", fHeader [ hdTitle "" ] ]
    in
    toVegaLite [ cfg [], pollData, enc [], bar [] ]
```

## Flight Data

10,000 records in dataset.

```elm {l v}
mediumExample : Spec
mediumExample =
    let
        data =
            dataFromUrl "https://gist.githubusercontent.com/domoritz/0f53a5abde95564c36dfaac623a7a922/raw/cce3719b853e25d5dfff97a270283ba83af3c0e6/flights-10k.arrow"
                [ arrow ]

        enc =
            encoding
                << position X
                    [ pName "DEP_TIME"
                    , pQuant
                    , pAxis [ axTitle "Departure time", axLabelExpr "datum.value+':00'" ]
                    ]
                << position Y
                    [ pName "ARR_DELAY"
                    , pQuant
                    , pAxis [ axTitle "Arrival delay (minutes)" ]
                    , pScale [ scDomain (doNums [ -100, 400 ]) ]
                    ]
                << color [ mName "DISTANCE", mQuant ]
    in
    toVegaLite
        [ cfg []
        , width 500
        , height 300
        , data
        , enc []
        , circle [ maSize 4, maClip True ]
        ]
```

## Scrabble Data

A random sample of 10,000 points from a 1.5 million record [scrabble dataset](https://github.com/fivethirtyeight/data/tree/master/scrabble-games) that is 157Mb in CSV format and 47Mb in arrow format.

```elm {l v}
largeExample : Spec
largeExample =
    let
        data =
            dataFromUrl "https://gicentre.github.io/data/scrabble.arrow" [ arrow ]

        trans =
            transform
                << sample 10000

        enc =
            encoding
                << position X
                    [ pName "winnerscore"
                    , pQuant
                    , pTitle "Winner's score"
                    , pScale [ scDomain (doNums [ 0, 700 ]) ]
                    ]
                << position Y
                    [ pName "loserscore"
                    , pQuant
                    , pTitle "Loser's score"
                    , pScale [ scDomain (doNums [ 0, 700 ]) ]
                    ]
    in
    toVegaLite
        [ cfg []
        , width 500
        , height 500
        , data
        , trans []
        , enc []
        , circle [ maSize 9, maOpacity 0.4 ]
        ]
```
