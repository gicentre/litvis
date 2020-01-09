---
follows: "elmVegaliteWalkthrough2"
id: litvis
---

@import "../css/tutorial.less"

1.  [Introduction](elmVegaliteWalkthrough1.md)
2.  [Single View Specifications](elmVegaliteWalkthrough2.md)
3.  **Layered and Multi-view Composition**
4.  [Interaction](elmVegaliteWalkthrough4.md)

---

## Layered and Multi-view Composition ([8:28](https://youtu.be/9uaHRWj04D4?t=8m28s))

To show our weather distributions next to each other rather than stacked on top of each other, we simply encode column position in a row of small multiples with the `weather` data field:

```elm {v l s}
smallMultiples : Spec
smallMultiples =
    let
        enc =
            encoding
                << position X [ pName "temp_max", pQuant, pBin [], pTitle "" ]
                << position Y [ pAggregate opCount, pQuant ]
                << color [ mName "weather", mNominal, mLegend [], mScale weatherColors ]
                << column [ fName "weather", fNominal ]
    in
    toVegaLite [ width 110, height 110, seattleData, bar [], enc [] ]
```

There are only two additions in order to create these small multiples. Firstly we have an extra encoding with the `column` function specifying the `weather` data field as the one to determine which column each data item gets mapped to. Note that the `f` prefix for `fName` and `fNominal` refers to _facet_ – a form of data selection and grouping standard in data visualization.

The second, minor change, is to include an `mLegend` specification in the color encoding. The legend can be customised with its parameter list but here by providing an empty list, we declare we do not wish the default legend to appear (the arrangement into columns with color encoding and default column labels make the legend redundant).

### Multi-view Composition Operators ([9:00](https://youtu.be/9uaHRWj04D4?t=9m00s))

There are four ways in which multiple views may be combined:

- The **facet operator** takes subsets of a dataset (facets) and separately applies the same view specification to each of those facets (as seen with the `column` function above).
  elm-vegalite functions to create faceted views: `column`, `row`, `facet` and `specification`.

- The **layer operator** creates different views of the data but each is layered (superposed) on the same same space, for example a trend line layered on top of a scatterplot.
  elm-vegalite functions to create a layered view: `layer` and `asSpec`.

- The **concatenation operator** allows arbitrary views (potentially with different datasets) to be assembled in rows or columns.
  This allows 'dashboards' to be built.
  elm-vegalite functions to create concatenated views: `vConcat`, `hConcat` and `asSpec`.

- The **repeat operator** is a concise way of combining multiple views with only small data-driven differences in each view.
  elm-vegalite functions for repeated views: `repeat` and `specification`.

## Composition Example: Precipitation in Seattle ([9:40](https://youtu.be/9uaHRWj04D4?t=9m40s))

As a basis for discussing view composition, let's start with a single bar chart showing monthly precipitation in Seattle:

```elm {v l s}
barChart : Spec
barChart =
    let
        enc =
            encoding
                << position X [ pName "date", pOrdinal, pTimeUnit month ]
                << position Y [ pName "precipitation", pQuant, pAggregate opMean ]
    in
    toVegaLite [ seattleData, bar [], enc [] ]
```

