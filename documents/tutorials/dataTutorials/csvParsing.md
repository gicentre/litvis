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

# Using Elm Parser to import CSV files

Comma-separated value (CSV) files can be quite hard to parse robustly. Let's consider how we might use the [Elm parser](https://package.elm-lang.org/packages/elm/parser/latest) to do this. Our goal is to parse an input file such as

```elm {l}
titanic : String
titanic =
    """
pclass,survived,name,sex,age,sibsp,parch,ticket,fare,cabin,embarked,boat,body,home.dest
1,1,"Allen, Miss. Elisabeth Walton",female,29,0,0,24160,211.3375,B5,S,2,,"St Louis, MO"
1,1,"Allison, Master. Hudson Trevor",male,0.9167,1,2,113781,151.55,C22 C26,S,11,,"Montreal, PQ / Chesterville, ON"
1,0,"Allison, Miss. Helen Loraine",female,2,1,2,113781,151.55,C22 C26,S,,,"Montreal, PQ / Chesterville, ON"
1,0,"Allison, Mr. Hudson Joshua Creighton",male,30,1,2,113781,151.55,C22 C26,S,,135,"Montreal, PQ / Chesterville, ON"
1,0,"Allison, Mrs. Hudson J C (Bessie Waldo Daniels)",female,25,1,2,113781,151.55,C22 C26,S,,,"Montreal, PQ / Chesterville, ON"
1,1,"Anderson, Mr. Harry",male,48,0,0,19952,26.55,E12,S,3,,"New York, NY"
"""
```

into a list of lists of strings where each string is a value in the CSV file that was originally separated by a comma.

| pclass | survived | name                                              | sex    | age    | sibsp | parch | ticket | fare     | cabin   | embarked | boat | body | home.dest                         |
| ------ | -------- | ------------------------------------------------- | ------ | ------ | ----- | ----- | ------ | -------- | ------- | -------- | ---- | ---- | --------------------------------- |
| 1      | 1        | "Allen, Miss. Elisabeth Walton"                   | female | 29     | 0     | 0     | 24160  | 211.3375 | B5      | S        | 2    |      | "St Louis, MO"                    |
| 1      | 1        | "Allison, Master. Hudson Trevor"                  | male   | 0.9167 | 1     | 2     | 113781 | 151.55   | C22 C26 | S        | 11   |      | "Montreal, PQ / Chesterville, ON" |
| 1      | 0        | "Allison, Miss. Helen Loraine"                    | female | 2      | 1     | 2     | 113781 | 151.55   | C22 C26 | S        |      |      | "Montreal, PQ / Chesterville, ON" |
| 1      | 0        | "Allison, Mr. Hudson Joshua Creighton"            | male   | 30     | 1     | 2     | 113781 | 151.55   | C22 C26 | S        |      | 135  | "Montreal, PQ / Chesterville, ON" |
| 1      | 0        | "Allison, Mrs. Hudson J C (Bessie Waldo Daniels)" | female | 25     | 1     | 2     | 113781 | 151.55   | C22 C26 | S        |      |      | "Montreal, PQ / Chesterville, ON" |
| 1      | 1        | "Anderson, Mr. Harry"                             | male   | 48     | 0     | 0     | 19952  | 26.55    | E12     | S        | 3    |      | "New York, NY"                    |

Note some of the complications that can arise in a CSV file.

- There may be blank lines in our input (first and last in this example), which we should ignore.
- The first non-blank line is a _header_ that should contain the same number of comma separated values as in subsequent lines, but the values themselves may be of a different form to the data values in later lines.
- While commas are used to separate values, the values themselves may contain commas which do not act as separators if they are _escaped_ within a string enclosed by quotation marks.
- There may be consecutive commas indicating an empty value between them.
- A line that starts with a comma indicates a empty first value. Likewise a line that ends with a comma indicates an empty final value.

## A data structure to store the parsed results

A good first step is to define a top-level parsing function that describes the format of the input and the desired output. Any parsed CSV file should contain a header with the names of each column in the data along with some rows of actual data values. We might therefore define the output of our CSV parsing as a record that separates the header names from the main body of values:

```elm {l}
type alias Table =
    { header : List String, body : List (List String) }
```

The parser should take an input string that has been split into non-empty lines and parse the first one into the header and the remaining into the body of the table:

```elm {l}
parse : Parser (List String) -> String -> Table
parse parser input =
    let
        parseLine row =
            case P.run parser row of
                Ok output ->
                    output

                Err msg ->
                    []
    in
    case input |> String.lines |> List.filter (String.length >> (/=) 0) >> List.map parseLine of
        header :: body ->
            Table header body

        [] ->
            Table [] []
```

## Parsing a simple case

Let's start with a simple example of input so we can create a first attempt at a parser.

```elm {l}
input1 : String
input1 =
    """
animal,legs,size
cat,4,medium
dog,4,large
sparrow,2,small
"""
```

