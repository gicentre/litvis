# Console Output Test

```elm {l}
echoToConsole : String -> String -> String
echoToConsole formatOutput consoleOutput =
    formatOutput |> Debug.log consoleOutput


consoleOnly : String -> String
consoleOnly consoleOutput =
    let
        _ =
            Debug.log "consoleOnly" consoleOutput
    in
    ""
```

This should generate both formatted output in the preview window and console output that also echos the formatted output in the linter window.

^^^elm r=(echoToConsole "Formatted output here" "Console output here")^^^

This should generate console output only with an empty string displayed in preview window.

^^^elm r=(consoleOnly "Hello from the console")^^^

> JWO: We might expect console output messages to appear in the same order that the functions above generate them, but currently they do not.
