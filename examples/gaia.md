---
elm:
  dependencies:
    gicentre/elm-vegalite: latest

id: "litvis"
---

@import "assets/litvis.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

# Exploring Stellar Properties

_Adapted from this [hVega notebook](https://github.com/DougBurke/hvega/blob/master/notebooks/hvega-frames-and-gaia.ipynb) by Doug Burke. This provides an example of a 'data science notebook', exploring both data and the visual means of expressing the data._

## Table of Contents

1. [Gaia satellite data](#1-gaia-satellite-data)
2. [Loading the data](#2-loading-the-data)
3. [Plotting the data](#3-plotting-the-data)
4. [How many stars are there?](#4-how-many-stars-are-there)
5. [Parallaxes](#5-parallaxes)
6. [Magnitudes](#6-magnitudes)
7. [Adding interactivity](#7-adding-interactivity)

## 1. Gaia Satellite Data

The data set I'm going to use is from the [Gaia satellite](http://sci.esa.int/gaia/), which has radically-improved our knowledge of our Galaxy. I had planned to do something with the [Hertzzprung-Russell (HR) diagram](https://en.wikipedia.org/wiki/Hertzsprung–Russell_diagram), since Gaia has produced some remarkable results: for example [Gaia's second data release (DR2)](http://sci.esa.int/gaia/60198-gaia-hertzsprung-russell-diagram). However, I got side-tracked when trying to investigate the data used in this [look at different data cuts of the HR diagram from DR2 data](https://www.cosmos.esa.int/web/gaia/gaiadr2_hrd), which is taken from the paper [Gaia Data Release 2: Observational Hertzsprung-Russell diagrams](https://arxiv.org/abs/1804.09378).

I ended up playing around with some of the "ancillary" data from this paper, in particular the contents of Table 1a, which was downloaded from the [VizieR archive](http://vizier.u-strasbg.fr/viz-bin/VizieR-3?-source=J/A%2bA/616/A10/tablea1a) as a _tsv_ file. It contains basic measurements for a number of stars in nine open clusters that all lie within 250 parsecs of the Earth (please note, a parsec is a measure of distance, not time, no matter what some ruggedly-handsome ex-carpenter might claim).

The downloaded file is [gaia-aa-616-a10-table1a.tsv](https://github.com/DougBurke/hvega/blob/master/notebooks/gaia-aa-616-a10-table1a.tsv), although I have manually edited it to a "more standard" TSV form (we Astronomers like our metadata, and tend to stick it in inappropriate places, such as the start of comma- and tab-separated files, which really mucks up other-people's parsing code). The file I'm going to use is [data/gaia-aa-616-a10-table1a.tsv](data/gaia-aa-616-a10-table1a.tsv), the first few lines of which look like:

| Source             | Cluster | RA_ICRS   | DE_ICRS   | Gmag   | plx    | e_plx    |
| ------------------ | ------- | --------- | --------- | ------ | ------ | -------- |
| 49520255665123328  | Hyades  | 064.87461 | +21.75372 | 12.861 | 20.866 | 0.033    |
| 49729231594420096  | Hyades  | 060.20378 | +18.19388 | 5.790  | 21.789 | 0.045    |
| 51383893515451392  | Hyades  | 059.80696 | +20.42805 | 12.570 | 22.737 | 0.006    |
| 145373377272257664 | Hyades  | 066.06127 | +21.73605 | 6.990  | 23.109 | 0.003    |
| 145391484855481344 | Hyades  | 067.00371 | +21.61972 | 5.643  | 19.968 | 0.067    |
| :                  | :       | :         | :         | :      | :      | : _etc._ |

- `Cluster` indicates the membership of the star in a "cluster of stars".
- `RA_ICRS` and `DE_ICRS` give the location of the star on the sky (you can think of this as longitude and latitude; the `ICRS` part of the label is important if we want to observe the star with a telescope, but isn't that important for us).
- `Gmag` measures the brightness of the star, in "special" Astronomer units.
- `plx` and `e_plx` provide the parallax of the star and the error on it (giving a measure of the distance to the star).

The `Source` column is used to indicate which star (it's presumably a database index), and will not be used here. It would be important if I were to select a subset of starts and wanted to get more data on them from the Gaia archive (e.g. if I ever got around to trying to create an HR plot).

Fortunately the full table is pretty small, so there should no problems with reading or displaying it as a Vega-Lite visualization.

## 2. Loading the data

We can simply read the TSV file directly and make it available to our _elm-vegalite_ specifications.

```elm {l}
path : String
path =
    "https://gicentre.github.io/data/"


data : Data
data =
    dataFromUrl (path ++ "gaia-aa-616-a10-table1a.tsv") []
```

## 3. Plotting the data

### Position on the sky

Let's check where these stars lie on the sky, color-coding by cluster membership. Vega-Lite does support cartographic projections, as discussed below, but none accurately represent the [Equatorial Coordinate System](https://en.wikipedia.org/wiki/Equatorial_coordinate_system) used here, so as a first attempt, let's just plot `RA_ICRS` and `DE_ICRS` directly. Note that we normally "look down" on maps (we draw on the orange peel and then flatten it out to create a projection), but in our case we are actually "looking out" - so in this tortuous metaphor, we are inside the orange - which means that we end up with the "longitude" values decreasing from left to right, hence the need to sort `RA_ICRS` values in descending order.

```elm {l v}
starPos : Spec
starPos =
    let
        axOpts lbl mn mx rev =
            [ pName lbl
            , pQuant
            , pScale [ scDomain (doNums [ mn, mx ]), scNice niFalse ]
            , pSort
                [ if rev then
                    soDescending

                  else
                    soAscending
                ]
            ]

        enc =
            encoding
                << position X (axOpts "RA_ICRS" 0 360 True)
                << position Y (axOpts "DE_ICRS" -90 90 False)
                << color [ mName "Cluster" ]
    in
    toVegaLite [ data, width 300, height 300, enc [], circle [] ]
```

Note that the `RA` field wraps around at RA=0/360, so the `Blanco1` cluster is actually spatially coincident, it just annoyingly straddles the boundary.

### Map Projection

Star locations are represented as angles (ascension and declination) but the example above is simply plotting these angles as cartesian coordinates. More usefully we should project the angles just as we might with a terrestrial map projection of longitude and latitude values. Unfortunately, none of Vega Lite's [supported projections](https://vega.github.io/vega-lite/docs/projection.html#projection-types) provides a suitable projection. So instead, let's encode an [Aitoff projection](https://en.wikipedia.org/wiki/Aitoff_projection) using transformation calculations.

The first two calculations convert the angles into radians, first ensuring right ascension is scaled between -180 and 180 degrees rather than 0 to 360 degrees and flipped so we are looking 'out' from the centre the sphere not 'in' from outside. The next two calculate the intermediate _alpha_ value and its [cardinal sine](https://en.wikipedia.org/wiki/Sinc_function). The final pair use _lambda_, _phi_ and _alpha_ to calculate the projected _x_ and _y_ coordinates.

```elm {l}
aitoffTrans : String -> String -> List LabelledSpec -> List LabelledSpec
aitoffTrans lng lat =
    calculateAs (lng ++ ">180?(" ++ lng ++ "-360)*PI/-180 : " ++ lng ++ "*PI/-180") "lambda"
        << calculateAs (lat ++ "*PI/180") "phi"
        << calculateAs "acos(cos(datum.phi)*cos(datum.lambda/2))" "alpha"
        << calculateAs "datum.alpha == 0 ? 1 : sin(datum.alpha) / datum.alpha" "sincAlpha"
        << calculateAs "360*cos(datum.phi)*sin(datum.lambda/2)/(PI*datum.sincAlpha)" "x"
        << calculateAs "180*sin(datum.phi)/(PI*datum.sincAlpha)" "y"
```

We can also create our own graticule (grid lines) that will help to visualize the projected space.

```elm {l}
graticuleData : Float -> Float -> List DataColumn -> Data
graticuleData lngStep latStep =
    let
        range mn mx step =
            List.range 0 ((mx - mn) / step |> round)
                |> List.map (\x -> mn + (toFloat x * step))

        lng =
            range -180 180 lngStep
                |> List.repeat (180 // round latStep + 1)
                |> List.concat

        lat =
            range -90 90 latStep
                |> List.concatMap (List.repeat (360 // round lngStep + 1))
    in
    dataFromColumns []
        << dataColumn "lng" (nums lng)
        << dataColumn "lat" (nums lat)
```

We then project the lines of longitude and latitude using our Aitoff transformation and combine them as two layers. Note the use of the [detail](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#detail) channel to separate the coordinates that make up each line of constant longitude (meridian) and latitude (parallel) and the [order](https://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#order) channel to sequence the coordinates of each meridian line in latitude order.

```elm {l}
graticule : List Spec
graticule =
    let
        trans =
            transform
                << aitoffTrans "datum.lng" "datum.lat"

        enc =
            encoding
                << position X [ pName "x", pQuant, pAxis [] ]
                << position Y [ pName "y", pQuant, pAxis [] ]

        encParallel =
            enc
                << detail [ dName "lat" ]

        specParallel =
            asSpec
                [ graticuleData 30 10 []
                , trans []
                , encParallel []
                , line [ maStrokeWidth 0.1, maStroke "black" ]
                ]

        encMeridian =
            enc
                << detail [ dName "lng" ]
                << order [ oName "lat", oQuant ]

        specMeridian =
            asSpec
                [ graticuleData 10 2 []
                , trans []
                , encMeridian []
                , line [ maStrokeWidth 0.1, maStroke "black" ]
                ]
    in
    [ specParallel, specMeridian ]
```

And let's configure the plots so they have no axes or bounding boxes and any legend is displayed along the bottom.

```elm {l}
cfgNoBorder =
    configure
        << configuration (coView [ vicoStroke Nothing ])
        << configuration (coFacet [ facoSpacing 0 ])
        << configuration (coHeader [ hdLabelAngle 0 ])


cfg =
    cfgNoBorder
        << configuration (coView [ vicoStroke Nothing ])
        << configuration (coLegend [ lecoOrient loBottom, lecoTitleFontSize 0 ])
        << configuration
            (coAxis
                [ axcoDomain False
                , axcoGrid False
                , axcoLabels False
                , axcoTicks False
                , axcoTitleFontSize 0
                ]
            )
```

Now we have everything in place, we can plot the projected stars.

```elm {l v}
starPosAitoff : Spec
starPosAitoff =
    let
        trans =
            transform
                << aitoffTrans "datum.RA_ICRS" "datum.DE_ICRS"

        enc =
            encoding
                << position X [ pName "x", pQuant, pScale [ scNice niFalse ] ]
                << position Y [ pName "y", pQuant, pScale [ scNice niFalse ] ]
                << color [ mName "Cluster" ]

        spec =
            asSpec [ trans [], enc [], circle [ maSize 9 ] ]
    in
    toVegaLite [ cfg [], width 570, height 285, data, layer (graticule ++ [ spec ]) ]
```

### Cluster Centroids

If we want, we can treat each cluster as a point, and calculate an "average" location. The following visualization presents the average location of each cluster, where we calculate the [circular mean](https://en.wikipedia.org/wiki/Mean_of_circular_quantities) of the Right Ascension values (to account for possible wrapping around 0/360 degrees). To see the effect of this correction, we can overlay the simple average as unfilled circles, noting the different averages for _Blanco1_ that spans the 0 degree meridian.

```elm {l v interactive}
starCentroids : Spec
starCentroids =
    let
        aggTrans =
            transform
                << calculateAs "cos(datum.RA_ICRS * PI / 180)" "cosRA"
                << calculateAs "sin(datum.RA_ICRS * PI / 180)" "sinRA"
                << aggregate
                    [ opAs opMean "cosRA" "cosRA0"
                    , opAs opMean "sinRA" "sinRA0"
                    , opAs opMean "RA_ICRS" "wrong_ra0"
                    , opAs opMean "DE_ICRS" "dec0"
                    ]
                    [ "Cluster" ]
                << calculateAs "atan2(datum.sinRA0,datum.cosRA0) * 180.0 / PI" "ra0"

        clusterTrans =
            aggTrans
                << aitoffTrans "datum.ra0" "datum.dec0"

        enc =
            encoding
                << position X [ pName "x", pQuant, pScale [ scNice niFalse ] ]
                << position Y [ pName "y", pQuant, pScale [ scNice niFalse ] ]
                << color [ mName "Cluster", mLegend [] ]
                << text [ tName "Cluster" ]

        clusterSpec =
            asSpec [ clusterTrans [], enc [], circle [ maSize 90 ] ]

        clusterLabelSpec =
            asSpec [ clusterTrans [], enc [], textMark [ maAlign haLeft, maDx 8 ] ]

        uncorrectedTrans =
            aggTrans
                << aitoffTrans "datum.wrong_ra0" "datum.dec0"

        uncorrectedSpec =
            asSpec [ uncorrectedTrans [], enc [], circle [ maSize 90, maFilled False ] ]
    in
    toVegaLite
        [ cfg []
        , width 570
        , height 285
        , data
        , layer (graticule ++ [ clusterSpec, uncorrectedSpec, clusterLabelSpec ])
        ]
```

## 4. How many stars are there?

Through visual inspection it appears that the Hyades cluster has the most stars, but by how much? Let's confirm with a count of the number of stars in each cluster:

```elm {l v}
clusterCount : Spec
clusterCount =
    let
        enc =
            encoding
                << position X
                    [ pName "Cluster"
                    , pSort [ soByChannel chY, soDescending ]
                    , pTitle ""
                    ]
                << position Y
                    [ pAggregate opCount
                    , pAxis [ axTitle "Number of stars", axGrid False ]
                    ]

        barEnc =
            enc
                << color [ mName "Cluster", mLegend [] ]

        barSpec =
            asSpec [ barEnc [], bar [] ]

        labelEnc =
            enc << text [ tAggregate opCount, tQuant ]

        labelSpec =
            asSpec [ labelEnc [], textMark [ maDy -6 ] ]
    in
    toVegaLite
        [ cfgNoBorder []
        , width 300
        , height 250
        , data
        , layer [ barSpec, labelSpec ]
        ]
```

So, actually it looks like Pleiades has the most stars, it is just that they appear more concentrated in the sky than Hyades. This suggests that Pleiades may be nearer to us that Hyades, which we can look at below when we turn our attention to examining parallax.

## 5. Parallaxes

Parallax can tell us how far away from Earth an object is. Let's firstly examine the parallax values of all stars, coloured by the cluster in which they belong:

```elm {l v}
parTicks : Spec
parTicks =
    let
        enc =
            encoding
                << position X [ pName "plx", pQuant, pTitle "parallax (mas)" ]
                << color [ mName "Cluster", mLegend [] ]
    in
    toVegaLite [ width 400, data, enc [], tick [ maOpacity 0.1 ] ]
```

And now adding a Y axis to separate out the clusters:

```elm {l v}
parTicksSeparated : Spec
parTicksSeparated =
    let
        enc =
            encoding
                << position X [ pName "plx", pQuant, pTitle "parallax (mas)" ]
                << position Y [ pName "Cluster" ]
                << color [ mName "Cluster", mLegend [] ]
    in
    toVegaLite [ width 400, data, enc [], tick [ maOpacity 0.1 ] ]
```

So, most of the clusters have a parallax around 7 or so, with a small spread, but Hyades has much larger values (and range of values). I have mentioned in the introduction that the parallax field is a measure of the distance to a star, and when looking at the distribution on the sky I suggested that the significantly-larger apparent size of Hyades (that is, the "radius" of the cloud is larger for Hyades than the others) that Hyades is probably nearer. If you're asking yourself "how can something with a larger measure of distance be nearer?"" then you haven't hung around many Astronomers! We have plenty of examples of things going "backwards" (there's the whole kerfuffle above with Right Ascension, and below with magnitudes), and in this case the parallax of a source is measured by an angle (in this case with units of "mas", or "milli-second of arc", which is $10^{-3} / 3600$ of a degree). As briefly mentioned in this [ESA press release about Gaia](http://sci.esa.int/gaia/60200-parallaxes-in-gaia-s-sky), the parallax is the difference in position on the sky of the star as the Earth orbits the Sun, so a larger angle (parallax) means that the star is nearer to us.

The number of stars in each cluster makes it hard to determine the distribution of parallaxes for each of them. So let's calculate some statistics (median, minimum, maximum, and the lower- and upper- quartiles) and draw a "box and whiskers" plot, sorted by median parallax for each cluster:

```elm {l v}
parDist : Spec
parDist =
    let
        enc =
            encoding
                << position X [ pName "plx", pQuant, pTitle "parallax (mas)" ]
                << row [ fName "Cluster", fSort [ soByField "plx" opMedian ] ]
                << color [ mName "Cluster", mLegend [] ]
    in
    toVegaLite
        [ cfgNoBorder []
        , width 400
        , height 30
        , data
        , enc []

        -- Bug in boxplot prevents sorting if exRange used, so use 10IQRs instead.
        , boxplot [ maExtent (exIqrScale 10), maSize 10 ]
        ]
```

Parallax measurements will have errors associated with them, which are recorded in the `e_plx` field, and given the distribution above (that is, the "box" part of the box-and-whiskers, which represents the central half of the distribution, is small), I assume that the errors are pretty small. But we can inspect the errors visually be plotting the `e_plx` distributions for each cluster:

```elm {l v}
parErrs : Spec
parErrs =
    let
        enc =
            encoding
                << position X
                    [ pName "plx"
                    , pQuant
                    , pTitle "parallax (milli-arcsecond)"
                    , pScale [ scType scLog, scNice niFalse ]
                    ]
                << position Y
                    [ pName "e_plx"
                    , pQuant
                    , pTitle "error (milli-arcsecond)"
                    ]
                << color [ mName "Cluster" ]
    in
    toVegaLite [ width 400, data, enc [], circle [ maOpacity 0.2 ] ]
```

It would appear that there are some parallax errors of 0, which seems unlikely, so we can filter them out and show low error values more effectively on a log scale:

```elm {l v}
parErrsNoZero : Spec
parErrsNoZero =
    let
        trans =
            transform
                << filter (fiExpr "datum.e_plx != 0")

        enc =
            encoding
                << position X
                    [ pName "plx"
                    , pQuant
                    , pTitle "parallax (milli-arcsecond)"
                    , pScale [ scType scLog, scNice niFalse ]
                    ]
                << position Y
                    [ pName "e_plx"
                    , pQuant
                    , pScale [ scType scLog ]
                    , pTitle "error (milli-arcsecond)"
                    ]
                << color [ mName "Cluster" ]
    in
    toVegaLite
        [ width 400
        , height 300
        , data
        , trans []
        , enc []
        , circle [ maOpacity 0.2 ]
        ]
```

The errors are, when positive, pretty small. Another way of looking at this is the "signal-to-noise" ratio. That is, divide the measured value by its error, which we want to be "large" (the exact value at which we start taking a measurement as meaningful is a matter of debate, and depends in part on what the reported error corresponds to):

```elm {l v}
sigPlots : Spec
sigPlots =
    let
        trans =
            transform
                << filter (fiExpr "datum.e_plx > 0")
                << calculateAs "datum.plx / datum.e_plx" "sig_plx"

        enc =
            encoding
                << position X
                    [ pName "plx"
                    , pQuant
                    , pScale [ scType scLog, scNice niFalse ]
                    ]
                << position Y [ pName "sig_plx", pQuant, pScale [ scType scLog ] ]
                << color [ mName "Cluster" ]
    in
    toVegaLite [ width 400, data, trans [], enc [], point [ maOpacity 0.5 ] ]
```

All distances have a signal-to-noise ratio of at least 10, which is reassuring

## 6. Magnitudes

The remaining field to look at is `Gmag`, which stores the "magnitude" of a star. This is a measure of how bright it is, but – as with most things Astronomical – it's [not completely simple](https://en.wikipedia.org/wiki/Magnitude_%28astronomy%29):

- the scale used is logarithmic;
- it's not just that it's logarithmic, but there's a scaling factor applied to the logarithm too;
- the scale used is inverted, so that brighter objects have a smaller magnitude, because why would you not do that;
- the measurement is over a fixed "band", that is range of wavelengths, and so does not reflect all the light emitted by the star, but just a small part of its optical output (as an X-ray astronomer I feel honor-bound to point out that [stars emit in X-rays](http://xrt.cfa.harvard.edu/xpow/20190226.html) as well as the optical)
- we have "apparent" and "absolute" magnitudes, which refer to "how much light reaches us (well, really, the telescope)" and "how bright is the object intrinsically", which is flux and luminosity, respectively. In this case we have apparent magnitudes.

As we have apparent magnitudes, then the distribution of magnitudes should not vary strongly with distance $^\dagger$. Note that this assumes that the distribution of absolute magnitudes of the stars does not vary with cluster, which is actually not true, but it's a good enough for this quick look.

$\dagger$ The assumption here is that the catalog has a near-to-uniform flux limit $f_{\rm lim}$; that is, as Gaia looks at different stellar clusters the apparent magnitude of the faintest star we can reliably measure is similar. This then means that the faintest luminosity, $L_{\rm min}$ we can measure depends on the cluster, since $L_{\rm min} = 4 \pi d^2 f_{\rm min}$, where $d$ is the distance to the star. This then gets converted to magnitudes with a logarithm and a scaling factor, but the correlation between flux (apparent magnitude), luminosity (absolute magnitude), and distance measurements still holds. However, there are plenty of reasons why the flux limit can depend on the cluster being observed – for instance, it becomes harder to disentangle two stars as their projected separation (how close they appear to be in the plane of the sky) decreases, and this becomes more important the more-distant the cluster – so you have to understand the biases in your data before drawing too many conclusions.

```elm {l v}
magVsParallax : Spec
magVsParallax =
    let
        enc =
            encoding
                << position X [ pName "Gmag", pQuant ]
                << position Y
                    [ pName "plx"
                    , pQuant
                    , pScale [ scType scLog, scNice niFalse ]
                    ]
                << color [ mName "Cluster" ]
    in
    toVegaLite [ width 400, height 300, data, enc [], square [ maOpacity 0.5 ] ]
```

There's some scaling between the minimum `Gmag` and parallax (remember that as both quantities get smaller we are looking at brighter objects and larger distances), but it's not a huge effect. As the further clusters are all bunched together on this plot, let's look at histograms of the `Gmag` distributions:

```elm {l v}
gmagDist : Spec
gmagDist =
    let
        enc =
            encoding
                << position X [ pName "Gmag", pQuant, pBin [ biMaxBins 20 ] ]
                << position Y [ pAggregate opCount, pTitle "Number of stars" ]
                << color [ mName "Cluster" ]
    in
    toVegaLite [ width 500, height 500, data, enc [], bar [] ]
```

Well, that's very colourful, but let's see what the individual cluster distributions look like by faceting on the Cluster field and viewing frequencies on a (sym)log scale:

```elm {l v}
perCluster : Spec
perCluster =
    let
        cfgFacet =
            configure
                << configuration (coHeader [ hdLabelAngle 0, hdTitleFontSize 0 ])
                << configuration (coAxis [ axcoTitleFontSize 0 ] |> coAxisYFilter)

        enc =
            encoding
                << position X [ pName "Gmag", pQuant, pBin [ biMaxBins 20 ] ]
                << position Y [ pAggregate opCount, pScale [ scType scSymLog ] ]
                << color [ mName "Cluster", mLegend [] ]
                << row [ fName "Cluster", fHeader [ hdLabelAnchor anStart ] ]
    in
    toVegaLite [ cfgFacet [], width 300, height 100, data, enc [], bar [] ]
```

## 7. Adding interactivity

I thought I'd try and add some interaction, where you can drag across several bins in one of the histograms (Gmag or plx) and see the corresponding elements in the other plot. The plot starts out with everything selected (so it's all yellow-ish), but if you click and drag within a plot you should see changes in both).

I had started out with the idea of including the "cluster distribution" as a view, but quickly dropped that idea as I am not sure how to handle the repeat here as the column types change (Quantitative for Gmag and plx but Ordinal for Cluster), so gave up.

```elm {l v interactive}
crossfilter : Spec
crossfilter =
    let
        sel =
            selection
                << select "brush" seInterval [ seEncodings [ chX ] ]

        enc =
            encoding
                << position X [ pRepeat arFlow, pBin [ biMaxBins 20 ], pQuant ]
                << position Y [ pAggregate opCount, pTitle "Number of Stars" ]

        trans =
            transform
                << filter (fiSelection "brush")

        lyr1 =
            asSpec [ sel [], bar [], enc [] ]

        lyr2 =
            asSpec [ trans [], enc [], bar [ maColor "goldenrod" ] ]
    in
    toVegaLite
        [ data
        , repeatFlow [ "Gmag", "plx" ]
        , specification (asSpec [ width 300, height 200, layer [ lyr1, lyr2 ] ])
        ]
```
