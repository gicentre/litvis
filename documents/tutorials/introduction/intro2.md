---
id: "litvis"
---

@import "../css/tutorial.less"

```elm {l=hidden}
import VegaLite exposing (..)
```

1.  [Writing your first litvis documents](intro1.md)
2.  **Branching narratives**
3.  [Narrative schemas](intro3.md)

---

# Branching Narratives

We have already seen in the [previous chapter](intro1.md) that a litvis document can contain many code blocks, each of which can render a different visualization.
Sometimes, when we are considering a visualization design we wish to explore different design approaches in order to evaluate their relative strengths and weaknesses.
Rather than simply place all of these alternatives in a single document, we can create different 'branches' of a narrative that allows us to explore alternatives in parallel without creating a single, potentially confusing, monolithic narrative.

Let's explore how this might work in practice by considering the challenge of visualizing how household incomes of the richest and poorest 5% have changed over the last 50 years or so.

We can start, as we did in the previous chapter, by creating litvis document with a function to load the data, here provided by the [Institute for Fiscal Studies](http://www.ifs.org.uk/tools_and_resources/incomes_in_uk).

````
```elm {l=hidden}
data : Data
data =
    dataFromUrl "https://gicentre.github.io/data/incomeInequality2017.csv" []
```
````

The data we are initially interested in are in the columns `Year`, `5pcIncome` and `95pcIncome`

---

_Next >>_ [narrative schemas](intro3.md)
