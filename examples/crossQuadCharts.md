---
id: "litvis"
elm:
  dependencies:
    gicentre/elm-vegalite: latest
narrative-schemas:
  - ../narrative-schemas/idiom.yml
---

```elm {l=hidden}
import VegaLite exposing (..)
```

@import "assets/robotoStyle.less"

# CrossQuad Charts

{( aim |}

Provide a visual representation of a 2 by 2 contingency table (also known as a crosstab) allowing an immediate judgement to be made of relative magnitudes.
Additionally, it should allow easy comparison between charts for detecting systematic associations and differences within and between charts.

{| aim )}

{( description |}

Consider, for example, the following table:

|           | col 1 | col 2 |
| --------- | :---: | :---: |
| **row 1** |  16   |   8   |
| **row 2** |   4   |   2   |

which we can represent with the following crossQuad chart:

^^^elm {v=(crossQuad 200 16 8 4 2)}^^^

Note how valid comparisons can be made across both columns and rows while relative areas remain proportional to magnitude.
The use of numerical annotation of each quad allows absolute as well as relative judgements of magnitude to be made.

{| description )}

{( architypes |}

^^^elm {v=(labelledCrossQuad "a" "b" "1" "2" 100 101 100 99 102 )}^^^
_Little difference_

^^^elm {v=(labelledCrossQuad "a" "b" "1" "2" 100 5 1 5 1)}^^^
_'a's greater than 'b's_
^^^elm {v=(labelledCrossQuad "a" "b" "1" "2" 100 5 5 1 1)}^^^
_'1's greater than '2's_

^^^elm {v=(labelledCrossQuad "a" "b" "1" "2" 100 10 1 1 10 )}^^^
_a1,b2 association_
^^^elm {v=(labelledCrossQuad "a" "b" "1" "2" 100 1 10 10 1 )}^^^
_a2,b1 association_

{|architypes)}

{(limitations|}

- Does not adapt well to contingency tables of more than 2x2 states.

- Some 2d to 1d mental transformation is still required when comparing two items in a column or two items in a row.
  There may be a temptation to judge these like bars in a bar chart rather than perform a mental squaring of length differences (e.g. '4' in the example above may be incorrectly interpreted as half the magnitude of '16').

- Data-ink ratio is quite low (only 4 numbers in each crossQuad chart)

{|limitations)}

## Gender, Authorship and Language

