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
import Set exposing (Set)
```

_This is one of a series of 'data' tutorials for use with litvis._

1.  [Parsing structured text](assemblyParsing.md)
1.  [Parsing unstructured text](unstructuredText.md)
1.  [Parsing CSV](csvParsing.md)
1.  **Parsing datalog**

---

# Using Elm Parser to import datalog

_Thanks to [Brian Hicks](https://www.brianthicks.com) for inspiration for this tutorial, and in particular sharing [bad-datalog](https://git.bytes.zone/brian/bad-datalog)._

{(infobox|}

New Elm parser functions introduced:

- extracting words with conditions using [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable)
- parsing a sequence of items with [sequence](https://package.elm-lang.org/packages/elm/parser/latest/Parser#sequence)
- using previously parsed content with [andThen](https://package.elm-lang.org/packages/elm/parser/latest/Parser#andThen)
- explicitly generating a parser problem with [problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#problem)

{|infobox)}

[datalog](https://en.wikipedia.org/wiki/Datalog) is a declarative logic programming language that can represent _facts_ and _rules_ about those facts. It provides a way of making deductive database queries cleanly and aligns well with a functional approach to programming (see this [introduction](https://x775.net/2019/03/18/Introduction-to-Datalog.html) for an explanation and examples).

Syntactically, it is a subset of the [Prolog](https://en.wikipedia.org/wiki/Prolog) language, with a relatively straightforward grammar. Let's consider how we might build a parser to interpret datalog programs.

## The datalog grammar

A datalog program consists of a set of statements that are either _facts_ or _rules_.

Here are some example facts:

```prolog
bird("parrot").
legs("cat",4).
move("bat","fly").
move("parrot","fly").
```

A _fact_ is a named _relation_ (`bird` or `legs` or `move` in these examples) followed by a list of zero or more _constants_ (`"parrot"`, `"cat"`, `4`, `"bat"` and `"fly"` in these examples). Semantically, we can choose how we interpret these relations although a fact always holds true. Sensible naming should make it obvious what that truth represents (a parrot is a bird; a cat has four legs; a bat can move by flying; a parrot can move by flying).

Here is a sample rule:

```prolog
flyingBird(X) :- bird(X), move(X,"fly").
```

A rule allows us to infer new facts from some existing facts. The `:-` symbol indicates right-to-left [logical implication](https://en.wikipedia.org/wiki/Material_conditional) and can be read as 'if'. Any unquoted term starting with an upper-case character in the rule is considered a _variable_. The statement above can be read as "X is a flying bird is true if it is known that X is a bird is true and X can move by flying is true". Or more concisely "X is a flying bird if it is a bird and it can move by flying". Note that the `bird` and `move` components of the rule are combined with a logical AND (conjunction).

If a datalog program were to comprise the four facts and one rule above, it would generate the additional inferred fact:

```prolog
flyingBird("parrot").
```

A rule will always have a _head_ (`flyingBird(X)` in this example) before the `:-` symbol and a _body_ (`bird(X), move(X,"fly").` in this example) following it. Values in brackets after a relation can be either _variables_ (e.g. `X`) or _constants_ (e.g. `"fly"`) and are referred to as _terms_. A relation and its terms make up an _atom_.

We will also consider a widely used modification of the datalog grammar that allows atoms in the tail of a rule to be _negated_, that is, optionally to be preceded by the word `not`. For example,

```prolog
flightlessBird(X) :- bird(X), not move(X,"fly").
```

To guide the building of a datalog parser it is useful to fully specify the [grammar](https://en.wikipedia.org/wiki/Context-free_grammar) of any datalog program:

```prolog
<program> ::= <fact> <program> | <rule> <program> | ɛ
<fact> ::=  <relation> "(" <constant-list> ")."
<rule> ::= <atom> ":-" <atom-list> "."
<atom> ::= <relation> "(" <term-list> ")"
<negatable-atom> ::= <atom> | "not" <atom>
<atom-list> ::= <negatable-atom> | <negatable-atom> "," <atom-list> <atom-list>
<term> ::= <constant> | <variable>
<term-list> ::= <term> | <term> "," <term-list>
<constant-list> ::= <constant> | <constant> "," <constant-list>
```

Note that because a rule's head is an atom and its tail may contain atoms, we can define rules recursively. And we can do so without the risk of infinite recursion (technically, datalog is [a total functional language](https://en.wikipedia.org/wiki/Total_functional_programming)). For example the following fact and rule are valid:

```prolog
brexit("UK").
meansBrexit(Country) :- meansBrexit(Country).
```

despite the `meansBrexit` rule adding no new inferred facts.

More usefully, recursive rules can model networks as graphs. When we have multiple rules with the same relation name, they are combined with logical 'OR' (disjunction). For example, here is a simple undirected graph:

```prolog
connected("Windermere","Ambleside").
connected("Ambleside","Grasmere").
connected("Grasmere","Keswick").

