---
elm:
  dependencies:
    gicentre/elm-vega: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

```elm {v}
interactive1 : Spec
interactive1 =
    let
        sel =
            selection << select "myBrush" Interval []

        enc =
            encoding
                << position X [ PName "Horsepower", PmType Quantitative ]
                << position Y [ PName "Miles_per_Gallon", PmType Quantitative ]
                << color
                    [ MSelectionCondition (SelectionName "myBrush")
                        [ MName "Cylinders", MmType Ordinal ]
                        [ MString "grey" ]
                    ]
    in
    toVegaLite [ width 300, height 150, dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" [], mark Point [], sel [], enc [] ]
```

```elm {v}
binding1 : Spec
binding1 =
    let
        trans =
            transform
                << calculateAs "year(datum.Year)" "Year"

        sel1 =
            selection
                << select "CylYr"
                    Single
                    [ Fields [ "Cylinders", "Year" ]
                    , Bind
                        [ IRange "Cylinders" [ InName "Cylinders ", InMin 3, InMax 8, InStep 1 ]
                        , IRange "Year" [ InName "Year ", InMin 1969, InMax 1981, InStep 1 ]
                        ]
                    ]

        enc1 =
            encoding
                << position X [ PName "Horsepower", PmType Quantitative ]
                << position Y [ PName "Miles_per_Gallon", PmType Quantitative ]
                << color
                    [ MSelectionCondition (SelectionName "CylYr")
                        [ MName "Origin", MmType Nominal ]
                        [ MString "grey" ]
                    ]

        spec1 =
            asSpec [ sel1 [], mark Circle [], enc1 [] ]

        trans2 =
            transform
                << filter (FSelection "CylYr")

        enc2 =
            encoding
                << position X [ PName "Horsepower", PmType Quantitative ]
                << position Y [ PName "Miles_per_Gallon", PmType Quantitative ]
                << color [ MName "Origin", MmType Nominal ]
                << size [ MNumber 100 ]

        spec2 =
            asSpec [ trans2 [], mark Circle [], enc2 [] ]
    in
    toVegaLite [ width 300, height 150, dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" [], trans [], layer [ spec1, spec2 ] ]
```