In Ben Blatt's book [Nabokov's Favourite Word is Mauve](http://www.simonandschuster.com/books/Nabokovs-Favorite-Word-Is-Mauve/Ben-Blatt/9781501105388) he analyses the words used to describe male and female characters in various collections of literature and whether they may also be related to the gender of the author.

He constructs contingency quadCharts of the selected gender-associated verbs and how often they are applied to male characters (through the proxy of following the word 'he' or 'I' of a male protagonist) and female characters (following 'she' or 'I' of a female protagonist).

Here, for example, is the quadChart for _screamed_, where the number in each quad is the number of times _screamed_ follows for every 100,000 instances of he/she/I in 'classic literature':

^^^elm {v=(authorGenderChart "screamed" 29 60 38 70)}^^^

Notice how the NW-SE diagonal indicates authors describing characters of their own gender and the SW-NE diagonal of their opposite gender.

Here are a few more from Blatt, all from 'modern literary fiction' (Blatt, 2017, pp.51-55):

^^^elm {v=[(authorGenderChart "grinned" 52 16 56 11),(authorGenderChart "interrupted" 4 22 9 4)]}^^^

^^^elm {v=[(authorGenderChart "feared" 49 51 29 42),(authorGenderChart "sobbed" 4 12 7 7)]}^^^

And for all genres of fiction sampled (Blatt, 2017, pp.56-57), noting that authors are more likely to ascribe kissing to their opposite gender and hating to their own gender:

^^^elm {v=[(authorGenderChart "kissed" 74 119 83 42),(authorGenderChart "hated" 154 99 89 134)]}^^^

## References

Blatt, B. (2017) [Nabokov's Favourite Colour is Mauve](http://www.simonandschuster.com/books/Nabokovs-Favorite-Word-Is-Mauve/Ben-Blatt/9781501105388). Simon & Schuster. 271 pp. ISBN 978-1-4711-5283-2

```elm {l=hidden}
authorGenderChart : String -> Float -> Float -> Float -> Float -> Spec
authorGenderChart verb tl tr bl br =
    labelledCrossQuad ("he " ++ verb) ("she " ++ verb) "male author" "female author" 200 tl tr bl br


crossQuad : Float -> Float -> Float -> Float -> Float -> Spec
crossQuad w tl tr bl br =
    labelledCrossQuad "" "" "" "" w tl tr bl br


labelledCrossQuad : String -> String -> String -> String -> Float -> Float -> Float -> Float -> Float -> Spec
labelledCrossQuad col1Title col2Title row1Title row2Title w tl tr bl br =
    let
        d =
            sqrt (w / 2)

        ds =
            String.fromFloat d

        quadPaths =
            categoricalDomainMap
                [ ( "tl", "M 0 0 v-" ++ ds ++ " h-" ++ ds ++ " v" ++ ds ++ "z" )
                , ( "tr", "M 0 0 v-" ++ ds ++ " h" ++ ds ++ " v" ++ ds ++ "z" )
                , ( "bl", "M 0 0 h-" ++ ds ++ " v" ++ ds ++ " h" ++ ds ++ "z" )
                , ( "br", "M 0 0 h" ++ ds ++ " v" ++ ds ++ " h-" ++ ds ++ "z" )
                ]

        data =
            dataFromColumns []
                << dataColumn "magnitude" (nums [ tl, tr, bl, br ])
                << dataColumn "quadrant" (strs [ "tl", "tr", "bl", "br" ])
                << dataColumn "x" (nums [ 0, 0, 0, 0 ])
                << dataColumn "y" (nums [ 0, 0, 0, 0 ])
                << dataColumn "numLabelX" (nums [ -2, 2, -2, 2 ])
                << dataColumn "numLabelY" (nums [ 1.2, 1.2, -1.2, -1.2 ])
                << dataColumn "labelX" (nums [ -d / 2, d / 2, -d * 2, -d * 2 ])
                << dataColumn "labelY" (nums [ d * 1.4, d * 1.4, d / 2, -d / 2 ])
                << dataColumn "label" (strs [ col1Title, col2Title, row1Title, row2Title ])

        quadEnc =
            encoding
                << position X [ pName "x", pQuant, pAxis [] ]
                << position Y [ pName "y", pQuant, pAxis [] ]
                << shape [ mName "quadrant", mNominal, mScale quadPaths, mLegend [] ]
                << size
                    [ mName "magnitude"
                    , mQuant
                    , mScale [ scRange (raNums [ 0, w * 2 ]) ]
                    , mLegend []
                    ]

        quadSpec =
            asSpec
                [ point [ maFill "rgb(129,160,194)", maFillOpacity 1, maStroke "#fff", maStrokeWidth 0 ]
                , quadEnc []
                ]

        axisEnc =
            encoding
                << position X [ pName "x", pQuant, pAxis [] ]
                << position Y [ pName "y", pQuant, pAxis [] ]
                << size [ mNum (w * 2) ]
                << shape [ mName "quadrant", mNominal, mScale quadPaths, mLegend [] ]

        axisSpec =
            asSpec [ point [ maStroke "#fff" ], axisEnc [] ]

        numLabelEnc =
            encoding
                << position X [ pName "numLabelX", pQuant, pAxis [] ]
                << position Y [ pName "numLabelY", pQuant, pAxis [] ]
                << text [ tName "magnitude", tNominal ]

        numLabelSpec =
            asSpec
                [ textMark
                    [ maAlign haCenter
                    , maBaseline vaMiddle
                    , maStrokeOpacity 0
                    , maFill "#f0f0f6"
                    , maFontSize (d * 0.9)
                    ]
                , numLabelEnc []
                ]

        labelEnc =
            encoding
                << position X [ pName "labelX", pQuant, pAxis [] ]
                << position Y [ pName "labelY", pQuant, pAxis [] ]
                << text [ tName "label", tNominal ]

        labelSpec =
            asSpec
                [ textMark
                    [ maAlign haCenter
                    , maBaseline vaTop
                    , maStrokeOpacity 0
                    , maFill "#666"
                    , maFontSize d
                    ]
                , labelEnc []
                ]
    in
    toVegaLite
        [ configure (configuration (coView [ vicoStroke Nothing ]) [])
        , data []
        , width w
        , height w
        , layer [ quadSpec, axisSpec, numLabelSpec, labelSpec ]
        ]
```