connected(A,B) :- connected(B,A).
canTravel(A,B) :- connected(A,B).
canTravel(A,C) :- connected(A,B), canTravel(B,C).
```

which would generate the additional inferred facts:

```prolog
canTravel("Windermere", "Windermere").
canTravel("Windermere", "Ambleside").
canTravel("Windermere", "Grasmere").
canTravel("Windermere", "Keswick").
canTravel("Ambleside", "Windermere").
canTravel("Ambleside", "Ambleside").
canTravel("Ambleside", "Grasmere").
canTravel("Ambleside", "Keswick").
canTravel("Grasmere", "Windermere").
canTravel("Grasmere", "Ambleside").
canTravel("Grasmere", "Grasmere").
canTravel("Grasmere", "Keswick").
canTravel("Keswick", "Windermere").
canTravel("Keswick", "Ambleside").
canTravel("Keswick", "Grasmere").
canTravel("Keswick", "Keswick").
```

Let's express the elements of the grammar as Elm types:

```elm {l}
type Statement
    = Fact ( Relation, List Constant )
    | Rule ( Atom, List NegatableAtom )


type alias Relation =
    String


type Constant
    = Str String
    | Num Int


type alias Atom =
    ( Relation, List Term )


type NegatableAtom
    = Atom Atom
    | NotAtom Atom


type Term
    = Variable String
    | Constant Constant
```

This would allow us to express a datalog program with type safety:

```elm {l}
exampleProg : List Statement
exampleProg =
    [ Fact ( "bird", [ Str "parrot" ] )
    , Fact ( "legs", [ Str "cat", Num 4 ] )
    , Fact ( "move", [ Str "bat", Str "fly" ] )
    , Fact ( "move", [ Str "parrot", Str "fly" ] )
    , Rule
        ( ( "flyingBird", [ Variable "X" ] )
        , [ Atom ( "bird", [ Variable "X" ] )
          , Atom ( "move", [ Variable "X", Constant (Str "fly") ] )
          ]
        )
    ]
```

Specifying datalog programs explicitly this way would be somewhat tedious, which is why we wish to create a parser to convert raw datalog text into its equivalent `Program`.

## Building Parsers from Bottom-Up

For more complex grammars like this, it is often easier to build the parsers from 'bottom-up' – that is to consider the parsers that handle the lowest level input (e.g. numbers or strings) first and then the parsers that assemble these low level parsers afterwards.

### Constants

Constants can be one of a numeric value, single word starting with a lowercase letter, or some quoted text (that may start with an uppercase latter and contain non-alphabetic characters).

A numeric constant, that may be positive or negative, can be found in a similar way to previous tutorials, in this case placing it in our `Num` custom type:

```elm {l}
numConstant : Parser Constant
numConstant =
    P.oneOf
        [ P.int
        , P.succeed negate
            |. P.symbol "-"
            |= P.int
        ]
        |> P.map Num
```

For string constants we can use Elm parser's [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable) that allows us extract a word from input, but impose some conditions on what words are valid. In this case we can specify it must start with a lowercase letter, the rest of the word can be any alphanumeric character or an underscore, but it must not be the word `not` (which we will reserve for negating an atom) before wrapping it in a `Str`

```elm {l}
strConstant : Parser Constant
strConstant =
    P.variable
        { start = Char.isLower
        , inner = \c -> Char.isAlphaNum c || c == '_'
        , reserved = Set.singleton "not"
        }
        |> P.map Str
