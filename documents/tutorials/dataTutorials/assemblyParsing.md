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
import Dict exposing (Dict)
import Parser as P exposing ((|.), (|=), Parser)
```

_This is one of a series of 'data' tutorials for use with litvis._

1.  **Parsing structured text**
1.  [Parsing unstructured text](unstructuredText.md)
1.  [Parsing CSV](csvParsing.md)
1.  [Parsing datalog](datalogParsing.md)
1.  [Reporting helpful parsing errors, part 1](datalogErrorReporting1.md)
1.  [Reporting helpful parsing errors, part 2](datalogErrorReporting2.md)

---

# Using Elm Parser to Process Structured Text

{(infobox|}

New Elm parser functions introduced:

- combining and [running](https://package.elm-lang.org/packages/elm/parser/latest/Parser#run) parsers
- sequential parser pipelines with [succeed](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed), [|.](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed) and [|=](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed)
- chomping characters with [chompIf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompIf) and [getChompedString](https://package.elm-lang.org/packages/elm/parser/latest/Parser#getChompedString)
- built-in parsers [int](https://package.elm-lang.org/packages/elm/parser/latest/Parser#int), [symbol](https://package.elm-lang.org/packages/elm/parser/latest/Parser#symbol), [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword) and [spaces](https://package.elm-lang.org/packages/elm/parser/latest/Parser#spaces)
- parsing alternatives with [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf)
- converting parsers with [map](https://package.elm-lang.org/packages/elm/parser/latest/Parser#map)

{|infobox)}

## Why use a parser?

We often need to import data from some external source from which we identify individual elements and perform some action in response to each. Parsers allow us to work through some input extracting the content we need and discarding the rest.

For very simple input, such as a list of numbers, we can use Elm's simple conversion functions such as [String.toInt](https://package.elm-lang.org/packages/elm/core/latest/String#toInt) or [String.split](https://package.elm-lang.org/packages/elm/core/latest/String#split). But for more complex input, parsers allow us to account for more sophisticated _grammars_ that could be cumbersome and error prone to process with simple splitting and conversion.

The Elm language, which is used by Litvis, comes with a useful [parser package](https://package.elm-lang.org/packages/elm/parser/latest) that provides a robust means to parse input text with good error reporting when things don't quite go as expected. It is an example of a [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator), which although flexible and modular, can appear a little intimidating at first, so this and subsequent tutorials will build examples slowly so you can see how the combinator approach works.

## A Simple Assembly Language

Imagine we have some text representing commands in a [simple assembly language](https://adventofcode.com/2016/day/12). Suppose this assembly language instruction set comprises four commands:

| Instruction       | Description                                                                   |
| :---------------- | :---------------------------------------------------------------------------- |
| `cpy` _val_ _reg_ | Copy the given value to the given register                                    |
| `inc` _reg_       | Increment the given register by 1                                             |
| `dec` _reg_       | Decrement the given register by 1                                             |
| `jnz` _val_ _n_   | Jump to the instruction address _n_ places from this one if _val_ is not zero |

_reg_ can be one of four registers `a`, `b`, `c` or `d`.
_val_ can be either an integer or a register holding a val.

For example, the following assembly language program adds 5 and 6, storing the result in register `c`:

```txt
cpy 5 a
cpy 6 b
cpy a c
cpy b d
inc c
dec d
jnz d -2
```

Our task is to parse the text of such a program and represent the commands, registers and values in such a way that we would be able to run any valid assembly language program. This is a task well suited to using a parser because the [grammar](https://en.wikipedia.org/wiki/Chomsky_hierarchy) is well defined making it easy to specify the parsing rules.

Before we consider the parsing itself, let's choose how to represent the language in Elm.

Each register label (`a`,`b`,`c` and `d`) can be represented as a string:

```elm {l}
type alias Reg =
    String
```

A value can be either a register label or a numeric constant:

```elm {l}
type Value
    = Register Reg
    | Constant Int
```

We can then create a type representing the four instructions:

```elm {l}
type Instruction
    = Copy Value Reg
    | Increment Reg
    | Decrement Reg
    | JumpIfNotZero Value Int
