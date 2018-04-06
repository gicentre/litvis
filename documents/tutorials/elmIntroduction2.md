---
id: "litvis"
elm:
    dependencies:
        gicentre/elm-vega: latest
---

@import "css/tutorial.less"

1.  [Introduction](elmIntroduction1.md)
2.  **Functions, functions, functions**
3.  [Types and pattern matching](elmIntroduction3.md)
4.  [Lists and list processing](elmIntroduction4.md)
5.  [Elm and elm-vega](elmIntroduction5.md)

---

## Functions, functions, functions

Elm code is organised into _functions_ that evaluate expressions to produce some value.
Almost everything in an Elm program will be a function.
Elm doesn't use 'variables' common in many other languages.
Instead, you create simple named functions that return a value.

You declare a function by giving it a name of your choice in 'lowerCamelCase' and some expression that provides a value.
In litvis you must give every top-level function a _type annotation_ that describes the types of value that the function handles.

Here are some examples

```elm {l}
myFunction : String
myFunction =
    "Hello, world"


anotherFunction : Int
anotherFunction =
    49


magicLetter : Char
magicLetter =
    'g'


showPicture : Bool
showPicture =
    False
```

The first line of each of these function declarations is a type annotation with the name of the function to the left of the colon and the type of value returned by the function on the right.

Unlike 'variables', in Elm all values are _immutable_ – once `magicLetter` has been assigned the value `'g'` it cannot be assigned any other value within the lifetime of the program.

You may be wondering how we can write useful programs if all assignments are immutable.
The answer is that we can also provide _parameters_ to functions that allow the returned values to be customised depending on the parameter values.

Here's a function to add two numbers together:

```elm {l}
add : Int -> Int -> Int
add firstNumber secondNumber =
    firstNumber + secondNumber
```

And here it is being used in another function:

```elm {l raw}
mySum : Int
mySum =
    add 5 12
```

Notice how the type annotation for `add` contains three types separated by `->` arrows.
The first two refer to the types of two parameters and the last one the type of value returned.
Note also that unlike some other languages, the parameters are simply separated by spaces with no brackets or commas used.

The expressions evaluated in a function can contain a mix of operators and other functions:

```elm {l}
multiply : Int -> Int -> Int
multiply n1 n2 =
    n1 * n2


divide : Int -> Int -> Int
divide denominator numerator =
    if denominator == 0 then
        0
    else
        numerator // denominator


double : Int -> Int
double n =
    multiply 2 n


isOdd : Int -> Bool
isOdd n =
    n % 2 == 1


sumIsOdd : Int -> Int -> Bool
sumIsOdd n1 n2 =
    isOdd (add n1 n2)
```

```elm {l raw}
myAnswer : Bool
myAnswer =
    sumIsOdd 5 12
```

In the `divide` function above we use a conditional expression (`if`...`then`...`else`) to ensure we do not perform a divide by zero.
Unlike some other languages, `if` must always be paired with an `else` because we must guarantee a value is returned whatever the value of the condition.
Note also that Elm has a special operator for integer division (e.g. `6 // 2`) to distingish it from floating point division (e.g. `6.3 / 2.0`).

### Brackets, precedence and pipes

In the function `sumIsOdd` we have used brackets to force `add n1 n2` to be evaluated before its value is supplied as an argument to `isOdd`.
This is necessary because without brackets, the expression `isOdd add n1 n2` would be treated as a call to `isOdd` providing 3 arguments `add`, `n1` and `n2`.

An alternative to using brackets is to force the order of evaluation with the pipe operators `<|` and `|>`, where the part of the expression at the thick end of the arrow is evaluated before the part at the thin end.
For example, the following is exactly equivalent to `sumIsOdd`:

```elm {l}
sumIsOdd2 : Int -> Int -> Bool
sumIsOdd2 n1 n2 =
    isOdd <| add n1 n2
```

The value of this form of expression becomes more obvious when we use the `|>` operator in more complex expressions to representing the `piping` of the output of one evaluated expression into the input of another.

Consider the coding coding of the following party trick:

> _Think of a number.
> Double it.
> Multiply that number by five.
> Now divide it by the number you first thought of.
> And finally, subtract seven from the number and write it down._
>
> _The number written on the paper is ... 3_

```elm {l raw siding}
always3 : Int -> Int
always3 n =
    double n |> multiply 5 |> divide n |> add -7


partyTrick : Int
partyTrick =
    always3 146470
```

The equivalent of the expression in `always3` using brackets requires us to nest brackets to control the order of evaluation and is therefore more difficult to read:

```elm {l raw siding}
always3 : Int -> Int
always3 n =
    add -7 (divide n (multiply 5 (double n)))
```

