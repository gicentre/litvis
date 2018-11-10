---
id: "litvis"
---

@import "assets/litvis.less"

# Exploring approximations of e

The constant _e_ is defined by the series:

    e = 1/0! + 1/1! + 1/2! + 1/3! + ...

To generate a list of these terms we could first create a function to generate a list of consecutive factorials:

```elm {l=hidden}
eElm : Float
eElm =
    e


scanl : (a -> b -> b) -> b -> List a -> List b
scanl fn b =
    let
        scan a bs =
            case bs of
                hd :: tl ->
                    fn a hd :: bs

                _ ->
                    []
    in
    List.foldl scan [ b ] >> List.reverse
```

```elm {l}
listLength : Int
listLength =
    -- Change this value to see the effect on the accuracy of the approximation.
    10


facList : List Int
facList =
    scanl (*) 1 (List.range 1 listLength)
```

Using that list we can now easily generate the series that tends towards _e_ as the list grows:

```elm {l raw}
eSeries : List Float
eSeries =
    let
        recips =
            List.map (\x -> 1 / toFloat x) facList
    in
    scanl (+) 0 recips
```

Replacing `scanl` with `foldl` would generate the approximated value of _e_ to a precision determined by the `listLen`.

Compare the approximated value ^^^elm r=eApprox^^^ with Elm's constant _e_: ^^^elm r=eElm^^^.

```elm {l=hidden}
eApprox : Float
eApprox =
    let
        recips =
            List.map (\x -> 1 / toFloat x) facList
    in
    List.foldl (+) 0 recips
```
