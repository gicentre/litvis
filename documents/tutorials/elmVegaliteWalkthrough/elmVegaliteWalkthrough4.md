---
follows: "elmVegaliteWalkthrough3"
id: litvis
---

@import "../css/tutorial.less"

1. [Introduction](elmVegaliteWalkthrough1.md)
2. [Single View Specifications](elmVegaliteWalkthrough2.md)
3. [Layered and Multi-view Composition](elmVegaliteWalkthrough3.md)
4. **Interaction**

---

# Interaction ([14:35](https://youtu.be/9uaHRWj04D4?t=14m35s))

Interaction is enabled by creating _selections_ that may be combined with the kinds of specifications already described. Selections involve three components:

- **Events** are those actions that trigger the interaction such as clicking at a location on screen or pressing a key.

- **Points of interest** are the elements of the visualization with which the interaction occurs, for example, a set of points selected on a scatterplot.

- **Predicates** (i.e. Boolean functions) identify whether or not something is included in the selection. These need not be limited to only those parts of the visualization directly selected through interaction (see _selection projection_ below).

By way of an example consider this coloured scatterplot where any point can be selected and all non-selected points are turned grey (_click on a point to select it_):

_Note that in the interactive examples that follow, the code block header must include the `interactive` keyword, e.g. `elm {v l interactive}` (this might not be apparent if you are viewing this document directly in GitHub)._

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pName "Miles_per_Gallon", pQuant ]
                << color
                    [ mSelectionCondition (selectionName "picked")
                        [ mName "Origin" ]
                        [ mStr "grey" ]
                    ]

        sel =
            selection
                << select "picked" seSingle []
    in
    toVegaLite [ data, sel [], enc [], circle [] ]
```

In comparison to the static specifications we have already seen, the addition here is the new function `selection` that is added to the spec passed to Vega-Lite and a new `mSelectionCondition` used to encode colour.

Previously when encoding colour (or any other channel) we have provided a list of properties. Here we provide a pair of lists – one for when the selection condition is true, the other for when it is false.

The name `"picked"` is just one we have chosen to call the selection. The type of selection here is `seSingle` meaning we can only select one item at a time.

Because we will reuse the scatterplot specification in several examples, we can declare the basic specification in its own Elm function:

```elm {l}
scatterProps : List ( VLProperty, Spec )
scatterProps =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pName "Horsepower", pQuant ]
                << position Y [ pName "Miles_per_Gallon", pQuant ]
                << color
                    [ mSelectionCondition (selectionName "picked")
                        [ mName "Origin" ]
                        [ mStr "grey" ]
                    ]
    in
    [ data, enc [], circle [] ]
```

This allows us to add the selection specification separately. So the previous example can now be created by adding the selection function and passing the complete list to `toVegaLite`:

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection << select "picked" seSingle []
    in
    toVegaLite (sel [] :: scatterProps)
```

To select multiple points by shift-clicking, we use the `seMulti` function instead of 'seSingle' in the `selection` (_shift-click to select multiple points_):

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection << select "picked" seMulti []
    in
    toVegaLite (sel [] :: scatterProps)
```

Alternatively, we could make the selection happen based on any browser event by parameterising `select` with the function `seOn` and a value matching a JavaScript event name, such as mouse movement over points to give more of a paintbrush effect (_hold shift down while moving pointer to select multiple points_):

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection << select "picked" seMulti [ seOn "mouseover" ]
    in
    toVegaLite (sel [] :: scatterProps)
```

## Selection Transformations ([16:39](https://youtu.be/9uaHRWj04D4?t=16m39s))

Simple selections as described above create sets of selected data marks based directly on what was interacted with by the user. Selection transformations allow us to _project_ that direct selection onto other parts of our dataset. For example, suppose we wanted to know what effect the number of engine cylinders has on the relationship between engine power and engine efficiency. We can invoke a _selection projection_ on `Cylinders` in our dataset that says 'when a single point is selected, extend that selection to all other points in the dataset that share the same number of cylinders' (_click on any point to select all with the same number of cylinders_):

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection << select "picked" seSingle [ seEmpty, seFields [ "Cylinders" ] ]
    in
    toVegaLite (sel [] :: scatterProps)
