---
id: "litvis"
narrative-schemas:
  - ../schemas/tutorial
---

@import "../css/tutorial.less"

_Litvis tutorials: Introducing Elm._

1. [Introduction](elmIntroduction1.md)
2. [Functions, functions, functions](elmIntroduction2.md)
3. [Types and pattern matching](elmIntroduction3.md)
4. **Lists and list processing**
5. [Elm and elm-vegalite](elmIntroduction5.md)

---

# Lists and list processing

Elm provides several ways of representing collections of items including [records](http://elm-lang.org/docs/records), [arrays](http://package.elm-lang.org/packages/elm-lang/core/latest/Array) and [tuples](http://package.elm-lang.org/packages/elm-lang/core/latest/Tuple), but the most common approach and one used extensively in both elm-vega and elm-vegalite is the [list](http://package.elm-lang.org/packages/elm-lang/core/latest/List).

Lists comprise items of the same type and are immutable once created. They are represented as values separated by commas inside square brackets and can be created by explicitly naming their contents, or as returned values from other functions:

```elm {l raw}
ages : List Int
ages =
    [ 49, 24, 16, 58, 13 ]


names : List String
names =
    [ "John", "Paul", "George", "Ringo" ]


mySequence : List Int
mySequence =
    List.range 3 13
```

Unlike arrays there is no random access to list items, but the _head_ and _tail_ of any list can be easily found. Because a list can be empty (`[]`), there is no guarantee that a list will be separable into a head and tail, so these functions return a `Maybe` value:

```elm {l raw}
leader : String
leader =
    List.head names |> Maybe.withDefault "No band leader"


followers : List String
followers =
    List.tail names |> Maybe.withDefault []
```

While lists are immutable, it is easy (and efficient) to create new lists by joining new values and an existing list. This is achieved with the [cons operator `::`](http://package.elm-lang.org/packages/elm-lang/core/latest/List#::)

```elm {l siding}
newNames : List String
newNames =
    "Pete" :: names
```

The cons operator will always append an item to the head of a list, but items can be reordered with a number of the functions in the [List module](http://package.elm-lang.org/packages/elm-lang/core/latest/List) such as `List.reverse`:

```elm {l raw}
newNames : List String
newNames =
    "Pete" :: List.reverse names |> List.reverse
```

Here we have created a new list by adding 'Pete' to a reversed copy of the previous list of names and then creating a reversed copy of that new list. The effect of which is to add 'Pete' to the end of the original list.

Note that as with all elm values, lists are _immutable_ so can never change their contents. What we are doing above is to create a completely new list (`newNames`) based on the contents of an existing one (`names`). At no point does `names` ever contain `"Pete"`.

## Processing lists with recursion

The cons operator is particularly useful when pattern matching. It allows us to name the head and tail of a list (if it has any contents) and do something with each of them. When combined with a recursive call to itself, this allows a function to process the individual elements in a list one by one:

```elm {l raw siding}
sum : number -> List number -> number
sum acc list =
    case list of
        [] ->
            acc

        hd :: tl ->
            sum (acc + hd) tl


sumList : Int
sumList =
    sum 0 (List.range 1 10)
```

The example above uses _tail call recursion_ where the recursion to the next level (a call to `sum`) is the last and only operation of the function. If the last line of the example above was instead `0 + sum (acc+hd) tl`, this would be much slower as the stack needs to keep track of every recursive call in order to complete the succession of `+` operations (even though we are not changing anything by adding zero in this example).

## Folding lists

Folding (sometimes referred to as 'reducing') lists can be used as an alternative to recursing to process list elements and will generally be clearer, more compact and sometimes faster (e.g. by ensuring tail-call recursion). The result of the processing might be another list or some reduced representation (such as the sum or concatenated value). Folds can proceed from left to right with [List.foldl](http://package.elm-lang.org/packages/elm-lang/core/latest/List#foldl) (most efficient) or right to left with [List.foldr](http://package.elm-lang.org/packages/elm-lang/core/latest/List#foldr).

The general form is `(a -> b -> b) b List a` where `a` is the type of element in the source list and `b` is the type of the resulting fold. The first parameter `(a -> b -> b)` is a reducing function which itself takes parameters representing the source and result types and returns an evaluated result.

For example, to create a function that calculates the sum of a list of numbers:

```elm {l siding}
sum : List number -> number
sum list =
    List.foldl (\a b -> a + b) 0 list
```

Because in Elm operators are also functions, we can produce a more compact version by replacing the anonymous function `\a b -> a + b` with its point-free prefix function `(+)`

```elm {l raw siding}
sum : List number -> number
sum list =
    List.foldl (+) 0 list


sumList : Int
sumList =
    List.range 1 1000 |> sum
```

Addition is commutative so `foldl` and `foldr` would produce the same result in the examples above and therefore, for efficiency, `foldl` should be preferred. But below is an example of reversing the contents of a list using the `::` (cons) operator where only `foldl` would give the expected result,

```elm {l siding}
rev : List a -> List a
rev list =
    List.foldl (::) [] list
```

By convention, as with all functions, if a parameter of the reducing function is not actually used, it is given the name `_` rather than, say, `a` or `b`. For example, this fold calculates the length of a list so doesn’t actually need to do anything with the value of the first parameter (elements of the list to fold):

```elm {l siding}
len : List a -> Int
len list =
    List.foldl (\_ b -> b + 1) 0 list
```

Folding is often used in place of the iterating constructions such as loops seen in other languages.

If the intermediate steps of a folding operation need to be stored, we can create a `scanl` function to be used in place of `foldl`:

```elm{l}
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

We can use it, for example, in the generation of a triangular number sequence:

```elm {l siding }
triList : Int -> List Int
triList upper =
    List.range 2 upper |> scanl (\a b -> a + b) 1
```

Or in point-free style using functional composition:

```elm {l}
triList : Int -> List Int
triList =
    List.range 2 >> scanl (+) 1
```

```elm {l raw}
triOutput : List Int
triOutput =
    triList 20
```

## Transforming list contents with map

The final commonly used function with lists we will consider here is [map](http://package.elm-lang.org/packages/elm-lang/core/latest/List#map), which is used to apply some transforming function to each item in a list.

For example, here's a mapping that doubles every number in a list:

```elm {l siding}
doubler : List Int -> List Int
doubler xs =
    List.map (\x -> x * 2) xs
```

Or the same function in point-free style using the infix version of `(*)`:

```elm {l}
doubler : List Int -> List Int
doubler =
    List.map ((*) 2)
```

```elm {l raw}
doublerOutput : List Int
doublerOutput =
    List.range 1 10 |> doubler
```

## Using tuples to compare adjacent list items

Using the map function as above is helpful when you want to change each item in that list independently of all other items (doubling a number does not depend on the values of any of the other numbers in the list). Sometimes though you may wish to perform actions that depend on adjacent list items (similar to [window transforms](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest/VegaLite#window) available via elm-vegalite). For example, you could increase the value of a list item by one if the next item is larger, or decrease it by one if the next item is smaller (effectively 'smoothing' the numbers in a list).

To help do this, we can transform a list of numbers into a list of _tuples_. A tuple is an ordered sequence of values, indicated in Elm by comma separated values enclosed in brackets. Unlike a list, a tuple does not have to contain elements all of the same type. The following are all valid tuples:

```elm {l siding}
myPair : ( Int, Int )
myPair =
    ( 5, 75 )


myTriplet : ( Float, Float, Float )
myTriplet =
    ( 1.4, 75, 2.9 )


person : ( String, Int )
person =
    ( "Ada Lovelace", 1815 )
```

We can use a variation of `map`, called [map2](http://package.elm-lang.org/packages/elm-lang/core/latest/List#map2) that creates a new list based on the transformation of two other lists.If those two lists consist of the original list and original list without the first item, we can combine them as a list of tuples using the tuple construction function `Tuple.pair`:

```elm {l}
neighbours : List a -> List ( a, a )
neighbours items =
    List.map2 Tuple.pair items (List.tail items |> Maybe.withDefault [])
```

```elm {l raw}
neighbourOutput : List ( Int, Int )
neighbourOutput =
    neighbours [ 1, 2, 3, 4, 5 ]
```

Notice that the new list is one shorter than the original because the last item in the original list has no value following it so cannot be transformed into a tuple.

The final stage is to process this list of tuples to perform our 'add one if smaller than next or subtract one if larger':

```elm {l}
smooth : List Int -> List Int
smooth items =
    let
        equalise ( a, b ) =
            if a > b then
                a - 1

            else if a < b then
                a + 1

            else
                a
    in
    neighbours items |> List.map equalise
```

```elm {l raw}
smoothOutput : List Int
smoothOutput =
    smooth [ 1, 10, 1, 10, 1, 10 ]
```

{(question |}

1. How would you express the `smooth` function in point-free style?

1. The `neighbours` function drops the last item in the original list, so a smoothed version is one item shorter than the original. How could you adapt `neighbours` so the smoothed list maintains the length of the input list?

{|question )}

```elm {l=hidden}
smooth2 : List Int -> List Int
smooth2 =
    let
        equalise ( a, b ) =
            if a > b then
                a - 1

            else if a < b then
                a + 1

            else
                a
    in
    neighbours >> List.map equalise


neighbours2 : List a -> List ( a, a )
neighbours2 items =
    case items of
        x :: xs ->
            List.map2 Tuple.pair (x :: items) items

        _ ->
            []
```

---

_Next >>_ [Elm and elm-vegalite](elmIntroduction5.md)
