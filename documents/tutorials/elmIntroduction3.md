---
id: "litvis"
---

@import "css/tutorial.less"

1.  [Introduction](elmIntroduction1.md)
2.  [Functions, functions, functions](elmIntroduction2.md)
3.  **Types and pattern matching**
4.  [Lists and list processing](elmIntroduction4.md)
5.  [Elm and elm-vega](elmIntroduction5.md)

---

# Types and pattern matching

Elm is a statically typed language.
This means that when you declare a function or one of its parameters to be of a particular type such as `Int`, `Float`, `String`, `Bool`, it can never change type during the program's lifetime.
This apparent restriction is helpful in keeping your programs bug-free as the Elm compiler will flag any unexpected change in type as an error indicating the source of the problem.

For example, this function should be flagged with an explantory error:

> _The definition of `myErroneousFunction` does not match its type annotation. The type annotation for `myErroneousFunction` says it is a: Float but the definition (shown above) is a: String_

```elm
myErroneousFunction : Float
myErroneousFunction =
    "0.1234"
```

## Creating your own types

Suppose you wish to create some functions that deal with the days of the week.
You could represent each day with the `String` type (`"Monday"`, `"Tuesday"` etc.), but this is vulnerable to hard-to-spot errors if somewhere in your program you misspell one of the days, or you forget whether you are using full names or abbreviations (`"Tue"` or`"Tues"` or `"Tuesday"`?).

Instead, you can create your own types that restrict values to a named set of options.
This has the advantage of bringing the Elm compiler in to help spot mistakes, as any inconsistent naming will be flagged as an error.
The types, called _union types_ are similar (but more powerful) than `enum` types available in some other languages.

Here is how you might create a day of the week union type, using the Elm keyword `type` with available options separated with the vertical bar symbol `|`, noting that types must start with an upper case letter:

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

Once created, the type can be used just like any other in-built type:

```elm {l raw}
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

---

_Next >>_ [Lists and list processing](elmIntroduction4.md)
