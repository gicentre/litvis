import { LitvisNarrative } from "litvis";
import _ from "lodash";
import { getLabelIdPrefix, LabelNode } from "narrative-schema-label";
import { getCssChunks } from "narrative-schema-styling";
import { selectAll } from "unist-util-select";

import { LitvisEnhancerCache } from "../types";

const markLabelAsErroneous = ($el: Cheerio, message) => {
  $el.children().attr("style", "background: #fdd");
  $el.attr("title", message);
};

export const enhanceWithLitvisNarrativeSchemas = async (
  $: CheerioStatic,
  processedNarrative: LitvisNarrative,
  cache: LitvisEnhancerCache,
): Promise<void> => {
  // add styling from narrative schema
  const arrayOf$StyleTags: Cheerio[] = [];
  if (processedNarrative.composedNarrativeSchema) {
    arrayOf$StyleTags.push(
      ...getCssChunks(processedNarrative.composedNarrativeSchema).map(
        (cssChunk) => {
          const $tag = $("<style />");
          $tag.text(
            `\n/* narrative schema: ${cssChunk.comment} */\n${cssChunk.content}`,
          );
          return $tag;
        },
      ),
    );
  }
  if (arrayOf$StyleTags.length) {
    $("head").prepend("", ...arrayOf$StyleTags);
  }

  const labelNodesInAst = selectAll(
    "narrativeSchemaLabel",
    processedNarrative.combinedAst || { type: "", children: [] },
  ) as LabelNode[];
  const labelNodeInAstById = _.keyBy(
    labelNodesInAst,
    (node) => `${node.data.id}`,
  );

  const labelIdPrefix = getLabelIdPrefix(
    processedNarrative.documents[processedNarrative.documents.length - 1],
  );
  let labelIdIndex = 0;

  $('[data-role="litvis:narrative-schema-label"]').each((i, el) => {
    const labelId = `${labelIdPrefix}-${labelIdIndex}`;
    labelIdIndex += 1;

    const $el = $(el);
    const labelNodeInAst = labelNodeInAstById[labelId];

    if (!labelNodeInAst) {
      markLabelAsErroneous(
        $el,
        "This label was not detected correctly by litivs-integration-mume. Please report a bug at https://github.com/gicentre/litvis.",
      );
      return;
    }

    if (labelNodeInAst.data.errorType) {
      markLabelAsErroneous(
        $el,
        labelNodeInAst.data.errorCaption || "Syntax error",
      );
      return;
    }

    $el.replaceWith(
      $("<litvis-narrative-schema-label/>").text(
        labelNodeInAst.data.html || "",
      ),
    );
  });
};
