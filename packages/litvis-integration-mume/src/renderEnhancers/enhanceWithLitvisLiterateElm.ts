import { BlockInfo } from "block-info";
import cheerio from "cheerio";
import { Html5Entities } from "html-entities";
import {
  AttributeDerivatives,
  EvaluatedOutputExpression,
  extractAttributeDerivatives,
  LitvisNarrative,
  OutputFormat,
  ProcessedLitvisContext,
  resolveExpressions,
} from "litvis";
import _ from "lodash";
import hash from "object-hash";

import { LitvisEnhancerCache } from "../types";

const escapeString = new Html5Entities().encode;

const flattenJsonToRawMarkdown = (data: unknown): string => {
  if (data instanceof Array) {
    return data.map(flattenJsonToRawMarkdown).join(" ");
  }
  if (typeof data === "object" && data !== null) {
    return flattenJsonToRawMarkdown(Object.entries(data));
  }
  return `${data}`;
};

const generate$output = (arrayOf$outputItems) => {
  return cheerio(
    '<div data-role="litvisOutput" style="display: inline;" />',
  ).append("", ...arrayOf$outputItems);
};

const generateArrayOf$outputItems = (
  outputExpressions: string[],
  outputFormat: string,
  derivatives: AttributeDerivatives,
) => {
  return outputExpressions.map((outputExpression) => {
    const $outputItem = cheerio(
      `<span data-role="litvisOutputItem" data-context-name="${escapeString(
        derivatives.contextName,
      )}" data-expression="${escapeString(
        outputExpression,
      )}" data-interactive="${
        derivatives.interactive
      }" data-output-format="${escapeString(
        outputFormat,
      )}"><code>${escapeString(outputFormat)}=${escapeString(
        outputExpression,
      )}</code></span>`,
    );
    return $outputItem;
  });
};

const mapAutogeneratedContextNames = (
  litvisContextNames,
  mumeContextNames,
  autogeneratedPrefix,
) => {
  const autogeneratedLitvisContextNames = _.sortBy(
    _.filter(litvisContextNames, (name) =>
      _.startsWith(name, autogeneratedPrefix),
    ),
  );
  const autogeneratedMumeContextNames = _.sortBy(
    _.filter(mumeContextNames, (name) =>
      _.startsWith(name, autogeneratedPrefix),
    ),
  );

  const minLength = Math.min(
    autogeneratedLitvisContextNames.length,
    autogeneratedMumeContextNames.length,
  );
  const pickedAutogeneratedLitvisContextNames = _.slice(
    autogeneratedLitvisContextNames,
    -minLength,
  );
  const pickedAutogeneratedMumeContextNames = _.slice(
    autogeneratedMumeContextNames,
    -minLength,
  );

  const result = {
    // key - litvis context name
    // value - mume context name
  };
  _.forEach(litvisContextNames, (name) => {
    const index = _.indexOf(autogeneratedLitvisContextNames, name);
    if (index !== -1) {
      result[pickedAutogeneratedLitvisContextNames[index]] =
        pickedAutogeneratedMumeContextNames[index];
    } else {
      result[name] = name;
    }
  });
  return result;
};