```

A quoted constant can be any text as along as it starts and ends with double quotation marks. We remove the quotation marks themselves with [String.slice](https://package.elm-lang.org/packages/elm/core/latest/String#slice) before returning the constant value:

```elm {l}
quotedConstant : Parser Constant
quotedConstant =
    P.succeed ()
        |. P.token "\""
        |. P.chompWhile ((/=) '"')
        |. P.token "\""
        |> P.getChompedString
        |> P.map (String.slice 1 -1 >> Str)
```

The three constant variants can be combined in a general constant parser.

```elm {l}
constant : Parser Constant
constant =
    P.oneOf [ numConstant, strConstant, quotedConstant ]
```

### Variables

Datalog _variables_ can be similarly parsed with [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable), this time specifying that they must start with an uppercase letter.

```elm {l}
variable : Parser Term
variable =
    P.variable
        { start = Char.isUpper
        , inner = \c -> Char.isAlphaNum c || c == '_'
        , reserved = Set.empty
        }
        |> P.map Variable
```

### Relations

Relation names are simply lower case words, so again we can use Elm parser's [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable) (not to be confused with the concept of the datalog _variable_).

```elm {l}
relation : Parser Relation
relation =
    P.variable
        { start = Char.isLower
        , inner = \c -> Char.isAlphaNum c || c == '_'
        , reserved = Set.singleton "not"
        }
```

### Assembling relations of constants and variables

Now that we can identify the lowest level of data with parsers, lets consider how we can group them together.

A relation should be followed by a series of _terms_ (constants and variables) which together form a valid _atom_:

```elm {l}
term : Parser Term
term =
    P.oneOf
        [ variable
        , constant |> P.map Constant
        ]
```

An atom is a named relation of terms where a list of terms is comma-separated and enclosed in parentheses. We can handle this compactly using the [sequence](https://package.elm-lang.org/packages/elm/parser/latest/Parser#sequence) parser designed for parsing lists of items.

```elm {l}
atom : Parser Atom
atom =
    P.succeed Tuple.pair
        |. P.spaces
        |= relation
        |. P.spaces
        |= P.sequence
            { start = "("
            , item = term
            , separator = ","
            , end = ")"
            , spaces = P.spaces
            , trailing = P.Forbidden
            }
```

It is possible that in the body of rule, an atom may be negated. A negated version of an atom will be preceded by `not`:

```elm {l}
negatedAtom : Parser NegatableAtom
negatedAtom =
    P.succeed NotAtom
        |. P.spaces
        |. P.symbol "not"
        |. P.spaces
        |= atom
```

And a negatable atom will be one of the two types of atom:

```elm {l}
negatableAtom : Parser NegatableAtom
negatableAtom =
    P.oneOf
        [ negatedAtom
        , atom |> P.map Atom
        ]
```

We now have the parsers necessary to assemble into rule and fact parsers.

### Fact and Rule Parsing

One of the parsing challenges we face when parsing input characters sequentially is that when we identify a relation and list of terms, we don't know whether it will form a fact or rule until we find either a `.` or a `:-` following it. And should it contain any variables, this would be fine if the head of a rule, but would be a problem as a definition of a fact – something we can only establish after we've parsed the atom and the following symbol.

Elm parser does have the ability to make a parser [backtrackable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#backtrackable) which could provide a means to overcome this problem. But where possible it is good practice to avoid backtracking to make the parser as efficient as possible (we only want to parse each character once if we can). Avoiding backtracking also helps when reporting errors, which we will consider in the next chapter.

Let's therefore consider an approach that allows just a single pass through our input. Firstly, we parse the atom we expect at the start of any statement. And then we can decide on whether the atom forms part of a fact or a rule. If it is a fact we need to check that the atom contains only constants. To do this we use the Elm parser function [andThen](https://package.elm-lang.org/packages/elm/parser/latest/Parser#andThen). This function takes some parsed content to generate a new parser allowing us to validate the content even after a succeeding parse.

```elm {l}
statement : Parser Statement
statement =
    P.succeed identity
        |= atom
        |. P.spaces
        |> P.andThen (\atm -> P.oneOf [ fact atm, rule atm ])
