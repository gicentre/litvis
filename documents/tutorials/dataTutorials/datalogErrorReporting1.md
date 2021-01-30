---
id: litvis

follows: datalogParsing
---

@import "../css/tutorial.less"

_This is one of a series of 'data' tutorials for use with litvis._

1.  [Parsing structured text](assemblyParsing.md)
1.  [Parsing unstructured text](unstructuredText.md)
1.  [Parsing CSV](csvParsing.md)
1.  [Parsing datalog](datalogParsing.md)
1.  **Reporting helpful parsing errors, part 1**
1.  [Reporting helpful parsing errors, part 2](datalogErrorReporting2.md)

---

# Reporting helpful parsing errors, part 1

{(infobox|}

New Elm parser functions and types introduced:

- [DeadEnd](https://package.elm-lang.org/packages/elm/parser/latest/Parser#DeadEnd) for holding information about a failed parse.
- [Problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Problem) for describing the nature of a failed parse.

{|infobox)}

In the [previous chapter](datalogParsing.md) we introduced _datalog_ as a concise language for specifying deductive database facts and rules. We developed a parser for reading datalog programs and representing them with collections of Elm types.

In this chapter we will explore how the Elm parser can be used to generate helpful error messages when input data isn't in the expected format. It demonstrates one of the significant benefits of using Elm parser to provide a fine level of control over what and how we report parsing errors. It supports one of the philosophies of the Elm language design, to guide users with [helpful error messages](https://elm-lang.org/news/the-syntax-cliff).

## Identifying Syntax Errors

When a top-level parser is [run](https://package.elm-lang.org/packages/elm/parser/latest/Parser#run), it generates a [Result](https://package.elm-lang.org/packages/elm/core/latest/Result), which so far we have simply converted into a [Maybe](https://package.elm-lang.org/packages/elm/core/latest/Maybe), ignoring the details of any failed parsing. Let's instead show that result directly:

```elm {l}
parseResult : Parser a -> String -> Result (List P.DeadEnd) a
parseResult parser =
    P.run parser
```

The first thing to notice is that the error branch of `Result` is Elm parser's [DeadEnd](https://package.elm-lang.org/packages/elm/parser/latest/Parser#DeadEnd). This type provides us with some useful basic information about the nature of any errors that prevented successful parsing including a (row,column) position where the parsing fails in relation to the input text and a [Problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Problem) type that says something about the nature of the problem. We can see it in action with a simple invalid input:

```elm {l}
errorInput1 : String
errorInput1 =
    """
bird("parrot").
legs("cat,4).
move("bat","fly").
move("parrot","fly").

flyingBird(X) :- bird(X), move(X,"fly").
"""
```

^^^elm r=(parseResult program errorInput1)^^^

The output `[{ col = 7, problem = Expecting ",", row = 4 },{ col = 7, problem = Expecting ")", row = 4 }]` already tells us some useful information – that the parser failed in row 4, column 7 where it was expecting either a `,` or `)`. Two errors are reported because our [sequence](https://package.elm-lang.org/packages/elm/parser/latest/Parser#sequence) parser was looking either for a comma separator or an end-of-list closing parenthesis, but found neither.

The actual error was caused by lack of terminating quotation mark after `"cat` in the preceding line in the input, but our parser carried on reading until it found the next quotation mark, which it expected to be followed by a divider or closing parenthesis.

One immediate improvement we can make is to display the error in the context of the original input text rather than relying on the our ability to count row and column numbers to locate the position of the reported error (was that first blank line included? does the number count from 0 or 1? what if the error was 3000 characters into the input?). To allow us to do this, we will modify our parser-running function to provide a textual summary of its input, as either the contents of a successful parse, or some error message text:

```elm {l}
parseReport : String -> String
parseReport input =
    case P.run program input of
        Ok prog ->
            let
                isFact stmt =
                    case stmt of
                        Fact _ ->
                            True

                        _ ->
                            False

                ( facts, rules ) =
                    List.partition isFact prog
            in
            "Successfully parsed datalog program."
                ++ ("\nFacts: " ++ (facts |> List.length |> String.fromInt))
                ++ ("\nRules: " ++ (rules |> List.length |> String.fromInt))

        Err deadEnds ->
            let
                probs =
                    problemByLocation deadEnds
            in
            List.map (errLines 2 input probs) (Dict.keys probs)
                |> String.concat
```

To provide that context, we can extract the input line where the error was detected and a few more before it. To do this we will reshape the list of dead ends so they are addressable via the location in which they ocurred. That way, we can combine multiple errors that refer to the same point in the input.

```elm {l}
problemByLocation : List P.DeadEnd -> Dict ( Int, Int ) (List P.Problem)
problemByLocation =
    let
        addProblem de dict =
            let
                probs =
                    Dict.get ( de.row, de.col ) dict |> Maybe.withDefault []
            in
            Dict.insert ( de.row, de.col ) (de.problem :: probs) dict
    in
    List.foldl addProblem Dict.empty
```

We can then generate some text containing the error line and some lines before it (determined by parameter `n`) along with a more graphical symbolisation of the column in the error line where it was detected:

```elm {l}
errLines : Int -> String -> Dict ( Int, Int ) (List P.Problem) -> ( Int, Int ) -> String
errLines n input dict ( row, col ) =
    let
        contextLines =
            input
                |> String.lines
                |> List.take row
                |> List.drop (row - n)
                |> List.map (\s -> s ++ "\n")
                |> String.concat

        highlightLine =
            List.repeat (col - 1) "-" ++ [ "^" ] |> String.concat

        probText =
            Dict.get ( row, col ) dict
                |> Maybe.withDefault []
                |> problemText
    in
    contextLines ++ highlightLine ++ "\n" ++ probText
```

We also need to convert the [Problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Problem) type into some text to report. We can take the opportunity to provide some friendly wording, for example by combining any of the 'expected' type problems into a single grammatical sentence.

```elm {l}
problemText : List P.Problem -> String
problemText probs =
    let
        isExpectedProblem prob =
            case prob of
                P.UnexpectedChar ->
                    False

                P.Problem _ ->
                    False

                P.BadRepeat ->
                    False

                _ ->
                    True

        ( exp, other ) =
            List.partition isExpectedProblem probs

        eText expProb =
            case expProb of
                P.Expecting s ->
                    case s of
                        "," ->
                            "a comma separator"

                        "(" ->
                            "an opening parenthesis"

                        ")" ->
                            "a closing parenthesis"

                        _ ->
                            "a '" ++ s ++ "'"

                P.ExpectingInt ->
                    "an integer"

                P.ExpectingHex ->
                    "a hex number"

                P.ExpectingOctal ->
                    "an octal number"

                P.ExpectingBinary ->
                    "a binary number"

                P.ExpectingFloat ->
                    "a floating point number"

                P.ExpectingNumber ->
                    "a number"

                P.ExpectingVariable ->
                    "a variable name"

                P.ExpectingSymbol s ->
                    case s of
                        "." ->
                            "a terminating '.'"

                        _ ->
                            "the symbol '" ++ s ++ "'"

                P.ExpectingKeyword s ->
                    "the word '" ++ s ++ "'"

                P.ExpectingEnd ->
                    "the end of the input"

                _ ->
                    "something"

        oText prob =
            case prob of
                P.UnexpectedChar ->
                    "I saw an unexpected character here,\n"

                P.Problem s ->
                    "I saw a problem: " ++ s ++ ".\n"

                P.BadRepeat ->
                    "I saw a bad repeating pattern.\n"

                _ ->
                    "I saw a problem.\n"

        expectedText =
            if exp == [] then
                ""

            else
                "I was expecting to see "
                    ++ (List.map eText exp
                            |> Set.fromList
                            |> Set.toList
                            |> List.intersperse " or "
                            |> String.concat
                       )
                    ++ " here.\n"
    in
    expectedText
        ++ (List.map oText other
                |> Set.fromList
                |> Set.toList
                |> String.concat
           )
```

This generates a nice friendly error message with context:

{(fixed|}^^^elm m=(parseReport errorInput1)^^^{|fixed)}

Let's test our new friendly error reporting on a few more incorrectly specified inputs:

{(fixed|}

```elm {m}
errorTests : String
errorTests =
    [ """"bird("parrot")."""
    , """bird parrot."""
    , """bird(parrot)"""
    , """bird(Parrot)."""
    , """bird(X) : move(X,"fly")."""
    , """bird(X) ":-" move(X,"fly")."""
    , """bird(X) if move(X,"fly")."""
    , """bird(X) :- not(X,"fly")."""
    , """bird(X)"""
    ]
        |> List.map parseReport
        |> List.intersperse "\n---\n"
        |> String.concat
```

{|fixed)}

This is pretty good for some errors, for example:

```txt
bird parrot.
-----^
I was expecting to see an opening parenthesis here.

bird(parrot)
------------^
I was expecting to see a ':-' or a terminating '.' here.
```

are pretty much spot on, immediately pointing to both the location and nature of the problem.

But others are less so, for example:

```txt
"bird("parrot").
^
I was expecting to see a variable name or the end of the input here.
```

Here, the location of the problem is correctly identified and it provides some indirect evidence of the cause of the problem (an extra quotation mark where we shouldn't have one). However, it's not a _variable_ that should be expected, but a datalog _relation_. The reason we are getting this error description is because we have used Elm parser's [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable) parser to identify relations and when this fails it generates a `ExpectingVariable` [problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Problem).

What would be more helpful is for our error reporting to reflect the semantics of the input we are attempting to parse. For this we need to use Elm's advanced parser, which we will consider in the [next chapter](datalogErrorReporting2.md)

## Conclusions

This chapter has considered how we report parsing errors by displaying the contents of [DeadEnds](https://package.elm-lang.org/packages/elm/parser/latest/Parser#DeadEnd) that are returned by any parser that fails. The dead end includes location information about the point of failure and something about the nature of the problem. We can make error messages more friendly by intercepting these dead ends and translating them into more friendly text. This is useful for syntax type errors but does not always capture the semantics of the error.
