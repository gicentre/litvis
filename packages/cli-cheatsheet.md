# CLI cheatsheet

## Publishing litvis packages manually if `lerna publish` has failed

```sh
## one-time password for two-factor auth
export NPM_CONFIG_OTP=??

yarn lerna exec npm publish
```

## Registering litvis packages using `yarn link` for local development

```sh
yarn lerna exec yarn link

## to unregister
# yarn lerna exec --no-bail yarn unlink
```

## Using local versions of

```sh
yarn link block-attributes
yarn link block-info
yarn link data-with-position
yarn link elm-string-representation
yarn link literate-elm
yarn link litvis
yarn link litvis-integration-mume
yarn link narrative-schema
yarn link narrative-schema-common
yarn link narrative-schema-label
yarn link narrative-schema-rule
yarn link narrative-schema-styling
```
