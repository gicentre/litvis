---
id: litvis

elm:
  dependencies:
    elm/parser: latest
---

@import "../css/tutorial.less"

```elm {l=hidden}
import Parser as P exposing ((|.), (|=), Parser)
import Set exposing (Set)
```

# Using Elm Parser to Process Unstructured Text

## Why use a parser?

We often need to import data from some external source that may not be quite in the format we need work with. Parsers allow us to work through some input extracting the content we need and discarding the rest.

For very simple input, such as a list of numbers, we can use Elm's simple conversion functions such as [String.toInt](https://package.elm-lang.org/packages/elm/core/latest/String#toInt) or [String.split](https://package.elm-lang.org/packages/elm/core/latest/String#split). But for more complex input, parsers allow us to account for variations that would be cumbersome and error prone to process 'by hand'.

To illustrate how [Elm parsers](https://package.elm-lang.org/packages/elm/parser/latest) work, let's start up with a simple example and slowly build it up to provide more comprehensive unstructured input parsing. Suppose we wished to count the number of cats in the following sentence:

```elm {l}
input1 : String
input1 =
    "Looking out of the window I could see 3 cats and 2 dogs playing catch in the garden."
```

## Setting up the parser infrastructure

Elm's parser library contains a set of functions that may be similarly named to other functions (e.g. [map](https://package.elm-lang.org/packages/elm/parser/latest/Parser#map), [andThen](https://package.elm-lang.org/packages/elm/parser/latest/Parser#andThen)), so we specify in the `import` line at the top of the litvis document a `P` prefix to preserve the namespace while keeping code short.

In common with other packages we expose the core [Parser](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Parser) type directly so we can name it directly in type signatures. The package also includes two unique pipe symbols which shouldn't clash with anything else so we can also import those without a namespace prefix.

```elm
import Parser as P exposing ((|.), (|=), Parser)
```

When we run our parser against the input text it will generate a [Result](https://package.elm-lang.org/packages/elm/core/latest/Result). A successful parse will store the results wrapped in [Ok](https://package.elm-lang.org/packages/elm/core/latest/Result#Result) or if there has been a problem parsing, in [Err](https://package.elm-lang.org/packages/elm/core/latest/Result#Result). Acknowledging that error handling is one of the strengths of the Elm parser, for now we will largely ignore any errors and just extract the cat count (hopefully) identified by the parser:

Let's put the top-level function in place so we can see what we're aiming for before we get into the details of the parsing. The function runs the provided parser (first parameter) on some input text and if successful, should report the number of cats found.

```elm {l}
parse : Parser Int -> String -> List String
parse parser txt =
    case P.run parser txt of
        Ok cats ->
            if cats == 1 then
                [ ">" ++ txt, "\n", String.fromInt cats ++ " cat found." ]

            else
                [ ">" ++ txt, "\n", String.fromInt cats ++ " cats found." ]

        Err msg ->
            msg
                |> always [ ">" ++ txt, "\n", "No cats found." ]
```

## A simple parser

We will construct our cat counting parser by assembling a sequence of simpler parsers to do specific jobs. This is the basis of the [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator) approach used by Elm parser.

We know we are looking for numbers in our text, and until we find a number we can ignore the preceding text. [chompWhile](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompWhile) will proceed through the input text, character at a time, while a condition is met. In our case, that each character is not a digit and it is not a minus sign. At the point this parser succeeds, the next character to parse should be a minus sign or digit or we've reached the end of the input text.

```elm {l}
ignoredText : Parser ()
ignoredText =
    P.chompWhile (\c -> not <| (Char.isDigit c && c /= '-'))
```

The example above creates a parser that does not return a value (indicated by the `()` for the parser's type). To extract a number we can use one of the built-in parsers [int](https://package.elm-lang.org/packages/elm/parser/latest/Parser#int) which will return an integer when parsing succeeds. But we only wish to extract a number if the text following it refers to a cat. Elm parser uses two special _pipe operators_ that allow us to specify a sequence of parsers either choosing to extract what is parsed [(|=)](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed) or choosing to ignore it [(|.)](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed).

We can use another built-in parser [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword) to look for specific words. These include a _lookahead_ after the keyword to ensure we have reached the end of the word, thus distinguishing `cat` from `catch` etc.

Putting these together with our `ignoredText` parser, we can create our cat parser to extract the value of some numeric text only if it is immediately followed by the word `cat`:

```elm  {l}
catCounter1 : Parser Int
catCounter1 =
    P.succeed identity
        |. ignoredText
        |= P.int
        |. P.spaces
        |. P.keyword "cats"
        |. ignoredText
```

^^^elm m=(parse catCounter1 input1)^^^

The example above creates a parser of type `int` so when the parser succeeds, we need to provide an integer value. This is the one captured by the line `|= P.int`. The general rule here when using parser pipes is that the parameters expected by the parser should match the sequence of `|=` pipe operators. In this case, `P.int` returns an integer directly, so we can use `P.succeed identity` to provide the value (remembering it is the equivalent to the function `\n -> n`).

## Making the parser more flexible

Our parser works for the simple example, but what would happen if it were to parse the following sentence?

```elm {l}
input2 : String
input2 =
    "Looking out of the window I could see 1 cat and 2 dogs playing catch in the garden."
```

^^^elm m=(parse catCounter1 input2)^^^

The problem is that we are looking for numbers followed by the word `cats`, but we could also legitimately have the word `cat`. This is easily solved with the option [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf) that allows us to consider alternatives in our parsing sequence:

```elm  {l}
catCounter2 : Parser Int
catCounter2 =
    P.succeed identity
        |. ignoredText
        |= P.int
        |. P.spaces
        |. P.oneOf [ P.keyword "cats", P.keyword "cat" ]
```

^^^elm m=(parse catCounter2 input2)^^^

Let's try it with another sentence:

```elm {l}
input3 : String
input3 =
    "Looking out of the window I could see 2 dogs and 1 cat playing catch in the garden."
```

^^^elm m=(parse catCounter2 input3)^^^

Here we have another problem. Our parser finds the first digit `2`, sees the word following is not `cat` or `cats` so fails. What we would like it to do is to resume parsing from this point looking again for a number followed by `cat` or `cats`. To do this, we can change our approach slightly and introduce a new parsing concept – the loop.

Firstly, rather than use [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword), let's make a more general parser that can capture any word and return the text of that word:

```elm  {l}
word : Parser String
word =
    P.getChompedString <|
        P.succeed ()
            |. P.chompWhile Char.isAlpha
```

Again, we use [chompWhile](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompWhile), but this time rather than ignoring the chomped text, we return it with [getChompedString](https://package.elm-lang.org/packages/elm/parser/latest/Parser#getChompedString). This allows us to accumulate all the chomped characters in a single string that we can process with another parser.

We can modify our cat counter so that it looks for a number and then any word following it. Rather than assume the number will be an integer, we can use Elm parser's [number](https://package.elm-lang.org/packages/elm/parser/latest/Parser#number) parser that will handle a wider range of numeric representations. When that number is a decimal, we will round up to the nearest whole cat. We can also account for negative numbers by considering the possibility of a `-` preceding the number, in which case we negate the parsed number.

The modified cat counting parser returns a tuple comprising the number and associated word before we then [map](https://package.elm-lang.org/packages/elm/parser/latest/Parser#map) it into a number that will be the one we have just parsed if the word is `cat` or `cats`, but 0 if not.

```elm {l}
number : Parser Int
number =
    P.number
        { int = Just identity
        , hex = Just identity
        , octal = Just identity
        , binary = Just identity
        , float = Just ceiling
        }


catCounter3 : Parser Int
catCounter3 =
    P.succeed Tuple.pair
        |= P.oneOf
            [ P.succeed negate
                |. P.symbol "-"
                |= number
            , number
            ]
        |. P.spaces
        |= word
        |. ignoredText
        |> P.map
            (\( n, token ) ->
                if token == "cat" || token == "cats" then
                    n

                else
                    0
            )
```

We now don't want our parsing to stop when `catCounter` succeeds because if we have found a non-cat word following a number we need to continue parsing looking for cats. We can make any parser run repeatedly with [loop](https://package.elm-lang.org/packages/elm/parser/latest/Parser#loop).

A loop parser requires us to define a _state_ which keeps, and possibly modifies, the data we wish to extract while parsing. In our case that state is a simple integer (number of cats). The parser applied in the loop must contain at least two parsers, one of which should succeed when we wish to continue looping, the other should succeed when we have finished looping.

In our case we will stop parsing when we've reached the end of the input (looking for a match with the [end](https://package.elm-lang.org/packages/elm/parser/latest/Parser#end) parser), but continue if we find a number-word (which might be a cat) or some ignorable text.

```elm {l}
allCats : Parser Int
allCats =
    P.loop 0 allCatsHelp


allCatsHelp : Int -> Parser (P.Step Int Int)
allCatsHelp numCats =
    P.oneOf
        [ P.succeed (numCats |> P.Done)
            |. P.end
        , P.succeed ((+) numCats >> P.Loop)
            |= catCounter3
        , P.succeed (numCats |> P.Loop)
            |. ignoredText
        ]
```

^^^elm m=(parse allCats input3)^^^

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

^^^elm m=(parse allCats input4)^^^

## Parsing into a Record

It is a common task when parsing to extract a variety of data placing different components into different parts of some data structure. To illustrate, let's suppose we wish to count both the number of cats and number of dogs in some unstructured input text.

Let's make space to store those counts in a simple [Elm record](https://elm-lang.org/docs/records):

```elm {l}
type alias CatsAndDogs =
    { cats : Int, dogs : Int }
```

The only other changes required are to replace our previous instances of integer parsers with ones that handle the `CatsAndDogs` record, differentiating between numbers followed by cat(s) and numbers followed by dog(s).

```elm {l}
allAnimals : Parser CatsAndDogs
allAnimals =
    P.loop { cats = 0, dogs = 0 } allAnimalsHelp


allAnimalsHelp : CatsAndDogs -> Parser (P.Step CatsAndDogs CatsAndDogs)
allAnimalsHelp catsAndDogs =
    P.oneOf
        [ P.succeed (catsAndDogs |> P.Done)
            |. P.end
        , P.succeed
            (\animals ->
                { catsAndDogs
                    | cats = catsAndDogs.cats + animals.cats
                    , dogs = catsAndDogs.dogs + animals.dogs
                }
                    |> P.Loop
            )
            |= animalCounter
        , P.succeed (catsAndDogs |> P.Loop)
            |. ignoredText
        ]


animalCounter : Parser CatsAndDogs
animalCounter =
    P.succeed Tuple.pair
        |= P.int
        |. P.spaces
        |= word
        |. ignoredText
        |> P.map
            (\( n, token ) ->
                if token == "cat" || token == "cats" then
                    { cats = n, dogs = 0 }

                else if token == "dog" || token == "dogs" then
                    { dogs = n, cats = 0 }

                else
                    { dogs = 0, cats = 0 }
            )
```

^^^elm r=(P.run allAnimals input4)^^^

---

### Tests

How robust is our parser?

```elm {l}
test : Parser Int -> String -> Int -> String
test parser input expected =
    case P.run parser input of
        Ok val ->
            if val == expected then
                String.fromInt expected

            else
                "Failed: '" ++ input ++ "' expecting " ++ String.fromInt expected ++ " but produced " ++ String.fromInt val

        Err msg ->
            "Failed to parse " ++ input
```

^^^elm r=(test allCats "" 0)^^^
^^^elm r=(test allCats "cats" 0)^^^
^^^elm r=(test allCats "0 cats" 0)^^^
^^^elm r=(test allCats "1 cat" 1)^^^
^^^elm r=(test allCats "-1 cat" -1)^^^
^^^elm r=(test allCats "- 1 cat" 1)^^^
^^^elm r=(test allCats "9 cats" 9)^^^
^^^elm r=(test allCats "0xff cats" 255)^^^
^^^elm r=(test allCats "0o77 cats" 63)^^^
^^^elm r=(test allCats "0b101 cats" 5)^^^
^^^elm r=(test allCats "9" 0)^^^
^^^elm r=(test allCats "9 5 cats" 5)^^^
^^^elm r=(test allCats "0.4 cats" 1)^^^
^^^elm r=(test allCats "-0.4 cats" -1)^^^
^^^elm r=(test allCats "9 0.5 cats" 1)^^^
