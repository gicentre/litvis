---
id: "litvis"
---

@import "../css/tutorial.less"

_Litvis tutorials: Introducing Elm._

1.  [Introduction](elmIntroduction1.md)
2.  [Functions, functions, functions](elmIntroduction2.md)
3.  **Types and pattern matching**
4.  [Lists and list processing](elmIntroduction4.md)
5.  [Elm and elm-vegalite](elmIntroduction5.md)

---

# Types and pattern matching

Elm is a statically typed language. This means that when you declare a function or one of its parameters to be of a particular type such as `Int`, `Float`, `String`, `Bool`, it can never change type during the program's lifetime. This apparent restriction is helpful in keeping your programs bug-free as the Elm compiler will flag any unexpected change in type as an error indicating the source of the problem.

For example, this function would be flagged with an explanatory error:

```elm
myErroneousFunction : Float
myErroneousFunction =
    "0.1234"
```

    Something is off with the body of the `myErroneousFunction` definition:

    The body is a string of type:

        String

    But the type annotation on `myErroneousFunction` says it should be:

        Float

This is much more helpful than having your program make some unexpected or hidden conversion from the string "0.1234" into a number.

## Creating custom types

Suppose you wish to create some functions that deal with the days of the week.
You could represent each day with the `String` type (`"Monday"`, `"Tuesday"` etc.), but this is vulnerable to hard-to-spot errors if somewhere in your program you misspell one of the days, or you forget whether you are using full names or abbreviations (`"Tue"` or`"Tues"` or `"Tuesday"`?).

Instead, you can create your own custom types that restrict values to a named set of options known as _constructors_. This has the advantage of marshalling the Elm compiler to help spot mistakes, as any inconsistent naming will be flagged as an error. These custom types (also known as algebraic data types or union types) are similar to, but more powerful than, 'enum' types available in some other languages.

Here is how you might create a day of the week custom type, using the Elm keyword `type` with available constructors separated with the vertical bar symbol `|`, noting that custom types and their constructors must start with an upper-case letter:

```elm {l}
type DayOfWeek
    = Monday
    | Tuesday
    | Wednesday
    | Thursday
    | Friday
    | Saturday
    | Sunday
```

Once created, the custom type can be used just like any other in-built type:

```elm {l siding raw}
nextDay : DayOfWeek -> DayOfWeek
nextDay day =
    if day == Monday then
        Tuesday

    else if day == Tuesday then
        Wednesday

    else if day == Wednesday then
        Thursday

    else if day == Thursday then
        Friday

    else if day == Friday then
        Saturday

    else if day == Saturday then
        Sunday

    else
        Monday


tomorrow : DayOfWeek
tomorrow =
    nextDay Friday
```

## Pattern Matching

Because simple custom types consist of a finite set of named alternatives, it is common to use _pattern matching_ to make code conditional on the value of the custom type. In the example above, we used a series of nested `if...then...else` expressions, but a clearer and more flexible approach can be achieved using Elm's `case ... of`. Here is the same `nextDay` function expressed using `case ... of`:

```elm {l siding}
nextDay : DayOfWeek -> DayOfWeek
nextDay day =
    case day of
        Monday ->
            Tuesday

        Tuesday ->
            Wednesday

        Wednesday ->
            Thursday

        Thursday ->
            Friday

        Friday ->
            Saturday

        Saturday ->
            Sunday

        Sunday ->
            Monday
```

To the left of each arrow is the constructor pattern we wish to match and to the right, the value to be returned if that pattern is found.

The compiler will ensure we have considered all possible constructors by flagging an error if any patterns could be produced that we have not accounted for. We do not need to account for every pattern individually if we want to apply some default behaviour to some constructors:

```elm {l raw siding}
diary : DayOfWeek -> String
diary day =
    case day of
        Saturday ->
            "Go shopping"

        Sunday ->
            "Go for a bike ride"

        _ ->
            "Go to work"


activity : String
activity =
    diary Friday
```

The `_` symbol is a wildcard and acts as a default 'else' if none of the previous cases are matched.

## Tagged custom types

The real power and flexibility of custom types comes when they contain _tags_ similar to function parameters. A tag is simply another type that follows a constructor and allows it to carry extra information.

```elm {l raw siding}
type Course
    = Assessed Int
    | NonAssessed


courseDesc : Course -> String
courseDesc course =
    case course of
        Assessed credits ->
            "Assessed course worth " ++ String.fromInt credits ++ " credits."

        NonAssessed ->
            "Non-assessed course."


report : String
report =
    let
        datavis101 =
            Assessed 15

        litvis101 =
            NonAssessed
    in
    courseDesc datavis101
```

In the example above, the `Course` type has two constructors, one of which is tagged with an `Int` meaning that to specify it we have to both name it (`Assessed`) and provide an integer value (representing the number of credits associated with the course). As in this example, there is no requirement for a custom type's constructors to share the same tags or tag types.

When we pattern match tagged custom types with `case ... of` we need to give a name to the tag so we can do something with its value. In the example above, we called that name `credits` so we could handle it in building a string describing the course assessment.

## Elm's built-in custom types

Elm has a few of its own tagged custom types that are handy for representing uncertain values.

### Maybe

The [Maybe](http://package.elm-lang.org/packages/elm-lang/core/latest/Maybe) type is used to represent values that may or may not exist, providing a more robust alternative to the `null` value common in other languages. It has two constructors: `Just a` for storing a value of any type or `Nothing` to represent the absence of a valid value.

For example, suppose we wished to have a square root function that was only applied to non-negative numbers:

```elm {l}
safeSqrt : Float -> Maybe Float
safeSqrt x =
    if x >= 0 then
        Just (sqrt x)

    else
        Nothing
```

If a non-negative number is provided, the function calculates its square root and wraps it in a `Just`. Negative values will always result in the `Nothing` constructor being returned. We can handle both situations with some pattern matching:

```elm {l siding raw}
output : String
output =
    let
        sqrtMessage n =
            case safeSqrt n of
                Just x ->
                    "Square root of " ++ String.fromFloat n ++ " is " ++ String.fromFloat x

                Nothing ->
                    String.fromFloat n ++ " does not have a real square root"
    in
    sqrtMessage 2
```

Elm has a few useful functions for handling `Maybe` values. One of the most useful is [Maybe.withDefault](http://package.elm-lang.org/packages/elm-lang/core/5.1.1/Maybe#withDefault) that extracts the `Just` value if it exists or provides a default in the case of `Nothing`:

```elm {l siding raw}
output : Float
output =
    safeSqrt -256 |> Maybe.withDefault 0
```

### Result

Similar to `Maybe`, [Result](http://package.elm-lang.org/packages/elm-lang/core/5.1.1/Result) also has two constructor values and is used for representing the result of actions that may or may not be successful. Successful results are wrapped in the `Ok` tag, just like `Just` and unsuccessful results are represented by an `Err` tag that can contain some arbitrary value to be used in error handling.

Here is an adaptation of our safe square root function using `Result` instead of `Maybe`. Note that in the type annotation of `Result` we have to specify the types used by both the `Err` and `Ok` constructors (here, `String` for errors and `Float` for successful calculations):

```elm {l}
resultSqrt : Float -> Result String Float
resultSqrt x =
    if x < 0 then
        Err (String.fromFloat x ++ " does not have a real square root")

    else
        Ok (sqrt x)
```

```elm {l siding raw}
output : Result String Float
output =
    resultSqrt -256
```

_Next >>_ [Lists and list processing](elmIntroduction4.md)
