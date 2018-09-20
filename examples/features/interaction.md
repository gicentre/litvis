---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

```elm {l=hidden}
import VegaLite exposing (..)
```

```elm {v interactive}
interactive1 : Spec
interactive1 =
    let
        sel =
            selection << select "myBrush" seInterval []

        enc =
            encoding
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pName "Miles_per_Gallon", pMType Quantitative ]
                << color
                    [ mSelectionCondition (selectionName "myBrush")
                        [ mName "Cylinders", mMType Ordinal ]
                        [ mStr "grey" ]
                    ]
    in
    toVegaLite [ width 300, height 150, dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" [], point [], sel [], enc [] ]
```

```elm {v interactive}
binding1 : Spec
binding1 =
    let
        trans =
            transform
                << calculateAs "year(datum.Year)" "Year"

        sel1 =
            selection
                << select "CylYr"
                    seSingle
                    [ seFields [ "Cylinders", "Year" ]
                    , seBind
                        [ iRange "Cylinders" [ inName "Cylinders ", inMin 3, inMax 8, inStep 1 ]
                        , iRange "Year" [ inName "Year ", inMin 1969, inMax 1981, inStep 1 ]
                        ]
                    ]

        enc1 =
            encoding
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pName "Miles_per_Gallon", pMType Quantitative ]
                << color
                    [ mSelectionCondition (selectionName "CylYr")
                        [ mName "Origin", mMType Nominal ]
                        [ mStr "grey" ]
                    ]

        spec1 =
            asSpec [ sel1 [], circle [], enc1 [] ]

        trans2 =
            transform
                << filter (fiSelection "CylYr")

        enc2 =
            encoding
                << position X [ pName "Horsepower", pMType Quantitative ]
                << position Y [ pName "Miles_per_Gallon", pMType Quantitative ]
                << color [ mName "Origin", mMType Nominal ]
                << size [ mNum 100 ]

        spec2 =
            asSpec [ trans2 [], circle [], enc2 [] ]
    in
    toVegaLite [ width 300, height 150, dataFromUrl "https://vega.github.io/vega-lite/data/cars.json" [], trans [], layer [ spec1, spec2 ] ]
```