export const enhanceWithLitvisLiterateElm = async (
  $: CheerioStatic,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
  parseMD,
): Promise<void> => {
  // search for all elm code blocks and surround them
  // with output items if they reference expressions to output
  const mumeContextNames: string[] = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const info: BlockInfo = $container.data("parsedInfo");
    if (`${info.language}`.toLowerCase() !== "elm") {
      return;
    }

    const derivatives = extractAttributeDerivatives(info.attributes);
    if (!derivatives) {
      return;
    }

    $container.data("executor", "litvis");
    if (derivatives.outputFormats.indexOf("l") === -1) {
      $container.data("hiddenByEnhancer", true);
    }
    mumeContextNames.push(derivatives.contextName);

    const derivativesWithResolvedExpressions = resolveExpressions(
      derivatives,
      $container.text(),
    );

    const arrayOf$outputItemsBeforeCodeBlock: Cheerio[] = [];
    const arrayOf$outputItemsAfterCodeBlock: Cheerio[] = [];
    let currentArrayOf$outputItems = arrayOf$outputItemsBeforeCodeBlock;
    derivativesWithResolvedExpressions.outputFormats.forEach((outputFormat) => {
      switch (outputFormat) {
        case "l":
          currentArrayOf$outputItems = arrayOf$outputItemsAfterCodeBlock;
          break;
        default:
          const expressions =
            derivativesWithResolvedExpressions.outputExpressionsByFormat[
              outputFormat
            ];
          if (expressions) {
            currentArrayOf$outputItems.push(
              ...generateArrayOf$outputItems(
                expressions,
                outputFormat,
                derivativesWithResolvedExpressions,
              ),
            );
          }
      }
    });

    if (arrayOf$outputItemsBeforeCodeBlock.length) {
      $container.before(generate$output(arrayOf$outputItemsBeforeCodeBlock));
    }
    if (arrayOf$outputItemsAfterCodeBlock.length) {
      $container.after(generate$output(arrayOf$outputItemsAfterCodeBlock));
    }
  });

  // search for all triple hat references and turn them into output items
  $('[data-role="litvis:triple-hat-reference"]').each((i, el) => {
    const $el = $(el);
    const info: BlockInfo = JSON.parse($el.attr("data-parsedinfo") || "");
    if (`${info.language}`.toLowerCase() !== "elm") {
      return;
    }

    const derivatives = extractAttributeDerivatives(info.attributes);
    if (!derivatives) {
      return;
    }

    const arrayOf$outputItems: Cheerio[] = [];
    derivatives.outputFormats.forEach((outputFormat) => {
      switch (outputFormat) {
        case "l":
          break;
        default:
          const expressions =
            derivatives.outputExpressionsByFormat[outputFormat];
          if (expressions) {
            arrayOf$outputItems.push(
              ...generateArrayOf$outputItems(
                expressions,
                outputFormat,
                derivatives,
              ),
            );
          }
      }
    });
    $el.replaceWith(generate$output(arrayOf$outputItems));
  });

  // Some context names in sidings are autogenerated by litvis,
  // but their ids may not match ids autogenerated by mume.
  // Because it is known that the number of contexts starting with '_autogenerated__X' match
  // And X is incremental, is possible to generate a mapping between lit names.
  const litvisContextNameToMumeContextName = mapAutogeneratedContextNames(
    _.map(processedNarrative.contexts, "name"),
    _.uniq(mumeContextNames),
    "_autogenerated__",
  );
  const contextsByMumeContextName = _.keyBy<ProcessedLitvisContext>(
    processedNarrative.contexts,
    ({ name }) => litvisContextNameToMumeContextName[name],
  );

  // walk through all litvis output items and render them
  const $outputItems = $('[data-role="litvisOutputItem"]');
  const mappedOutputItems = $outputItems.map(async (i, el) => {
    const $el = $(el);
    const contextName = $el.data("contextName");
    const outputFormat: OutputFormat | undefined = $el.data("outputFormat");
    const expressionText = $el.data("expression");
    const interactive = $el.data("interactive");
    const renderKey = hash({
      contextName,
      outputFormat,
      expressionText,
      path:
        processedNarrative.documents[processedNarrative.documents.length - 1]
          .path,
    });
    const context = contextsByMumeContextName[
      contextName
    ] as ProcessedLitvisContext;
    // const evaluatedOutputExpressionsByText = keyBy(context.evaluatedOutputExpressions, oe => oe.data.text);
    try {
      if (!context) {
        throw new Error(`Non-existing context ${contextName}`);
      }
      if (context.status !== "succeeded") {
        throw new Error(
          `Code execution in context ${contextName} was not successful`,
        );
      }
      // TODO: find() is expensive, consider optimizing by indexing
      const evaluatedOutputExpression:
        | EvaluatedOutputExpression
        | undefined = _.find(
        context.evaluatedOutputExpressions,
        (oe) => oe.data.text === expressionText,
      );
      if (!evaluatedOutputExpression) {
        throw new Error(`Could not find expression ${expressionText}`);
      }
      if (
        typeof evaluatedOutputExpression.data.valueStringRepresentation !==
        "string"
      ) {
        throw new Error(`Could not evaluate expression ${expressionText}`);
      }
      if (
        outputFormat !== "r" &&
        evaluatedOutputExpression.data.value instanceof Error
      ) {
        throw new Error(`Could not parse value of ${expressionText}`);
      }
      let $result: Cheerio;
      let resultNormalizedInfo: BlockInfo | null = null;
      switch (outputFormat) {
        case "r":
          $result = $("<span/>").text(
            evaluatedOutputExpression.data.valueStringRepresentation,
          );
          break;
        case "j":
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: "json",
            attributes: { style: "display: inline-block" },
          };

          $result.text(
            JSON.stringify(evaluatedOutputExpression.data.value, null, 2),
          );
          break;
        case "m":
          const rawMarkdown = flattenJsonToRawMarkdown(
            evaluatedOutputExpression.data.value,
          );
          const { html } = await parseMD(
            rawMarkdown.length ? rawMarkdown : " ", // parseMD accepts non-empty strings only
            {
              useRelativeFilePath: true,
              isForPreview: false,
              hideFrontMatter: true,
            },
          );
          $result = $(html);
          $result.filter("h1,h2,h3,h4,h5,h6").removeClass("mume-header");
          break;
        case "v": {
          const vegaOrVegaLiteJson = evaluatedOutputExpression.data.value;
          const language =
            _.get(vegaOrVegaLiteJson, "$schema", "")
              .toLowerCase()
              .indexOf("lite") !== -1
              ? "vega-lite"
              : "vega";
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language,
            attributes: {
              interactive: interactive === true,
              style: "display: inline-block",
            },
          };
          $result.text(JSON.stringify(vegaOrVegaLiteJson, null, 2));
          break;
        }
        default:
          return;
      }

      // because serializing/deserializing data attributes works inconsistently
      // in Cheerio, setting normalized info as attribute first...
      $result.attr(
        "data-normalized-info",
        JSON.stringify(resultNormalizedInfo),
      );
      cache.successfulRenders.set(
        renderKey,
        $("<div/>").append($result).html() || "",
      );
      // ...and then as data
      $result.removeAttr("data-normalized-info");
      $result.data("normalizedInfo", resultNormalizedInfo);
      $el.replaceWith($result);
    } catch (e) {
      const $error = $("<span/>").attr(
        "style",
        "background: rgba(255,200,200,0.1); min-height: 1em; min-width: 1em; display: inline-block;",
      );

      const successfulRender = cache.successfulRenders.get(renderKey);
      if (successfulRender) {
        const $successfulRender = $(successfulRender);
        const $fadedSuccessfulRender = $("<span />");
        $fadedSuccessfulRender.attr(
          "style",
          "opacity: 0.8; display: inline-block; filter: sepia(0.7) hue-rotate(-50deg);",
        );
        $fadedSuccessfulRender.append($successfulRender);
        $error.append($fadedSuccessfulRender);
      } else {
        const $errorText = $("<span/>").attr(
          "style",
          "color: red; padding: 0 0.3em; font-weight: bold; white-space: nowrap",
        );
        $errorText.text(
          `${outputFormat}=${expressionText}${
            contextName !== "default" ? ` [${contextName}]` : ``
          }`,
        );
        $error.append($errorText);
      }

      $error.attr(
        "title",
        `${outputFormat}=${expressionText}${
          contextName !== "default" ? ` [context ${contextName}]` : ``
        }: ${e.message}`,
      );
      $el.empty().append($error);
    }
  });
  await Promise.all(mappedOutputItems.get());
};