```

## Setting up the parser infrastructure

As with other packages, we need to import the Parser package into our litvis document with an `import` statement. To avoid name clashes with existing functions we can add a `P` prefix to the import and we expose the core [Parser](https://package.elm-lang.org/packages/elm/parser/latest/Parser#Parser) type so we can name it directly in type signatures. The package also includes two unique pipe symbols which shouldn't clash with anything else so we can also import those without a namespace prefix. This leads to the following import line which is likely to be common to any litvis document that uses Elm's parser.

```elm
import Parser as P exposing ((|.), (|=), Parser)
```

When we run a parser against some input text it will generate a [Result](https://package.elm-lang.org/packages/elm/core/latest/Result). A successful parse will store the results wrapped in [Ok](https://package.elm-lang.org/packages/elm/core/latest/Result#Result) or if there has been a problem parsing, in [Err](https://package.elm-lang.org/packages/elm/core/latest/Result#Result). Acknowledging that error handling is one of the strengths of the Elm parser, for now we will largely ignore any errors and just extract assembly instructions (hopefully) identified by the parser.

Let's put the top-level function in place so we can see what we're aiming for before we get into the details of the parsing. The function [runs](https://package.elm-lang.org/packages/elm/parser/latest/Parser#run) the provided parser (first parameter) on a line of input text (second parameter) and if successful, should report the value it represents. We can keep this function generic by using a type variable (`a`) so it works with any parser. If we were interested in providing explanatory error messages we could add code to respond to a possible error result instead of [converting the result to a Maybe](https://package.elm-lang.org/packages/elm/core/latest/Result#toMaybe).

```elm {l}
parse : Parser a -> String -> Maybe a
parse parser =
    P.run parser >> Result.toMaybe
```

## Combining Parsers

Now to the actual parsing of input. With parser combinators the idea is to create a collection of simple parsers that we combine to form higher order parsing functions. So we might start with a parser for identifying any of the four registers.

A _chomper_ will proceed consuming input from left to right, character by character according to the rules we specify. [chompIf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#chompIf) will consume the next character in the input if the function we provide evaluates to true. In this case it will consume some input if and only if the character to chomp is one of `a`, `b`, `c` or `d`, otherwise nothing is consumed from the input pipeline. [getChompedString](https://package.elm-lang.org/packages/elm/parser/latest/Parser#getChompedString) then returns whatever was consumed (i.e. the one-letter name of the register we have just parsed or an empty string if not one of the four registers).

```elm {l}
reg : Parser Reg
reg =
    P.chompIf (\chr -> chr == 'a' || chr == 'b' || chr == 'c' || chr == 'd')
        |> P.getChompedString
```

We can create another parser for constants (numeric values).

```elm {l}
constant : Parser Value
constant =
    P.succeed Constant
        |= num
```

The function `num` is itself another parser which we can define for extracting any integer from some input text. Here we are doing something a little more sophisticated so that if a number is preceded by a minus sign, it is still interpreted correctly. [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf) allows us to provide alternative parsers, any one of which can succeed for the parser as a whole to succeed. [int](https://package.elm-lang.org/packages/elm/parser/latest/Parser#int) can handle positive numeric values converting them into integers and [symbol](https://package.elm-lang.org/packages/elm/parser/latest/Parser#symbol) will only succeed if a given symbol is found. If a `-` is found, we then expect it to be followed by an integer, which we negate before returning it.

```elm {l}
num : Parser Int
num =
    P.oneOf
        [ P.int
        , P.succeed negate
            |. P.symbol "-"
            |= P.int
        ]
```

Notice the use of the pipe symbols `|=` and `|.` that allow us to specify parsing operation in sequence. `|.` means parse something but don't store the result whereas `|=` mean parse something and provide the result to the [succeed](https://package.elm-lang.org/packages/elm/parser/latest/Parser#succeed) function. Here it takes the value provided to it and provides it as a parameter to Elms [negate](https://package.elm-lang.org/packages/elm/core/latest/Basics#negate) function to swap its sign from positive to negative.

We can assemble the register and constant parsers into a higher order `value` parser that can handle both. Again we use [oneOf](https://package.elm-lang.org/packages/elm/parser/latest/Parser#oneOf) as value may be either a constant or a register. Our `reg` parser generates a string on succeeding, so we additionally [map](https://package.elm-lang.org/packages/elm/parser/latest/Parser#map) it to a `Register` value.

```elm {l}
value : Parser Value
value =
    P.oneOf
        [ constant
        , P.map Register reg
        ]