```

This is invoked simply by adding a parameterised `seFields` function to the `select` parameters naming the fields onto which we wish to project our selection. Additionally, we have set the default selection with `seEmpty` here so that if nothing is selected, the selection is empty (without this the default selection is the entire encoded dataset.)

Selection need not be limited to direct interaction with the visualization marks. We can also _bind_ the selection to other user-interface components. For example we could select all those cars with a chosen number of cylinders with a slider by binding the selection to an HTML _input range_ component. Clicking on a point projects the selection as before, but also updates the slider; moving the slider updates the selected points:

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection
                << select "picked"
                    seSingle
                    [ seFields [ "Cylinders" ]
                    , seBind [ iRange "Cylinders" [ inName "Cylinders: ", inMin 3, inMax 8, inStep 1 ] ]
                    ]
    in
    toVegaLite (sel [] :: scatterProps)
```

The binding to the slider is added with the parameterised `seBind` function followed by a function generating the HTML input element (`iRange` in this example), the data field to which it is to be bound and then a list of optional input element parameters (here just setting the limits of the slider and step between slider values).
The binding is two-way, so directly selecting points on the scatterplot updates the sliders and moving the sliders updates the selected (and therefore highlighted) points.

Binding need not be limited to single input element. We could, for example, bind another input slider to the year of manufacture to see if there are any trends in engine efficiency over time. Here the selection projection matches both number of cylinders and year of manufacture either selected by clicking on a mark or adjusting the sliders:

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection
                << select "picked"
                    seSingle
                    [ seFields [ "Cylinders", "Year" ]
                    , seBind
                        [ iRange "Cylinders" [ inMin 3, inMax 8, inStep 1 ]
                        , iRange "Year" [ inMin 1969, inMax 1981, inStep 1 ]
                        ]
                    ]
    in
    toVegaLite (sel [] :: scatterProps)
```

The `seInterval` selection type is useful for rapidly choosing a region of a view. Simply providing an unparameterised selection allows both the width and the height of the selection to be chosen:

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection
                << select "picked" seInterval []
    in
    toVegaLite (sel [] :: scatterProps)
```

Projecting the selection onto a position channel can be used to select all marks that have an X- or Y- position within a region regardless of the other spatial coordinate:

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection
                << select "picked" seInterval [ seEncodings [ chX ] ]
    in
    toVegaLite (sel [] :: scatterProps)
```

Notice here that to project the selection we parameterise `seInterval` not with a field name as we have done previously but with a channel encoding using the function `seEncodings` (here parameterised with the X-position channel function `chX`).

If we further _bind_ that selection to the _scale_ transformation of X-position, we have created the ability to pan and zoom the view as the scaling is determined interactively depending on the extent and position of the interval selection.

_Try dragging, and zooming with the mouse wheel / trackpad to change the x-scaling:_

```elm {v l s interactive}
scatterplot : Spec
scatterplot =
    let
        sel =
            selection
                << select "picked" seInterval [ seEncodings [ chX ], seBindScales ]
    in
    toVegaLite (sel [] :: scatterProps)
```

## Multiple Coordinated Views ([19:38](https://youtu.be/9uaHRWj04D4?t=19m38s))

One of the more powerful aspects of selection-based interaction is in coordinating different views – a selection of a data subset is projected onto all other views of the same data. _Try selecting points in any one scatterplot and see the selection projected to all the others:_

```elm {v l s interactive}
linkedScatterplots : Spec
linkedScatterplots =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]
                << color
                    [ mSelectionCondition (selectionName "picked")
                        [ mName "Origin", mNominal ]
                        [ mStr "grey" ]
                    ]

        sel =
            selection << select "picked" seInterval [ seEncodings [ chX ] ]

        spec =
            asSpec
                [ data, sel [], enc [], circle [] ]
    in
    toVegaLite
        [ repeat
            [ rowFields [ "Displacement", "Miles_per_Gallon" ]
            , columnFields [ "Horsepower", "Miles_per_Gallon" ]
            ]
        , specification spec
        ]