```

Our fact parser takes a successfully parsed atom and then checks it is followed by a terminating `.` and that the list of terms in the atom are all constants. We can force the parser to fail if it finds anything other than constants in the atom by calling [problem](https://package.elm-lang.org/packages/elm/parser/latest/Parser#problem) with a suitably explanatory error message.

```elm {l}
fact : Atom -> Parser Statement
fact ( r, terms ) =
    let
        constants =
            List.filterMap
                (\t ->
                    case t of
                        Constant c ->
                            Just c

                        _ ->
                            Nothing
                )
                terms

        onlyConstants =
            if List.length constants == List.length terms then
                P.succeed (Fact ( r, constants ))

            else
                P.problem "A fact should only contain constants"
    in
    P.succeed identity
        |. P.symbol "."
        |. P.spaces
        |= onlyConstants
```

Parsing the body of a rule, which should be list of negatable atoms following the `:=` symbol, is simplified by using the [sequence](https://package.elm-lang.org/packages/elm/parser/latest/Parser#sequence) parser. Unlike the fact parsing we will only perform syntactical checking of the rule as terms can be both constants and variables.

```elm {l}
rule : Atom -> Parser Statement
rule head =
    P.succeed (\bdy -> Rule ( head, bdy ))
        |= P.sequence
            { start = ":-"
            , item = negatableAtom
            , separator = ","
            , end = ""
            , spaces = P.spaces
            , trailing = P.Forbidden
            }
        |. P.symbol "."
        |. P.spaces
```

### Top-Level Parsers

Finally we can create a top-level program parser that simply loops through input parsing statements until the end of input is reached.

```elm {l}
program : Parser (List Statement)
program =
    let
        programHelp statements =
            P.oneOf
                [ P.succeed (statements |> List.reverse |> P.Done)
                    |. P.end
                , P.succeed (\st -> st :: statements |> P.Loop)
                    |= statement
                ]
    in
    P.loop [] programHelp
```

And to run our parser, we will for the moment, convert the parsed result into a [Maybe](https://package.elm-lang.org/packages/elm/core/latest/Maybe).

```elm {l}
parse : Parser a -> String -> Maybe a
parse parser =
    P.run parser >> Result.toMaybe
```

## Conclusions

This chapter has considered how we translate a well-specified grammar into a parser that transforms some input text into custom types that represent that grammar. It introduced an important addition to the approaches we can take to parsing, namely the use of [andThen](https://package.elm-lang.org/packages/elm/parser/latest/Parser#andThen) to validate some parsed content after, rather than during, it has been parsed. The chapter provides practice in applying the parser combinator approach and lays the ground for considering one of the main strengths of the Elm Parser, that of robust error handling to provide useful feedback on the parsing process.

---

## Appendix: Testing

### Simple Example

^^^elm r=(parse program testInput1)^^^

### Example with multiple rules and negation

^^^elm r=(parse program testInput2)^^^

### Network Example

^^^elm r=(parse program testInput3)^^^

---

## Appendix: Test Programs

```elm {l}
testInput1 : String
testInput1 =
    """
bird("parrot").
legs("cat",4).
move("bat","fly").
move("parrot","fly").

flyingBird(X) :- bird(X), move(X,"fly").
"""
```

```elm {l}
testInput2 : String
testInput2 =
    """
bird("parrot").
bird("emu").
mammal("cat").
mammal("dolphin").
mammal("bat").
mammal("human").
legs("cat",4).
legs("parrot",2).
legs("bat",2).
legs("human",2).
legs("dolphin",0).
move("parrot","fly").
move("parrot","walk").
move("emu","walk").
move("cat","walk").
move("bat","fly").
move("dolphin","swim").
move("human","walk").

flyingAnimal(Animal) :-
  move(Animal,"fly").

bipedalMammal(Animal) :-
  mammal(Animal),
  legs(Animal,2).

flightlessBird(Animal) :-
  bird(Animal),
  not move(Animal,"fly").
"""
```

```elm {l}
testInput3 : String
testInput3 =
    """
connected("Windermere","Ambleside").
connected("Ambleside","Grasmere").
connected("Grasmere","Keswick").

connected(A,B) :- connected(B,A).
canTravel(A,B) :- connected(A,B).
canTravel(A,C) :- connected(A,B), canTravel(B,C).
"""
```
