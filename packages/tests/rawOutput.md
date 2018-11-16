# Raw Elm output in LitVis documents

```elm {l}
askDeepThought question =
    if question == "Answer to the Ultimate Question of Life" then
        42

    else
        0


answer =
    askDeepThought "Answer to the Ultimate Question of Life"


answerAsString =
    "forty-two"
```

Answer to the Ultimate Question of Life, the Universe, and Everything is ^^^elm r=answer^^^.

---

**^^^elm r=answer^^^ (^^^elm r=answerAsString^^^)** is the natural number that succeeds ^^^elm r=(answer-1)^^^ and precedes ^^^elm r=(answer+1)^^^. _[Wikipedia]_

> AK: `^^^elm r=answerAsString^^^` produces quotes. How about adding `^^^elm s=answerAsString^^^` for printing strings without quotes? Implementing this should be quicker than updating the docs.

> JWO: I think we can cover this with the `m`/`markdown` output, which should not generate quotes. This should work for all strings that do not contain markdown formatting instructions. For those that do, outputing the literal with quotation marks makes sense.

---

^^^elm r=answer^^^ / $\pi$ = ^^^elm r=(answer / pi)^^^

---

More examples

**raw**

- `^^^elm r=answer^^^` → ^^^elm r=answer^^^
- `^^^elm r=answerAsString^^^` → ^^^elm r=answerAsString^^^
- `^^^elm r=("hello world")^^^` → ^^^elm r=("hello world")^^^
- `^^^elm r=(askDeepThought "2+2?")^^^` → ^^^elm r=(askDeepThought "2+2?")^^^
- `^^^elm r=askDeepThought^^^` → ^^^elm r=askDeepThought^^^

**json**

- `^^^elm j=answer^^^` → ^^^elm j=answer^^^
- `^^^elm j=answerAsString^^^` → ^^^elm j=answerAsString^^^
- `^^^elm j=("hello world")^^^` → ^^^elm j=("hello world")^^^
- `^^^elm j=(askDeepThought "2+2?")^^^` → ^^^elm j=(askDeepThought "2+2?")^^^
- `^^^elm j=askDeepThought^^^` → ^^^elm j=askDeepThought^^^

**vis**

- `^^^elm v=answer^^^` → ^^^elm v=answer^^^
- `^^^elm v=answerAsString^^^` → ^^^elm v=answerAsString^^^
- `^^^elm v=("hello world")^^^` → ^^^elm v=("hello world")^^^
- `^^^elm v=(askDeepThought "2+2?")^^^` → ^^^elm v=(askDeepThought "2+2?")^^^
- `^^^elm v=askDeepThought^^^` → ^^^elm v=askDeepThought^^^

[wikipedia]: https://en.wikipedia.org/wiki/42_(number)
