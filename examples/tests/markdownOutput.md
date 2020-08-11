# Markdown Output Tests

The following should generate formatted markdown output in the preview window.

> JWO: Until markdown output is implemented, the `m` or `markdown` option will not generate any literate code so the triple hat references will not recognise the symbol.

## 1. Numeric Values

These should be identical to `r`/`raw` output as they are simple numbers with no markdown-specific content.

### 1.1 Output from fenced code blocks

```elm {m}
intOutput : Int
intOutput =
    3 + 7
```

```elm {m}
floatOutput : Float
floatOutput =
    pi
```

### 1.2 Output from triple hat calls

Output in each column should be identical:

| Markdown          | `r` output              | `m` output              | `markdown` output              |
| ----------------- | ----------------------- | ----------------------- | ------------------------------ |
| 10                | ^^^elm r=intOutput^^^   | ^^^elm m=intOutput^^^   | ^^^elm markdown=intOutput^^^   |
| 3.141592653589793 | ^^^elm r=floatOutput^^^ | ^^^elm m=floatOutput^^^ | ^^^elm markdown=floatOutput^^^ |

## 2. Simple String Values

These should be similar to `r`/`raw` output except that no quotation marks should appear around `m`/`markdown` output.

### 2.1 Output from fenced code blocks

```elm {m}
stringOutput : String
stringOutput =
    "Some text"
```

```elm {m}
formattedOutput1 : String
formattedOutput1 =
    "Some **strong** and _emphasised_ text"
```

```elm {m}
formattedOutput2 : String
formattedOutput2 =
    "A [link](https://stationinthemetro.com/wp-content/uploads/2013/04/Markdown_Cheat_Sheet_v1-1.pdf)."
```

```elm {m}
formattedOutput3 : String
formattedOutput3 =
    "![Image](https://gicentre.github.io/data/images/LillyTarn.jpg)"
```

```elm {m}
formattedOutput4 : String
formattedOutput4 =
    "Some code `x + y*3 - z/4.5` in a sentence."
```

```elm {m}
formattedOutput5 : String
formattedOutput5 =
    "Embedded <b>bold</b> and <i>italic</i> html."
```

```elm {m}
formattedOutput6 : String
formattedOutput6 =
    "Some escaped \\*, \\\\, and \\_ characters."
```

### 2.2 Output from triple hat calls

Output in each column should be identical except for '`r` output' which should have text encased in quotation marks and no formatting:

| Markdown                                                                                          | `r` output                   | `m` output                   | `markdown` output                   |
| ------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------- | ----------------------------------- |
| Some text                                                                                         | ^^^elm r=stringOutput^^^     | ^^^elm m=stringOutput^^^     | ^^^elm markdown=stringOutput^^^     |
| Some **strong** and _emphasised_ text                                                             | ^^^elm r=formattedOutput1^^^ | ^^^elm m=formattedOutput1^^^ | ^^^elm markdown=formattedOutput1^^^ |
| A [link](https://stationinthemetro.com/wp-content/uploads/2013/04/Markdown_Cheat_Sheet_v1-1.pdf). | ^^^elm r=formattedOutput2^^^ | ^^^elm m=formattedOutput2^^^ | ^^^elm markdown=formattedOutput2^^^ |
| ![Image](https://gicentre.github.io/data/images/LillyTarn.jpg)                                    | ^^^elm r=formattedOutput3^^^ | ^^^elm m=formattedOutput3^^^ | ^^^elm markdown=formattedOutput3^^^ |
| Some code `x + y*3 - z/4.5` in a sentence.                                                        | ^^^elm r=formattedOutput4^^^ | ^^^elm m=formattedOutput4^^^ | ^^^elm markdown=formattedOutput4^^^ |
| Embedded <b>bold</b> and <i>italic</i> html.                                                      | ^^^elm r=formattedOutput5^^^ | ^^^elm m=formattedOutput5^^^ | ^^^elm markdown=formattedOutput5^^^ |
| Some escaped \*, \\, and \_ characters.                                                           | ^^^elm r=formattedOutput6^^^ | ^^^elm m=formattedOutput6^^^ | ^^^elm markdown=formattedOutput6^^^ |

> Note in the last row above, there should only be a single `\` in the output, but because we need to represent it with a double `\\` to escape it in markdown, and in Elm we also need to escape the `\` with a `\\`, the code requires `\\\\` characters.

## 3. Multi-line and start-of-line formatting

The following assume the markdown formatting will start at the beginning of a line, or are spread over multiple lines.
Note also the use of the Elm triple quotation marks to represent multi-line strings.
We cannot embed these in tables, so we match the markdown with the intended output on subsequent lines.

---

### 3.1 Blockquotes

> A blockquote sentence. Or two.

↕

```elm {m}
multiLineOutput1 : String
multiLineOutput1 =
    "> A blockquote sentence. Or two."
```

---

### 3.2 Headings

# Level 1 heading

## Level 2 heading

### Level 3 heading

#### Level 4 heading

↕

```elm {m}
multiLineOutput2 : String
multiLineOutput2 =
    """
# Level 1 heading

test

## Level 2 heading

a

### Level 3 heading

b

#### Level 4 heading

c
"""
```

---

### 3.3 Bulleted lists

- bullet item 1
- bullet item 2
- bullet item 3

↕

```elm {m}
multiLineOutput3 : String
multiLineOutput3 =
    """- bullet item 1
- bullet item 2
- bullet item 3"""
```

---

- spaced bullet item 1

- spaced bullet item 2

- spaced bullet item 3

↕

```elm {m}
multiLineOutput4 : String
multiLineOutput4 =
    """- spaced bullet item 1

* spaced bullet item 2

- spaced bullet item 3"""
```

---

### 3.4 Numbered Lists

1. Item One
2. Item Two
3. Item Three

↕

```elm {m}
multiLineOutput5 : String
multiLineOutput5 =
    """1. Item One
2. Item Two
3. Item Three"""
```

---

1. Item One

   With more than one sentence.

2. Item Two

   With more than one sentence.

3. Item Three

   With more than one sentence.

↕

```elm {m}
multiLineOutput6 : String
multiLineOutput6 =
    """1. Item One

    With more than one sentence.

2. Item Two

    With more than one sentence.

3. Item Three

    With more than one sentence."""
```

---

### 3.5 Footnotes

This is text with a footnote.[^1]
[^1]: And this is the footnote.

↕

```elm {m}
multiLineOutput7 : String
multiLineOutput7 =
    """This is text with a footnote.[^2]
[^2]: And this is the footnote (with separate number so as not to clash)."""
```

---

### 3.6 Tables

| colLabelA | colLabelB | colLabelC |
| --------- | :-------: | --------: |
| A1        |    B1     |        C1 |
| A2        |    B2     |        C2 |
| A3        |    B3     |        C3 |

↕

```elm {m}
multiLineOutput8 : String
multiLineOutput8 =
    """| colLabelA | colLabelB | colLabelC |
| --------- | :-------: | --------: |
| A1        |    B1     |        C1 |
| A2        |    B2     |        C2 |
| A3        |    B3     |        C3 |"""
```
