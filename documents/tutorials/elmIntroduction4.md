---
id: "litvis"
---

@import "css/tutorial.less"

1.  [Introduction](elmIntroduction1.md)
2.  [Functions, functions, functions](elmIntroduction2.md)
3.  [Types and pattern matching](elmIntroduction3.md)
4.  **Lists and list processing**
5.  [Elm and elm-vega](elmIntroduction5.md)

---

# Lists and list processing

Elm provides several ways of representing collections of items including [records](http://elm-lang.org/docs/records), [arrays](http://package.elm-lang.org/packages/elm-lang/core/latest/Array) and [tuples](http://package.elm-lang.org/packages/elm-lang/core/5.1.1/Tuple), but the most common approach and one used extensively in elm-vega is the [list](http://package.elm-lang.org/packages/elm-lang/core/latest/List).

Lists comprise items of the same type and are immutable once created.
They are represented as values separated by commas inside square brackets and can be created by explicitly naming their contents, or as returned values from other functions:

```elm {l}
ages : List Int
ages =
    [ 49, 24, 16, 58, 13 ]


names : List String
names =
    [ "John", "Paul", "Ringo", "George" ]


mySequence : List Int
mySequence =
    List.range 3 13
```

^^^elm{raw=[ages,names,mySequence]}^^^

Unlike arrays there is no random access to list items, but the _head_ and _tail_ of any list can be easily found.
Because a list can be empty (`[]`), there is no guarantee that a list will be sepraable into a head and tail, so these functions return a `Maybe` value:

```elm {l}
leader : String
leader =
    List.head names |> Maybe.withDefault "No band leader"


followers : List String
followers =
    List.tail names |> Maybe.withDefault []
```

^^^elm{raw=[leader,followers]}^^^

While lists are immutable, it is easy (and effiecient) to create new lists by joining a new values and an existing list.
This is achieved with the [cons operator `::`](http://package.elm-lang.org/packages/elm-lang/core/latest/List#::)

```elm {l siding}
newNames : List String
newNames =
    "Pete" :: names
```

The cons operator will always append an item to the head of a list, but items can be reordered with a number of the functions in the [List module](http://package.elm-lang.org/packages/elm-lang/core/5.1.1/List) such as `List.reverse`:

```elm {l}
newNames : List String
newNames =
    "Pete" :: List.reverse names |> List.reverse
```

^^^elm{raw=[newNames]}^^^

### Processing lists with recursion

The cons operator is particularly useful when pattern matching as it allows us to name the head and tail of a list (if it has any contents) and do something with each of them.
When combined with a recursive call to itself, this allows a function to process the individual elements in a list one by one:

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

The example above uses _tail call recursion_ where the recursion to the next level (a call to `sum`) is the last and only operation of the function.
If the last line of the example above was instead `0 + sum (acc+hd) tl`, this would be much slower as the stack needs to keep track of every recursive call in order to complete the succession of `+` operations (even though we are not changing anything by adding zero in this example).

### Folding lists

Folding (sometimes referred to as 'reducing') lists can be used as an alternative to recursing to process list elements and will generally be clearer, more compact and sometimes faster (e.g. by ensuring tail-call recursion).
The result of the processing might be another list or some reduced representation (such as the sum or concatenated value).
Folds can proceed from left to right with [List.foldl](http://package.elm-lang.org/packages/elm-lang/core/latest/List#foldl) (most efficient) or right to left with [List.foldr](http://package.elm-lang.org/packages/elm-lang/core/latest/List#foldr).

The general form is `(a → b → b) b List a` where `a` is the type of element in the source list and `b` is the type of the resulting fold.
The first parameter is a reducing function which itself takes parameters representing the source and result types and returns a result.

For example, to create a function to calculate the sum of a list of numbers:

```elm {l siding}
sum : List number -> number
sum list =
    List.foldl (\a b -> a + b) 0 list
```

Because in Elm operators are also functions, we can produce a more compact version by replacing the anonymous function `\a b -> a + b` with the infix function `(+)`

```elm {l raw siding}
sum : List number -> number
sum list =
    List.foldl (+) 0 list


sumList : Int
sumList =
    List.range 1 1000 |> sum
```

Addition is commutative so `foldl` and `foldr` would produce the same result in the examples above and therefore, for efficiency, `foldl` would be preferred.
But below is an example of reversing the contents of a list using the `::` (cons) operator where only `foldl` would give the expected result,

```elm {l siding}
rev : List a -> List a
rev list =
    List.foldl (::) [] list
```

By convention, as with all functions, if a parameter of the reducing function is not actually used, it is given the name `_` rather than, say, `a` or `b`.
For example this fold calculates the length of a list so doesn’t actually need to do anything with the value first parameter (elements of the list to fold):

```elm {l siding}
len : List a -> Int
len list =
    List.foldl (\_ b -> b + 1) 0 list
```

If the intermediate steps of a folding operation need to be stored, `scanl` and `scanr` can be used in place of `foldl` and `foldr`.

Here for example is a the generation of a triangular number sequence:

```elm {l siding }
triList : Int -> List Int
triList upper =
    List.range 2 upper |> List.scanl (\a b -> a + b) 1
```

Or in 'point-free' style using functional composition:

```elm {l}
triList : Int -> List Int
triList =
    List.range 2 >> List.scanl (+) 1
```

```elm {l raw}
output : List Int
output =
    triList 20
```

^^^elm {raw=output}^^^

### Transforming list contents with map

_TODO_

---

_Next >>_ [Elm and elm-vega](elmIntroduction5.md)