Often it is clearer to use the pipe operator to chain a sequence of functions together in the natural order we would process them.
A variation of this is used commonly in elm-vega when creating visualization specifications (see _functional composition_ below for more details).

### Scoping expressions with 'let'

By default once a function has been declared, it is available to any other parts of your program.
In a litvis document that means any non-isolated code block within the document including any upstream branches connected with `follows`.
Sometimes a function may only have relevance within a small section of your code, so it is helpful to be able to limit its scope.
This is done by delcaring a function with `let..in` within the body of another function.
Any function declared in this way is only usable within the function in which it was declared.

```elm {l raw siding}
result : Int
result =
    let
        square x =
            x * x
    in
    square 32
```

Unlike top-level function definitions, locally scoped functions do not need to have a type annotation (although this always remains an option).

### Anonymous Functions

Sometimes it is a little cumbersome to create a new named function with its own type annotation, especially if that function is simple or is to be used only once.
A more compact alternative is to create an anonymous function (sometime referred to as _lambda expressions_).

Here's a named function that contains an anonymous function for finding the square a number:

```elm {l raw siding}
result : Int
result =
    (\x -> x * x) 32
```

Anonymous functions are enclosed in brackets with their parameters named after a `\` symbol (representing the Greek letter λ) and the returned value after an `->` arrow.
One of the main uses of anonymous functions is when _folding_ and _mapping_ lists of items (see later tutorial chapter).

### Partial application and currying

The value returned by a function can be anything, including another function.
So both of the following are valid functions:

```elm {l raw}
betterDivide : Int -> Int -> Int
betterDivide n1 n2 =
    divide n2 n1


anotherDivide : Int -> Int -> Int
anotherDivide =
    divide
```

The first case (`betterDivide`) calls an existing function (`divide`) but reverses the order of parameters.
In the second case (`anotherDivide`) notice how the type annotation expects two `Int` parameters and returns an `Int` but we do not name those parameters in the body of the function.
Instead it returns another function (`divide`) with the same type signature.
It is common in functional programming to create functions that themselves return functions.
In fact this is what happens in every single function that has more then one parameter...

Did you notice anything odd about the pipeline expression used in `always3` above?

The function `multiply` takes two parameters and yet when we called it, we only appeared to provide one (`multiply 5`).
Providing only a subset of the parameters of function is known as _partial application_ and the returned result is itself a function with the remaining unspecified parameters.
For example, we could create a new function that returned a function that multiplies any number by 5:

```elm {l raw}
multByFive : Int -> Int
multByFive =
    multiply 5


myResult : Int
myResult =
    multByFive 10
```

Something similar happens in any function that contains several parameters.
Consider the type annotation of `multiply`:

```elm
multiply : Int -> Int -> Int
```

This returns a function that if given an `Int` will return a new function that itslef requires an `Int` as a parameter, equivalent to

```elm
multiply : Int -> (Int -> Int)
```

And if an integer is provided to _that_ function, it will return a simple `Int` (which is what `myResult` did above).

This process of sequentially processing partially applied functions is known as [currying](https://en.wikipedia.org/wiki/Currying) and helps to explain why the symbol `->` is used to separate parameters and the returned value in a type annotation.

### Functional Composition

The final concept we will consider here relevant to handling functions is the process of combining functions through _functional composition_.

Suppose we wished to create a function that given a number will return the cube of that number plus six.
And for the purposes of this illustration we only had access to these two functions:

```elm {l}
cube : Float -> Float
cube n =
    n ^ 3


plusSix : Float -> Float
plusSix n =
    n + 6
```

We could use the pipe operator to call both functions in order to evaluate an answer:

```elm {l raw siding}
combined : Float -> Float
combined n =
    cube n |> plusSix


answer : Float
answer =
    combined 10
```

Alternatively we can use functional compositon to create a single new function that combines the two others:

```elm {l raw siding}
combined : Float -> Float
combined =
    cube >> plusSix


answer : Float
answer =
    combined 10
```

The general rule for the functional composition operator `>>` is

`g(f(x))` is equivalent to `(f >> g) (x)`

We can also reverse the order of composition with the `<<` operator:

`g(f(x))` is equivalent to `(g << f) (x)`

The left-pointing composition opertor often makes more intuitive sense to understand.
For example, we could create a test for eveness by combing the `isOdd` function defined above with Elm's [not](http://package.elm-lang.org/packages/elm-lang/core/5.1.1/Basics#not) function to negate it:

```elm {l raw siding}
isEven : Int -> Bool
isEven =
    not << isOdd


answer : Bool
answer =
    isEven 240
```

The `<<` operator is used commonly with elm-vega specifications to combine mutliple channel encodings (see the last chapter of this tutorial)

---

_Next >>_ [Types and pattern matching](elmIntroduction3.md)
