---
id: litvis
---

# Caching Test

The following function should take about 8 seconds to complete when evaluated. In theory, it should be effectively instant if relying on a cached version.

```elm {r}
expensiveFunction : Float
expensiveFunction =
    List.range 1 40000002
        |> List.foldl (\n acc -> sqrt (acc + toFloat n)) 0
```

If some markdown is edited, such as this line, it should not force a re-evaluation of the expensive function so the regeneration of the preview should be effectively instant.