```

There is nothing new in the specification here other than combining the `repeat` function with the `selection`. The selection is projected across all views as it is duplicated by the `repeat` operator.

It is a simple step to bind the scales of the scatterplots in the same way to coordinate zooming and panning across views.

_Try dragging, and zooming with the mouse wheel / trackpad to coordinate the scatterplot scaling across all views:_

```elm {v l s interactive}
linkedScatterplots : Spec
linkedScatterplots =
    let
        data =
            dataFromUrl (path ++ "cars.json") []

        enc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pRepeat arRow, pQuant ]
                << color [ mName "Origin" ]

        sel =
            selection << select "picked" seInterval [ seBindScales ]

        spec =
            asSpec [ data, sel [], enc [], circle [] ]
    in
    toVegaLite
        [ repeat
            [ rowFields [ "Displacement", "Miles_per_Gallon" ]
            , columnFields [ "Horsepower", "Miles_per_Gallon" ]
            ]
        , specification spec
        ]
```

The only difference between this and the previous example is that we now call `seBindScales` based on the selection rather than provide a conditional encoding of colour.

The ability to determine the scale of a chart based on a selection is useful in implementing a common visualization design pattern, that of 'context and focus' (or sometimes referred to as 'overview and detail on demand'). We can achieve this by setting the scale of one view based on the selection in another. The detail view is updated whenever the selected region is changed through interaction.

_Try selecting and dragging a selection in the upper chart to see the selection projected to the lower chart:_

```elm {v l s interactive}
linkedTimeSeries : Spec
linkedTimeSeries =
    let
        data =
            dataFromUrl (path ++ "sp500.csv") []

        sel =
            selection << select "brush" seInterval [ seEncodings [ chX ] ]

        encContext =
            encoding
                << position X [ pName "date", pTemporal, pAxis [ axFormat "%Y" ] ]
                << position Y
                    [ pName "price"
                    , pQuant
                    , pAxis [ axTickCount (niTickCount 3), axGrid False ]
                    ]

        specContext =
            asSpec [ width 400, height 80, sel [], encContext [], area [] ]

        encDetail =
            encoding
                << position X
                    [ pName "date"
                    , pTemporal
                    , pScale [ scDomain (doSelection "brush") ]
                    , pTitle ""
                    ]
                << position Y [ pName "price", pQuant ]

        specDetail =
            asSpec [ width 400, encDetail [], area [] ]
    in
    toVegaLite [ data, vConcat [ specContext, specDetail ] ]
```

## Cross-filtering ([20:41](https://youtu.be/9uaHRWj04D4?t=20m41s))

The final example brings together ideas of view composition and interactive selection with data filtering by implementing _cross-filtering_.

A cross-filter involves selecting a subset of the data in one view and then only displaying those data in other views.
In this example we use `repeat` to show three fields in a flights database – hour of day in which a flight departs, the distribution of flight delays and the distribution of flight distances.

_Try selecting a subset of any one of the views below and see the filtered selection projected to the other views:_

```elm {v l s interactive}
crossFilter : Spec
crossFilter =
    let
        data =
            dataFromUrl (path ++ "flights-2k.json") [ parse [ ( "date", foDate "%Y/%m/%d %H:%M" ) ] ]

        hourTrans =
            -- This generates a new field based on the hour of day extracted from the date field.
            transform
                << calculateAs "hours(datum.date)" "hour"

        sel =
            selection << select "brush" seInterval [ seEncodings [ chX ] ]

        filterTrans =
            transform
                << filter (fiSelection "brush")

        totalEnc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pAggregate opCount, pQuant ]

        selectedEnc =
            encoding
                << position X [ pRepeat arColumn, pQuant ]
                << position Y [ pAggregate opCount ]
    in
    toVegaLite
        [ repeat [ columnFields [ "hour", "delay", "distance" ] ]
        , specification <|
            asSpec
                [ width 170
                , height 150
                , data
                , hourTrans []
                , layer
                    [ asSpec [ totalEnc [], bar [] ]
                    , asSpec [ sel [], filterTrans [], selectedEnc [], bar [ maColor "goldenrod" ] ]
                    ]
                ]
        ]
```