```

Now that we have the ability to parse any value, we can write four parsers for the four instruction types that simply implement the grammar defined in the instruction set. These use two additional parsers from the Elm package – [spaces](https://package.elm-lang.org/packages/elm/parser/latest/Parser#spaces) for handling zero or more spaces between parsed items and [keyword](https://package.elm-lang.org/packages/elm/parser/latest/Parser#keyword) for identifying given words. As a result we are more accommodating in the spacing used in our input (any amount of whitespace could be used to separate an instruction from its parameters). Note the use of the two pipes `|.` and `|=` to determine whether or not a parser's results should be passed as a parameter to the `succeed` function.

At this higher level we have a compact and explanatory description of our assembly language grammar.

```elm {l}
copy : Parser Instruction
copy =
    P.succeed Copy
        |. P.keyword "cpy"
        |. P.spaces
        |= value
        |. P.spaces
        |= reg


incr : Parser Instruction
incr =
    P.succeed Increment
        |. P.keyword "inc"
        |. P.spaces
        |= reg


decr : Parser Instruction
decr =
    P.succeed Decrement
        |. P.keyword "dec"
        |. P.spaces
        |= reg


jnz : Parser Instruction
jnz =
    P.succeed JumpIfNotZero
        |. P.keyword "jnz"
        |. P.spaces
        |= value
        |. P.spaces
        |= num
```

The final step is to create a top-level parser that can apply one of these parsers to each line of input text:

```elm {l}
instruction : Parser Instruction
instruction =
    P.oneOf [ copy, incr, decr, jnz ]
```

## Testing the parser

To run the assembly language parser on an entire program we can split an input string into lines and pass each one to our top-level parser. Successfully parsed instructions are stored in the output list of instructions.

```elm {l}
input : String
input =
    """
cpy 5 a
cpy 6 b
cpy a c
cpy b d
inc c
dec d
jnz d -2
"""
```

```elm {l r}
testParser : List Instruction
testParser =
    input
        |> String.lines
        |> List.filterMap (parse instruction)
```

## Conclusions

While Elm provides a number of useful functions for processing strings (e.g. [String.split](https://package.elm-lang.org/packages/elm/core/latest/String#split), [String.words](https://package.elm-lang.org/packages/elm/core/latest/String#words), [String.lines](https://package.elm-lang.org/packages/elm/core/latest/String#lines) and [String.toInt](https://package.elm-lang.org/packages/elm/core/latest/String#toInt)), the Elm parser provides us with a more flexible and robust approach. It is especially suited to cases where we have a well-defined _grammar_ that describes the form of the input text we are expecting.

The combinator approach of building parsers by assembling simpler ones allows incremental development and reuse by allowing us to build a parser 'bottom-up'.

---

## Appendix: An assembly language interpreter

Parsing is typically just the first stage in a pipeline of operations we perform on input data. So for completeness, now that we have a parser that should be able to handle any input that conforms to our assembly language, let's create the ability to run assembly language programs.

To run a program we need to be able to store the program itself, the values stored in the four registers and the current line in the program we are executing. We can keep these all together in an [elm record](https://elm-lang.org/docs/records):

```elm {l}
type alias Computer =
    { line : Int, prog : Dict Int Instruction, registers : Dict String Int }
```

Running the program involves extracting the assembly instruction at the current line and, depending on the instruction, changing the value of a stored register and jumping to a new line in the program. Execution continues until we jump to a line outside of the stored program.

```elm {l}
run : Computer -> Computer
run comp =
    let
        regVal r =
            Dict.get r comp.registers |> Maybe.withDefault 0

        eval v =
            case v of
                Constant n ->
                    n

                Register r ->
                    regVal r
    in
    case Dict.get comp.line comp.prog of
        Just (Copy v r) ->
            run
                { comp
                    | registers = Dict.insert r (eval v) comp.registers
                    , line = comp.line + 1
                }

        Just (Increment r) ->
            run
                { comp
                    | registers = Dict.insert r (regVal r + 1) comp.registers
                    , line = comp.line + 1
                }

        Just (Decrement r) ->
            run
                { comp
                    | registers = Dict.insert r (regVal r - 1) comp.registers
                    , line = comp.line + 1
                }

        Just (JumpIfNotZero v n) ->
            if eval v == 0 then
                run { comp | line = comp.line + 1 }

            else
                run { comp | line = comp.line + n }

        Nothing ->
            comp
```

The final step is to parse the input text using our instruction parser and place the parsed instructions in the computer record before running it. For our example input that adds two numbers together and stores the result in register `c`, we can then extract that register c's contents from the computer:

```elm {l r}
testProg : Maybe Int
testProg =
    let
        prog =
            input
                |> String.lines
                |> List.filterMap (parse instruction)
                |> List.indexedMap Tuple.pair
                |> Dict.fromList
    in
    { line = 0, prog = prog, registers = Dict.empty }
        |> run
        |> .registers
        |> Dict.get "c"
```
