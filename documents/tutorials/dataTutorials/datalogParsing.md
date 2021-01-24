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

- backtracking after a problem parse with [backtrackable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#backtrackable)

{|infobox)}

[datalog](https://en.wikipedia.org/wiki/Datalog) is a declarative logic programming language that can represent _facts_ and _rules_ about those facts. It provides a way of making deductive database queries cleanly and aligns well with a functional approach to programming (see this [introduction](https://x775.net/2019/03/18/Introduction-to-Datalog.html) for an explanation and examples).

Syntactically, it is a subset of the [Prolog](https://en.wikipedia.org/wiki/Prolog) language, with a relatively straightforward grammar. Let's consider how we might build a parser to interpret datalog programs.

## The datalog grammar

Datalog programs consist just of _facts_ and _rules_. Here are some example facts:

```prolog
bird("parrot").
legs("cat",4).
move("bat","fly").
move("parrot","fly").
```

A _fact_ is simply a named _relation_ (`bird` or `legs` or `move` in these examples) followed by a list of zero or more _constants_ (`"parrot"`, `"cat"`, `4`, `"bat"` and `"fly"` in these examples). Semantically, we can choose how we interpret these relations although a fact always holds true. Sensible naming should make it obvious what that truth represents (a parrot is a bird; a cat has four legs; a bat can move by flying; a parrot can move by flying).

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

would generate the additional inferred facts:

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
type alias Program =
    { facts : List Fact, rules : List Rule }


type alias Fact =
    ( Relation, List Constant )


type alias Relation =
    String


type Constant
    = Str String
    | Num Int


type alias Rule =
    ( Atom, List NegatableAtom )


type alias Atom =
    ( Relation, List Term )


type NegatableAtom
    = Atom Atom
    | NotAtom Atom


type Term
    = Variable String
    | Constant Constant
```

This would allow us to express our example datalog program with type safety:

```elm {l}
exampleProg : Program
exampleProg =
    { facts =
        [ ( "bird", [ Str "parrot" ] )
        , ( "legs", [ Str "cat", Num 4 ] )
        , ( "move", [ Str "bat", Str "fly" ] )
        , ( "move", [ Str "parrot", Str "fly" ] )
        ]
    , rules =
        [ ( ( "flyingBird", [ Variable "X" ] )
          , [ Atom ( "bird", [ Variable "X" ] )
            , Atom ( "move", [ Variable "X", Constant (Str "fly") ] )
            ]
          )
        ]
    }
```

Creating datalog programs this way would be somewhat tedious, which is why we wish to create a parser to convert raw datalog text into its equivalent `Program`.

## Building Parsers from Bottom-Up

### Constants

Constants can be one of a numeric value, single word starting with a lowercase letter, or some quoted text (that may start with an uppercase latter and contain non-alphabetic characters). Parsers for each of these cases can be created in a similar way to those in the earlier tutorials:

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


strConstant : Parser Constant
strConstant =
    P.variable
        { start = Char.isLower
        , inner = \c -> Char.isAlphaNum c || c == '_'
        , reserved = Set.empty
        }
        |> P.map Str


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
    P.oneOf
        [ numConstant
        , strConstant
        , quotedConstant
        ]
```

### Fact Parsing

Let's consider fact parsing first where our grammar tells us we need to handle

```prolog
<fact> ::=  <relation> "(" <constant-list> ")."
```

Relation names are simply lower case words and we can use Elm parser's built-in [variable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#variable) parser to identify them.

```elm {l}
relation : Parser Relation
relation =
    P.variable
        { start = Char.isLower
        , inner = \c -> Char.isAlphaNum c || c == '_'
        , reserved = Set.empty
        }
```

We can handle lists of constants with Elm parser's built-in [sequence](https://package.elm-lang.org/packages/elm/parser/latest/Parser#sequence) parser.

```elm {l}
fact : Parser Fact
fact =
    P.succeed Tuple.pair
        |. P.spaces
        |= relation
        |. P.spaces
        |= P.sequence
            { start = "("
            , item = constant
            , separator = ","
            , end = ")"
            , spaces = P.spaces
            , trailing = P.Forbidden
            }
        |. P.symbol "."
        |. P.spaces
```

### Rule Parsing

The rule grammar is more flexible than for facts as we need to be able to accommodate atoms on both sides of the implies symbol and those atoms can include both constants and variables.

```prolog
<rule> ::= <atom> ":-" <atom-list> "."
<atom> ::= <relation> "(" <term-list> ")"
<term> ::= <constant> | <variable>
```

Building up our remaining parsers from bottom to top, we need to add one for handling variables:

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

A term can be either a variable or a constant:

```elm {l}
term : Parser Term
term =
    P.oneOf
        [ variable
        , constant |> P.map Constant
        ]
```

An atom is a named relation of terms:

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

A negated version of an atom will be preceded by `not`:

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

And finally a rule pairs an atom with a list of atoms via an implication symbol:

```elm {l}
rule : Parser Rule
rule =
    P.succeed Tuple.pair
        |. P.spaces
        |= atom
        |. P.spaces
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

Now we have the individual parsers we can assemble them in a top level `Program` parser loop. The loop is terminated when we reach the end of the input and we continue looping if we are able to parse facts or rules.

Unlike earlier examples, whether some input text is a fact or rule is not determinable until after the relation name has been found. One approach, that aids program clarity, is firstly attempt to parse a fact, and if that fails, to _backtrack_ so that an attempt to parse a rule instead can be made. This is simply achieved by providing the relevant parser to the [backtrackable](https://package.elm-lang.org/packages/elm/parser/latest/Parser#backtrackable) function. Backtracking can be a more expensive for large inputs as it can involve parsing portions of input text more than once. However, in the case of our grammar, this is relatively limited so should not slow down execution by any noticeable amount.

```elm {l}
program : Parser Program
program =
    let
        programHelp ( facts, rules ) =
            P.oneOf
                [ P.succeed (Program facts rules |> P.Done)
                    |. P.end
                , P.succeed (\f -> ( f :: facts, rules ) |> P.Loop)
                    |= P.backtrackable fact
                , P.succeed (\r -> ( facts, r :: rules ) |> P.Loop)
                    |= rule
                ]
    in
    P.loop ( [], [] ) programHelp
```

The program parser reverses the list of facts and rules as it parses (we accumulate new items onto the front of the stored lists), but this is not a problem since datalog is independent of declaration order.

And to run our parser, we will for the moment, convert the parsed result into a [Maybe](https://package.elm-lang.org/packages/elm/core/latest/Maybe).

```elm {l}
parse : Parser a -> String -> Maybe a
parse parser =
    P.run parser >> Result.toMaybe
```

## Conclusions

This chapter has considered how we translate a well-specified grammar into a parser that transforms some input text into custom types that represent that grammar. While it does not introduce much new Elm parser functionality, it does provide practice in applying the parser combinator approach and lays the ground for considering one of the main strengths of the Elm Parser approach, that of robust error handling to provide useful feedback on the parsing process.

---

## Appendix: Testing

### Simple Example

^^^elm r=(parse program testInput1)^^^

### Example with multiple rules and negation

^^^elm r=(parse program testInput2)^^^

### Network Example

^^^elm r=(parse program testInput3)^^^

### Test Programs

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