(Note that here we've cast the date, which has been quantized into monthly intervals, to be ordinal so that bars span the full width of each month.)

We can generalise this a little within Elm by allowing the data field to be counted (here `precipitation`) to be specified as a parameter along with a customisable width `w` to a function that returns the temporal bar chart specification:

```elm {l}
temporalBarSpec : PositionChannel -> Float -> Spec
temporalBarSpec pField w =
    let
        enc =
            encoding
                << position X [ pName "date", pOrdinal, pTimeUnit month ]
                << position Y [ pField, pQuant, pAggregate opMean ]
    in
    asSpec [ width w, height w, bar [], enc [] ]
```

This can then be passed to `toVegaLite` as its own _layer_:

```elm {l s}
barChart : Spec
barChart =
    toVegaLite [ seattleData, layer [ temporalBarSpec (pName "precipitation") 180 ] ]
```

### Composing layers ([10:08](https://youtu.be/9uaHRWj04D4?t=10m08s))

We can annotate the chart by placing the bar chart specification in a layer and adding another layer with the annotation. In this example we will add a layer showing the average precipitation for the entire period:

```elm {v l s}
barChart : Spec
barChart =
    let
        dataField =
            pName "precipitation"

        enc =
            encoding << position Y [ dataField, pQuant, pAggregate opMean ]
    in
    toVegaLite
        [ seattleData
        , layer [ temporalBarSpec dataField 180, asSpec [ enc [], rule [] ] ]
        ]
```

The temporal bar encoding is as it was previously. We add a similar average line specification but only need to encode the y-position as we wish to span the entire chart space with the `rule` mark. The two specifications are combined as layers with the `layer` function which we add to the list of specifications passed to `toVegaLite` in place of the original bar specification.

Again it becomes a simple job to refactor this bar chart and average marker so that it will work with any named data field and width:

```elm {l}
temporalAvBarSpec : PositionChannel -> Float -> Spec
temporalAvBarSpec dataField w =
    let
        enc =
            encoding << position Y [ dataField, pQuant, pAggregate opMean ]
    in
    asSpec
        [ layer [ temporalBarSpec dataField w, asSpec [ enc [], rule [] ] ] ]
```

### Concatenating views ([10:47](https://youtu.be/9uaHRWj04D4?t=10m47s))

Instead of layering one view on top of another (superposition), we can place them side by side in a row or column (juxtaposition). In Vega-Lite this is referred to as _concatenation_:

```elm { v l s}
barCharts : Spec
barCharts =
    toVegaLite
        [ seattleData
        , vConcat
            [ temporalBarSpec (pName "precipitation") 180
            , temporalBarSpec (pName "temp_max") 180
            ]
        ]
```

Concatenated views are specified in the same way as layered views expect that we use the `vConcat` function (or `hConcat` for a horizontal arrangement) in place of `layer`.

### Repeated Views ([11:08](https://youtu.be/9uaHRWj04D4?t=11m08s))

Noting that juxtaposing similar charts is a common operation, and the specification for each of them often is very similar, the repeat operator allows us to streamline the specification required to do this. We might, for example, wish to show three data fields from the Seattle weather dataset:

```elm {v l s}
barCharts : Spec
barCharts =
    toVegaLite
        [ seattleData
        , repeat [ rowFields [ "precipitation", "temp_max", "wind" ] ]
        , specification (temporalBarSpec (pRepeat arRow) 150)
        ]
```

This more compact specification replaces the data field name (`pName "precipitation"` etc.) with a reference to the repeating field (`pRepeat`) either as a `arRow` or `arColumn` depending on the desired layout. We then compose the specifications by providing a set of `rowFields` (or `columnFields`) containing a list of the fields to which we wish to apply the specification (identified with the function `specification` which should follow the `repeat` function provided to `toVegaLite`).

We can combine repeated rows and repeated columns to create a grid of views, such as a scatterplot matrix (or SPLOM for short):

```elm {v l s}
splom : Spec
splom =
    let
        enc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]

        spec =
            asSpec
                [ width 120
                , height 120
                , point [ maStrokeWidth 0.4 ]
                , enc []
                ]
    in
    toVegaLite
        [ seattleData
        , repeat
            [ rowFields [ "temp_max", "precipitation", "wind" ]
            , columnFields [ "wind", "precipitation", "temp_max" ]
            ]
        , specification spec
        ]
```

### Building A Dashboard ([12:40](https://youtu.be/9uaHRWj04D4?t=12m40s))

We can compose more complex 'dashboards' by assembling single views but varying either their encoding or the data that are encoded. To illustrate, let's first identify the four single view types that we will compose with (all of these we have considered above, but are shown here again for clarity).

```elm {v}
histogram : Spec
histogram =
    let
        w =
            105

        histoEnc =
            encoding
                << position X [ pName "temp_max", pQuant, pBin [] ]
                << position Y [ pAggregate opCount, pQuant ]

        histoSpec =
            asSpec [ width w, height w, bar [], histoEnc [] ]

        scatterEnc =
            encoding
                << position X [ pName "temp_max", pQuant ]
                << position Y [ pName "precipitation", pQuant ]

        scatterSpec =
            asSpec [ width w, height w, point [ maStrokeWidth 0.3 ], scatterEnc [] ]

        barEnc =
            encoding
                << position X [ pName "date", pOrdinal, pTimeUnit month ]
                << position Y [ pName "precipitation", pQuant, pAggregate opMean ]

        barSpec =
            asSpec [ width w, height w, bar [], barEnc [] ]

        lineEnc =
            encoding
                << position Y [ pName "precipitation", pQuant, pAggregate opMean ]

        lineSpec =
            asSpec [ width w, height w, rule [], lineEnc [] ]
    in
    toVegaLite
        [ seattleData
        , hConcat [ histoSpec, scatterSpec, barSpec, lineSpec ]
        ]
```

As we have seen, we can arrange combinations of these views with the composition operators _layer_, _facet_, _repeat_ and _concatenate_. The specifications that result can themselves be further composed with the same operators to form a tree of compositions:

![Composition tree](images/compositionTree.png)

This allows us to create a nested dashboard of views:

```elm {l}
dashboard : Data -> Spec
dashboard data =
    let
        scatterEnc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]

        scatterSpec =
            asSpec [ point [ maStrokeWidth 0.4 ], scatterEnc [] ]

        splomSpec =
            asSpec
                [ repeat
                    [ rowFields [ "temp_max", "precipitation", "wind" ]
                    , columnFields [ "wind", "precipitation", "temp_max" ]
                    ]
                , specification scatterSpec
                ]

        barsSpec =
            asSpec
                [ repeat [ rowFields [ "precipitation", "temp_max", "wind" ] ]
                , specification (temporalAvBarSpec (pRepeat arRow) 150)
                ]

        histoEnc =
            encoding
                << position X [ pName "temp_max", pQuant, pBin [], pAxis [ axTitle "Max temp" ] ]
                << position Y [ pAggregate opCount, pQuant ]
                << color [ mName "weather", mNominal, mLegend [], mScale weatherColors ]
                << column [ fName "weather", fNominal ]

        histoSpec =
            asSpec [ width 120, height 120, bar [], histoEnc [] ]
    in
    toVegaLite
        [ data
        , vConcat [ asSpec [ hConcat [ splomSpec, barsSpec ] ], histoSpec ]
        ]
```

^^^elm {v=(dashboard seattleData)}^^^

There is nothing new in this example – we have simply assembled a range of views with the composition operators.
It is worth noting that the data source (`seattle-weather.csv`) need only be identified once so can be removed from the component view specifications. This has the advantage that if we were to replace the reference to the data file with another, we only need do it once. Here, for example is exactly the same specification but with `newYork-weather` given as the data source.

```elm {l}
newYorkData : Data
newYorkData =
    dataFromUrl "https://gicentre.github.io/data/newYork-weather.csv" []
```

^^^elm {v=(dashboard newYorkData)}^^^

---

_Next >>_ [Interaction](elmVegaliteWalkthrough4.md)
