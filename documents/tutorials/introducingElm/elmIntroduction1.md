---
id: "litvis"
---

@import "../css/tutorial.less"

1.  **Introduction**
2.  [Functions, functions, functions](elmIntroduction2.md)
3.  [Types and pattern matching](elmIntroduction3.md)
4.  [Lists and list processing](elmIntroduction4.md)
5.  [Elm and elm-vegalite](elmIntroduction5.md)

---

# An Introduction to Elm

This tutorial introduces the Elm programming language and briefly covers some basics of functional programming for use with the litvis environment.

_You can edit the example elm code in these tutorial pages to experiment with the ideas introduced._

## What is Elm?

[Elm](http://elm-lang.org) is a declarative statically typed pure functional programming language that is transpiled into JavaScript.
Or in English, it is a programming language where:

- you desribe what you want to do by creating _expressions_ ("declarative") rather than provide instructions on how to do something;
- data and expressions are placed into 'types' and once categorised in this way, cannot change type ("statically typed");
- code is organised into functions that evaluate an expression to produce some value ("pure functional");
- before elm code is executed, it is translated into JavaScript so can run in browsers and related technologies like litvis ("transpiled").

Elm in combination with the [elm-vegalite](http://package.elm-lang.org/packages/gicentre/elm-vegalite/latest) and [elm-vega](http://package.elm-lang.org/packages/gicentre/elm-vega/latest) packages can be used in litvis to create visualization specifications.
But Elm can also be used to perform a range of other tasks to enrich your litvis documents.
The basics covered in this set of tutorials should provide you with the background to use code effectively in with litvis.

---

_Next >>_ [Functions, functions, functions](elmIntroduction2.md)