We need to create a parser that will split a line into the strings separated by commas. We might ordinarily do this with [String.split](https://package.elm-lang.org/packages/elm/core/latest/String#split), but because we want to integrate this with other parsers, let's create a simple parser to do the same.

We can create a parser to keep chomping characters until a comma is found or the end of a line is reached:

```elm {l}
token : Parser String
token =
    P.succeed ()
        |. P.chompUntilEndOr ","
        |> P.getChompedString
```

Because we need to be able to parse multiple tokens in a line we can use this in a [loop](https://package.elm-lang.org/packages/elm/parser/latest/Parser#loop) parser. We have three conditions to consider (a) we've reached the end of the line, so the loop is done; (b) we parse a comma, so we continue looping; or (c) we parse some non-comma text (token) which we add to a list of stored tokens and then continue looping. Note also how when we are done, we reverse the order of tokens in the list because we have been adding them most recent first.

The order in which we consider the three alternative parsers (end of line, comma separator and normal token) is important. We test for the end condition first to stop the loop from cycling endlessly (a token parser could detect an empty token at the end of a line without consuming any characters). Similarly, we test for comma separators before tokens so that we don't terminate token chomping at a comma that precedes it.

```elm {l}
tokens : Parser (List String)
tokens =
    let
        tokensHelp values =
            P.oneOf
                [ P.succeed (List.reverse values |> P.Done)
                    |. P.end
                , P.succeed (values |> P.Loop)
                    |. P.symbol ","
                , P.succeed (\v -> v :: values |> P.Loop)
                    |= token
                ]
    in
    P.loop [] tokensHelp
```

^^^elm r=(parse tokens input1)^^^

## A More Flexible Parser

The parser above works well for our simple CSV input. But there are several cases where we need more flexible parsing.

### Quotation-enclosed tokens

Not all commas in an input string need act as separators. When enclosed in quotation marks we would like to treat any commas within as normal text rather than a separator.

```elm {l}
input2 : String
input2 =
    """
animal,legs,size
"cat, domestic",4,medium
dog,4,large
sparrow,2,small
"""
```

^^^elm r=(parse tokens input2)^^^

The original parser incorrectly splits `"cat, domestic"` into two tokens when it should be one. What we need to do is consider quotation-enclosed tokens differently, treating commas within them as text. We can amend our parser so it considers such escaped tokens as well as standard ones:

```elm {l}
escapedToken : Parser String
escapedToken =
    P.succeed identity
        |. P.symbol "\""
        |= (P.chompUntil "\"" |> P.getChompedString)
        |. P.symbol "\""
```

As with our earlier parser, the order in which we consider the alternative parsers is important. We need to test for an escaped token before a normal one to avoid considering the enclosing quotes as token text. The general guideline here when ordering `oneOf` parsers, is to order them from most specific to most general.

```elm {l}
tokens2 : Parser (List String)
tokens2 =
    let
        tokensHelp values =
            P.oneOf
                [ P.succeed (List.reverse values |> P.Done)
                    |. P.end
                , P.succeed (values |> P.Loop)
                    |. P.symbol ","
                , P.succeed (\v -> v :: values |> P.Loop)
                    |= escapedToken
                , P.succeed (\v -> v :: values |> P.Loop)
                    |= token
                ]
    in
    P.loop [] tokensHelp
```

^^^elm r=(parse tokens2 input2)^^^

### Empty tokens

A legitimate CSV line can contain consecutive commas indicating an empty value. For example, the slow-worm without any text for number of legs or even an entire row of empty values (indicated by two comma separators in the example below):

```elm {l}
input3 : String
input3 =
    """animal,legs,size
"cat, domestic",4,medium
dog,4,large
sparrow,2,small
slow-worm,,small
,,
"""
```

^^^elm r=(parse tokens2 input3)^^^

Currently the slow-worm line is parsed into `["slow-worm","small"]` whereas we would like it to be `["slow-worm","","small"]` ensuring we have the expected number of values in our list. And the line containing two commas only is parsed into an empty list whereas it should be `["","",""]`. This is because our comma-detecting parser is always considered before the token-detecting parser within a loop, so we never store the empty text between consecutive commas.

We can overcome this by keeping track of whether we have just previously identified a separator. If we reach another separator immediately after a previous one, we add an empty string to parsed output. Additionally we need to treat the first and last items as if they are bound on their outer edges by separators so we can accommodate input lines that either start or end in a comma.

The approach we adopt here is to store not only the list of parsed values, but also whether the immediately previous item in the loop was a separator. We can do this by storing an list containing a single empty string following a separator or start of line and an empty list otherwise. We can add this item to our stored list of tokens whenever we come across a separator or end of line.

```elm {l}
tokens3 : Parser (List String)
tokens3 =
    let
        tokensHelp ( prev, values ) =
            P.oneOf
                [ P.succeed (prev ++ values |> List.reverse |> P.Done)
                    |. P.end
                , P.succeed (( [ "" ], prev ++ values ) |> P.Loop)
                    |. P.symbol ","
                , P.succeed (\v -> ( [], v :: values ) |> P.Loop)
                    |= escapedToken
                , P.succeed (\v -> ( [], v :: values ) |> P.Loop)
                    |= token
                ]
    in
    P.loop ( [ "" ], [] ) tokensHelp
```

^^^elm r=(parse tokens3 input3)^^^

This illustrates one of the benefits of parsing that goes beyond simple regular expression parsing. Here we are keeping track of a persistent state between sequential parses and act dependent on that state.
