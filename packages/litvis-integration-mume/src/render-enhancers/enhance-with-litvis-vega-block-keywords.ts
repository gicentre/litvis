import type { BlockInfo } from "block-info";
import type { AnyNode, Cheerio, CheerioAPI } from "cheerio";
import type { LitvisNarrative } from "litvis";
import { extractAttributeDerivatives } from "litvis";
import YAML from "yamljs";

import type { LitvisEnhancerCache } from "../types";

/**
 * Search for all vega and vega-lite blocks and
 * apply v, r and j keywords to them just as if it works for ```elm
 * @param $
 * @param processedNarrative
 * @param cache
 */
export const enhanceWithLitvisVegaBlockKeywords = async (
  $: CheerioAPI,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
): Promise<void> => {
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const info: BlockInfo = $container.data("parsedInfo") as BlockInfo;
    if (!info) {
      return;
    }
    const normalizedInfo: BlockInfo = $container.data(
      "normalizedInfo",
    ) as BlockInfo;
    if (
      normalizedInfo.language !== "vega" &&
      normalizedInfo.language !== "vega-lite"
    ) {
      return;
    }

    const derivatives = extractAttributeDerivatives(info.attributes);
    if (!derivatives) {
      return;
    }

    const text = $container.text();
    const spec = text.trim();
    let data: any;
    let dataParseError: unknown;
    try {
      if (spec[0] !== "{") {
        data = YAML.parse(spec);
      } else {
        data = JSON.parse(spec);
      }
    } catch (error) {
      dataParseError = error;
    }

    // const arrayOf$results = [];
    derivatives.outputFormats.forEach((outputFormat) => {
      if (
        outputFormat !== "l" &&
        derivatives.outputExpressionsByFormat[outputFormat]
      ) {
        return;
      }
      let $result: Cheerio<AnyNode> | undefined;
      let resultNormalizedInfo: (BlockInfo & { style?: string }) | undefined;
      let resultText;
      switch (outputFormat) {
        case "r":
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: "",
            attributes: {},
            style: "display: inline-block",
          };
          resultText = text;
          break;
        case "j":
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: "json",
            attributes: {},
            style: "display: inline-block",
          };

          if (dataParseError) {
            resultText = (dataParseError as Error).message;
          } else {
            resultText = JSON.stringify(data, null, 2);
          }
          break;
        case "v": {
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: normalizedInfo.language,
            attributes: {
              interactive: normalizedInfo.attributes["interactive"],
              style: "display: inline-block",
            },
          };
          resultText = text;
          break;
        }
      }
      if (!$result || typeof resultText !== "string" || !resultNormalizedInfo) {
        return;
      }
      // const stringifiedNormalizedInfo = JSON.stringify(resultNormalizedInfo);
      $result.text(resultText);
      $result.data("normalizedInfo", resultNormalizedInfo);
      $container.before($result);
    });
    $container.remove();
  });
};
