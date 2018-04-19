import * as _ from "lodash";

import { BlockInfo } from "../../lib/block-info/index";
import { LitvisNarrative } from "../../lib/litvis/narrative";
import { renderHtmlTemplate } from "../../lib/litvis/narrative-schema-label";
import { LabelType } from "../../lib/litvis/narrative-schema/types";
import { LitvisEnhancerCache } from "./types";

export default async function enhance(
  $: CheerioStatic,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
) {
  // add schema narrative styling
  const arrayOf$StyleTags = [];
  _.forEach(processedNarrative.composedNarrativeSchema.css, (composedCss) => {
    const $tag = $("<style />");
    $tag.text(
      `\n/* narrative schema: ${composedCss.origin.path} */\n${
        composedCss.content
      }`,
    );
    arrayOf$StyleTags.push($tag);
  });
  if (arrayOf$StyleTags.length) {
    $.root().prepend("", ...arrayOf$StyleTags);
  }

  $('[data-role="litvis:narrative-schema-label"]').each((i, el) => {
    const $el = $(el);
    const labelType: LabelType = $el.data("labelType");
    if (labelType === LabelType.INVALID) {
      markLabelAsErroneous(
        $el,
        "The label is neither single nor paired, please change the endings.",
      );
      return;
    }
    const info: BlockInfo = $el.data("parsedInfo");
    const labelName = info.language;
    const labelAttributes = info.attributes;
    if (labelType === LabelType.PAIRED_CLOSING && !_.isEmpty(labelAttributes)) {
      markLabelAsErroneous(
        $el,
        "A closing paired label cannot have attributes.",
      );
      return;
    }

    const labelInSchema = _.find(
      processedNarrative.composedNarrativeSchema.labels,
      (currentLabel) => currentLabel.name === labelName,
    );

    if (!labelInSchema) {
      markLabelAsErroneous(
        $el,
        `Unknown label name ‘${labelName}’. Please add a dependency to a narrative schema that describes this label.`,
      );
      return;
    }

    if (labelType === LabelType.SINGLE) {
      if (!labelInSchema.single) {
        markLabelAsErroneous(
          $el,
          `‘${labelName}’ cannot be used as single (no-paired) label`,
        );
        return;
      }
      const htmlTemplate = labelInSchema.single.htmlTemplate;
      const html = renderHtmlTemplate(
        htmlTemplate,
        labelName,
        labelType,
        info.attributes,
      );
      $el.replaceWith($("<litvis-narrative-schema-label/>").text(html));
    } else {
      if (!labelInSchema.paired) {
        markLabelAsErroneous(
          $el,
          `‘${labelName}’ cannot be used as paired label`,
        );
        return;
      }
      const htmlTemplate = labelInSchema.paired.htmlTemplate;
      const html = renderHtmlTemplate(
        htmlTemplate,
        labelName,
        labelType,
        info.attributes,
      );
      $el.replaceWith($("<litvis-narrative-schema-label/>").text(html));
    }
  });
}

const markLabelAsErroneous = ($el: Cheerio, message) => {
  $el.attr("style", "background: #fdd");
  $el.attr("title", message);
};
