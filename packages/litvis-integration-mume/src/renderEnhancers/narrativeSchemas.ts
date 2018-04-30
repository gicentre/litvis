// import * as _ from "lodash";
// import { BlockInfo } from "block-info";
// import { LabelType } from "narrative-schema-label";
import { LitvisNarrative } from "litvis";
import { getCssChunks } from "narrative-schema-styling";
import { LitvisEnhancerCache } from "../types";

export default async function enhance(
  $: CheerioStatic,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
) {
  // add styling from narrative schema
  const arrayOf$StyleTags: Cheerio[] = [];
  if (processedNarrative.composedNarrativeSchema) {
    arrayOf$StyleTags.push(
      ...getCssChunks(processedNarrative.composedNarrativeSchema).map(
        (cssChunk) => {
          const $tag = $("<style />");
          $tag.text(
            `\n/* narrative schema: ${cssChunk.comment} */\n${cssChunk}`,
          );
          return $tag;
        },
      ),
    );
  }
  if (arrayOf$StyleTags.length) {
    $.root().prepend("", ...arrayOf$StyleTags);
  }

  // $('[data-role="litvis:narrative-schema-label"]').each((i, el) => {
  //   const $el = $(el);
  //   const labelType: LabelType = $el.data("labelType");
  //   if (labelType === LabelType.INVALID) {
  //     markLabelAsErroneous(
  //       $el,
  //       "The label is neither single nor paired, please change the endings.",
  //     );
  //     return;
  //   }
  //   const info: BlockInfo = $el.data("parsedInfo");
  //   const labelName = info.language;
  //   const labelAttributes = info.attributes;
  //   if (labelType === LabelType.PAIRED_CLOSING && !_.isEmpty(labelAttributes)) {
  //     markLabelAsErroneous(
  //       $el,
  //       "A closing paired label cannot have attributes.",
  //     );
  //     return;
  //   }

  //   const labelDefinition =
  //     processedNarrative.composedNarrativeSchema &&
  //     processedNarrative.composedNarrativeSchema.labelsByName[labelName];

  //   if (!labelDefinition) {
  //     markLabelAsErroneous(
  //       $el,
  //       `Unknown label name ‘${labelName}’. Please add a dependency to a narrative schema that describes this label.`,
  //     );
  //     return;
  //   }

  //   if (labelType === LabelType.SINGLE) {
  //     if (!labelDefinition.data.single) {
  //       markLabelAsErroneous(
  //         $el,
  //         `‘${labelName}’ cannot be used as single (no-paired) label`,
  //       );
  //       return;
  //     }
  //     const htmlTemplate = labelDefinition.data.single.htmlTemplate;
  //     const html = renderHtmlTemplate(
  //       htmlTemplate,
  //       labelName,
  //       labelType,
  //       info.attributes,
  //     );
  //     $el.replaceWith($("<litvis-narrative-schema-label/>").text(html));
  //   } else {
  //     if (!labelDefinition.data.paired) {
  //       markLabelAsErroneous(
  //         $el,
  //         `‘${labelName}’ cannot be used as paired label`,
  //       );
  //       return;
  //     }
  //     const htmlTemplate = labelDefinition.data.paired.htmlTemplate;
  //     const html = renderHtmlTemplate(
  //       htmlTemplate,
  //       labelName,
  //       labelType,
  //       info.attributes,
  //     );
  //     $el.replaceWith($("<litvis-narrative-schema-label/>").text(html));
  //   }
  // });
}

// const markLabelAsErroneous = ($el: Cheerio, message) => {
//   $el.attr("style", "background: #fdd");
//   $el.attr("title", message);
// };
