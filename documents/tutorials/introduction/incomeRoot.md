---
elm:
  dependencies:
    gicentre/elm-vegalite: latest
---

# Household Income

Household income of the richest 5% (95th percentile) in the UK since 1961.
Data from the [Institute for Fiscal Studies](http://www.ifs.org.uk/tools_and_resources/incomes_in_uk).

```elm {l=hidden}
import VegaLite exposing (..)


data : Data
data =
    dataFromUrl "https://gicentre.github.io/data/incomeInequality2017.csv" []
```
