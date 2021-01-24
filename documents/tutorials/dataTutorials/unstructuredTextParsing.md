---
id: litvis

narrative-schemas:
  - ../schemas/tutorial.yml

elm:
  dependencies:
    elm/parser: latest
---

@import "../css/tutorial.less"

```elm {l=hidden}
import Parser as P exposing ((|.), (|=), Parser)
```

_This is one of a series of 'data' tutorials for use with litvis._

1.  [Parsing structured text](assemblyParsing.md)
1.  **Parsing unstructured text**
1.  [Parsing CSV](csvParsing.md)
1.  [Parsing datalog](datalogParsing.md)

---

# Using Elm Parser to Process Unstructured Text

{(infobox|}

New Elm parser functions introduced:

- chomping characters with [chompWhile](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompWhile)
- flexible number parsing with [number](https://package.elm-lang.org/packages/elm/parser/latest/Parser#number)
- repeating parsing with [loop](https://package.elm-lang.org/packages/elm/parser/latest/Parser#loop), [Step](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Step) and [end](https://package.elm-lang.org/packages/elm/parser/latest/Parser#end)

{|infobox)}

The [previous chapter](assemblyParsing.md) in this tutorial considered how to combine parsers to process some structured input. In this chapter we will consider how to adapt the approach for less structured text.

Let's set as our initial goal, the ability to count the number of cats mentioned in some text. For example, parsing the following

```elm {l}
input1 : String
input1 =
    "Looking out of the window I could see 3 cats and 2 dogs playing catch in the garden."
```

should return the value 3.

## Setting up the parser infrastructure

As previously we must import the [Elm parser package](https://package.elm-lang.org/packages/elm/parser/latest/) and set up a top-level function that runs a parser and returns the result (again ignoring error handling for the moment):

```elm {l}
parse : Parser a -> String -> Maybe a
parse parser =
    P.run parser >> Result.toMaybe
```

## A simple parser

We know we are looking for numbers in our text, and until we find a number we can ignore the preceding text. Elm parser's [chompWhile](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompWhile) will proceed through the input text, character at a time, while a condition is met. In our case, that each character is not a digit. At the point this parser succeeds, the next character to parse should be a digit or we've reached the end of the input text.

```elm {l}
ignoredText : Parser ()
ignoredText =
    P.chompWhile (not << Char.isDigit)
```

The example above creates a parser that does not return a value (indicated by the empty tuple `()` for the parser's type). Its purpose is simply to send input text through the parsing pipeline until we get to something interesting.

Once we are at a point where the next character is a digit we can attempt to extract a numeric value using Elm's [int](https://package.elm-lang.org/packages/elm/parser/latest/Parser#int) parser, which will return a positive integer if the parsing succeeds. But we only wish to keep that a number if the text following it refers to a cat. We use the parser pipe operators to specify the sequence of parsers either choosing to extract what is parsed [(|=)](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed) or choosing to ignore it [(|.)](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed). If any of the parsers do not succeed, the parser as a whole will not succeed.

Using [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword) to look for specific words performs a one character _lookahead_ after the keyword to ensure we have reached the end of the word, thus distinguishing `cats` from `catsup` etc.

Putting these together with our `ignoredText` parser, we can create our cat parser to extract the value of some numeric text only if it is immediately followed by the word `cats`:

```elm {l}
catCounter1 : Parser Int
catCounter1 =
    P.succeed identity
        |. ignoredText
        |= P.int
        |. P.spaces
        |. P.keyword "cats"
```

^^^elm r=(parse catCounter1 input1)^^^

The example above creates a parser of type `int` so when the parser succeeds, we need to provide an integer value. This is the one captured by the line `|= P.int`. The general rule here when using parser pipes is that the parameters expected by the parser should match the sequence of `|=` pipe operators. In this case, `P.int` returns an integer directly, so we can use `P.succeed identity` to provide the value (remembering it is the equivalent to the function `\n -> n`).

## Making the parser more flexible

### Singular and Plurals

Our parser works for the simple example, but what would happen if it were to parse the following sentence?

```elm {l}
input2 : String
input2 =
    "Looking out of the window I could see 1 cat and 2 dogs playing catch in the garden."
```

^^^elm r=(parse catCounter1 input2)^^^

The problem is that we are looking for numbers followed by the word `cats`, but we could also legitimately have the word `cat`. This is easily solved with the option [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf) that allows us to consider alternatives in our parsing sequence:

```elm {l}
catCounter2 : Parser Int
catCounter2 =
    P.succeed identity
        |. ignoredText
        |= P.int
        |. P.spaces
        |. P.oneOf [ P.keyword "cats", P.keyword "cat" ]
```

^^^elm r=(parse catCounter2 input2 )^^^

### Repeated Parsing

Let's try it with another sentence:

```elm {l}
input3 : String
input3 =
    "Looking out of the window I could see 2 dogs and 1 cat playing catch in the garden."
```

^^^elm r=(parse catCounter2 input3)^^^

Here we have another problem. Our parser finds the first digit `2`, sees the word following is not `cat` or `cats` so fails. What we would like it to do is not to fail but instead resume parsing from this point looking again for a number followed by `cat` or `cats`. To do this, we need to change our approach slightly and introduce a new parsing concept – the loop.

Firstly, rather than use [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword), let's make a more general parser that can capture any word and return the text of that word:

```elm {l}
word : Parser String
word =
    P.chompWhile Char.isAlpha
        |> P.getChompedString
```

Again, we use [chompWhile](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompWhile) but this time, rather than ignoring the chomped text, we return it with [getChompedString](https://package.elm-lang.org/packages/elm/parser/latest/Parser#getChompedString). This parser will always succeed regardless of input and will accumulate a contiguous sequence of alphabetic characters in a single string that we can process with another parser.

Now let's replace the cat counting parser with a more general one that provides a number and the word following it. We buffer the noun counter with ignorable text both at the start and end to account for the possibility that the counted noun could be the first, intermediate or last in some input text.

```elm {l}
nounCounter : Parser ( Int, String )
nounCounter =
    P.succeed Tuple.pair
        |. ignoredText
        |= P.int
        |. P.spaces
        |= word
        |. ignoredText
```

We don't want our parsing to stop when `nounCounter` succeeds because if we have found a non-cat counted noun we need to continue looking for cats. We can make any parser run repeatedly with [loop](https://package.elm-lang.org/packages/elm/parser/latest/Parser#loop).

A loop parser requires us to define a _state_ which stores the data we wish to extract while parsing. In our case that state is a simple integer (number of cats). The parser applied in the loop must contain at least two parsers, one of which should succeed when we wish to continue looping (`P.Loop`), the other should succeed when we have finished looping (`P.Done`).

In our case we will stop parsing when we've reached the end of the input (looking for a match with the [end](https://package.elm-lang.org/packages/elm/parser/latest/Parser#end) parser), but continue while there is still the possibility of finding a countable noun (which might be a cat).

When we come across a counted noun, we check to see if it is a cat and if so, add the number to the total (`numCats`) stored in the loop.

```elm {l}
allCats1 : Parser Int
allCats1 =
    let
        catCounter total ( n, w ) =
            if w == "cat" || w == "cats" then
                total + n

            else
                total

        allCatsHelp numCats =
            P.oneOf
                [ P.succeed (numCats |> P.Done)
                    |. P.end
                , P.succeed (catCounter numCats >> P.Loop)
                    |= nounCounter
                ]
    in
    P.loop 0 allCatsHelp
```

^^^elm r=(parse allCats1 input3)^^^

One further advantage of this more flexible parser is that we can accumulate the cat counts in longer passages of text where we might have multiple mentions of cats.

```elm {l}
input4 : String
input4 =
    """
On my travels I saw over 300 cats and just 1 dog.
When I returned home I was greeted by my 3 dogs, 2 parrots and ignored by my 14 cats.
They had made a bit of mess so I worked doggedly to create 1 catalogue of all broken furniture.
"""
```

^^^elm r=(parse allCats1 input4 |> Maybe.withDefault 0)^^^

### Handling a wider range of numbers

We have so far assumed any number we are interested in will be an integer, and therefore parsable with [int](https://package.elm-lang.org/packages/elm/parser/latest/Parser#int). To make things more flexible, we can instead use Elm parser's [number](https://package.elm-lang.org/packages/elm/parser/latest/Parser#number). This gives us the flexibility to consider non-decimal numbers (e.g. `0xFF` as the hexadecimal representation of 255), and perhaps more usefully, numbers with decimal points. As we are interested in counting in our example, we will round up any floating point number representation to a whole cat with [ceiling](https://package.elm-lang.org/packages/elm/core/latest/Basics#ceiling).

```elm {l}
naturalNumber : Parser Int
naturalNumber =
    P.number
        { int = Just identity
        , hex = Just identity
        , octal = Just identity
        , binary = Just identity
        , float = Just ceiling
        }
```

This new natural number parser can substitute previous cases where we used `P.int`.

### Handling Negative Numbers

We have one further problem. So far our parser only handles positive numbers because the `-` symbol is not considered a digit and so is part of the ignored text. The following input is incorrectly parsed as 3 cats:

```elm {l}
input5 : String
input5 =
    "The impressions left in the snow were of -3 cats playing."
```

^^^elm r=(parse allCats1 input5)^^^

We start by modifying our `ignoredText` parser so that it does not ignore the `-` symbol:

```elm {l}
ignoredText2 : Parser ()
ignoredText2 =
    P.chompWhile (\c -> not (Char.isDigit c) && c /= '-')
```

We can modify our numeric parsing to handle negative numbers by looking for either a natural (positive) number or a minus sign followed by a natural number. If it is the latter, once we've parsed the positive number we negate it with Elm's [negate](https://package.elm-lang.org/packages/elm/core/latest/Basics#negate) function.

An important, but subtle, point to note when using [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf) is that when trying one of the parsers in a list of alternatives, should it begin to consume input, but then fail, _the other alternatives will not be tried_. In other words, successive alternatives will only be considered if previous parsers in the list cannot even start.

To avoid the possibility of a partially failed parser causing the entire parser to fail (e.g. `-xxxx` succeeds as far as the `-` but then fails on seeing the first `x`), we first consider one of two possibilities: that the parser detects a natural number or it detects a `-` symbol. In the latter case, we have two further possibilities: that it is able to parse the natural number following the `-`, or that it contains some ignorable text. In that final case, we simply return a value of 0 in order to guarantee the parser will always return a countable number.

This approach that effectively provides a 0 where a number cannot be parsed is appropriate for our task where we are ignoring anything but valid cat counts. In other contexts with stricter grammars, we might wish to fail when a non-parsable number is encountered.

```elm {l}
counter : Parser Int
counter =
    P.oneOf
        [ naturalNumber
        , P.succeed negate
            |. P.symbol "-"
            |= P.oneOf
                [ naturalNumber
                , ignoredText |> P.map (always 0)
                ]
        ]
```

We can then insert these modified parsers back into our noun counter:

```elm {l}
nounCounter2 : Parser ( Int, String )
nounCounter2 =
    P.succeed Tuple.pair
        |. ignoredText2
        |= counter
        |. P.spaces
        |= word
        |. ignoredText2
```

And our new noun counter into the cat counter:

```elm {l}
allCats2 : Parser Int
allCats2 =
    let
        catCounter total ( n, w ) =
            if w == "cat" || w == "cats" then
                total + n

            else
                total

        allCatsHelp numCats =
            P.oneOf
                [ P.succeed (numCats |> P.Done)
                    |. P.end
                , P.succeed (catCounter numCats >> P.Loop)
                    |= nounCounter2
                ]
    in
    P.loop 0 allCatsHelp
```

^^^elm r=(parse allCats2 input5)^^^

## Parsing into a Record

It is a common task when parsing, to extract a variety of data placing different components into different parts of some data structure. To illustrate, let's set ourselves a new goal of counting both the number of cats and number of dogs in some unstructured input text.

We can make space to store those counts in a simple [Elm record](https://elm-lang.org/docs/records):

```elm {l}
type alias CatsAndDogs =
    { cats : Int, dogs : Int }
```

The only other changes required are to replace our previous instances of a cat counting parser with one that handles the `CatsAndDogs` record, differentiating between numbers followed by cat(s) and numbers followed by dog(s).

```elm {l}
allCatsAndDogs : Parser CatsAndDogs
allCatsAndDogs =
    let
        animalCounter total animal ( n, w ) =
            if w == animal || w == (animal ++ "s") then
                total + n

            else
                total

        allCatsAndDogsHelp numCatsAndDogs =
            P.oneOf
                [ P.succeed (numCatsAndDogs |> P.Done)
                    |. P.end
                , P.succeed
                    (\animals ->
                        { numCatsAndDogs
                            | cats = animalCounter numCatsAndDogs.cats "cat" animals
                            , dogs = animalCounter numCatsAndDogs.dogs "dog" animals
                        }
                            |> P.Loop
                    )
                    |= nounCounter2
                ]
    in
    P.loop { cats = 0, dogs = 0 } allCatsAndDogsHelp
```

^^^elm r=(P.run allCatsAndDogs input4)^^^

---

### Tests

How robust is our parser?

```elm {l}
test : Parser CatsAndDogs -> String -> ( Int, Int ) -> String
test parser input ( expCats, expDogs ) =
    case P.run parser input of
        Ok { cats, dogs } ->
            if cats == expCats && dogs == expDogs then
                String.fromInt expCats ++ "," ++ String.fromInt expDogs

            else
                "Failed: '" ++ input ++ "' expecting " ++ String.fromInt expCats ++ "," ++ String.fromInt expDogs ++ " but produced " ++ String.fromInt cats ++ "," ++ String.fromInt dogs

        Err msg ->
            "Failed to parse '" ++ input ++ "'"
```

^^^elm r=(test allCatsAndDogs "" (0,0))^^^
^^^elm r=(test allCatsAndDogs "-" (0,0))^^^
^^^elm r=(test allCatsAndDogs "cats and 10 dogs" (0,10))^^^
^^^elm r=(test allCatsAndDogs "0 cats" (0,0))^^^
^^^elm r=(test allCatsAndDogs "1 cat and 1 cat and 1 dog and 1 dog and 1 dogs" (2,3))^^^
^^^elm r=(test allCatsAndDogs "-1 cat and 1 dog and -3 dogs" (-1,-2))^^^
^^^elm r=(test allCatsAndDogs "-1 dog" (0,-1))^^^
^^^elm r=(test allCatsAndDogs "-1 cat and -1 cat" (-2,0))^^^
^^^elm r=(test allCatsAndDogs "-1 dog and -1 dog" (0,-2))^^^
^^^elm r=(test allCatsAndDogs "- 1 cat" (1,0))^^^
^^^elm r=(test allCatsAndDogs "9 cats" (9,0))^^^
^^^elm r=(test allCatsAndDogs "-0xff cats" (-255,0))^^^
^^^elm r=(test allCatsAndDogs "0o77 cats" (63,0))^^^
^^^elm r=(test allCatsAndDogs "0b101 cats" (5,0))^^^
^^^elm r=(test allCatsAndDogs "9" (0,0))^^^
^^^elm r=(test allCatsAndDogs "9 5 cats" (5,0))^^^
^^^elm r=(test allCatsAndDogs "0.4 cats" (1,0))^^^
^^^elm r=(test allCatsAndDogs "-0.4 cats" (-1,0))^^^
^^^elm r=(test allCatsAndDogs "9 0.5 cats" (1,0))^^^
