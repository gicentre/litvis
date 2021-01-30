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
import Parser.Advanced as P exposing ((|.), (|=), Parser)
import Set exposing (Set)
```

_This is one of a series of 'data' tutorials for use with litvis._

1.  [Parsing structured text](assemblyParsing.md)
1.  [Parsing unstructured text](unstructuredText.md)
1.  [Parsing CSV](csvParsing.md)
1.  [Parsing datalog](datalogParsing.md)
1.  [Reporting helpful parsing errors, part 1](datalogErrorReporting1.md)
1.  **Reporting helpful parsing errors, part 2**

---

# Reporting helpful parsing errors, part 2

{(todo|}Add content{|todo)}
