import * as YAML from "yamljs";

import { BlockInfo } from "block-info";
import {
  BlockOutputFormat,
  extractAttributeDerivatives,
  LitvisNarrative,
} from "litvis";
import { LitvisEnhancerCache } from "../types";

/**
 * Search for all vega and vega-lite blocks and
 * apply v, r and j keywords to them just as if it works for ```elm
 * @param $
 * @param processedNarrative
 * @param cache
 */
export default async function enhance(
  $: CheerioStatic,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
) {
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const info: BlockInfo = $container.data("parsedInfo");
    if (!info) {
      return;
    }
    const normalizedInfo: BlockInfo = $container.data("normalizedInfo");
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
    let data;
    let dataParseError;
    try {
      if (spec[0] !== "{") {
        data = YAML.parse(spec);
      } else {
        data = JSON.parse(spec);
      }
    } catch (e) {
      dataParseError = e;
    }

    // const arrayOf$results = [];
    derivatives.outputFormats.forEach((outputFormat) => {
      if (derivatives.outputExpressionsByFormat[outputFormat]) {
        return;
      }
      let $result;
      let resultNormalizedInfo;
      let resultText;
      switch (outputFormat) {
        case BlockOutputFormat.R:
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: "",
            attributes: {},
            style: "display: inline-block",
          };
          resultText = text;
          break;
        case BlockOutputFormat.H:
          try {
            $result = $(data);
          } catch (e) {
            $result = $(`<pre data-role="codeBlock" />`);
            resultNormalizedInfo = {
              language: "",
              attributes: {},
              style: "display: inline-block",
            };
            resultText = e.message;
          }
          break;
        case BlockOutputFormat.J:
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: "json",
            attributes: {},
            style: "display: inline-block",
          };

          if (dataParseError) {
            resultText = dataParseError.message;
          } else {
            resultText = JSON.stringify(data, null, 2);
            break;
          }
        case BlockOutputFormat.V: {
          $result = $(`<pre data-role="codeBlock" />`);
          resultNormalizedInfo = {
            language: normalizedInfo.language,
            attributes: {
              interactive: normalizedInfo.attributes.interactive,
              style: "display: inline-block",
            },
          };
          resultText = text;
          break;
        }
      }
      if (!$result) {
        return;
      }
      const stringifiedNormalizedInfo = JSON.stringify(resultNormalizedInfo);
      $result.text(resultText);
      $result.data("normalizedInfo", stringifiedNormalizedInfo);
      $container.before($result);
    });
    $container.remove();
  });
}
