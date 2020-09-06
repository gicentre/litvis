import { BlockAttributes } from "block-attributes";
import { load } from "cheerio";

// import { Position } from "data-with-position";
import { getCompiledHandlebarsTemplate } from "./getCompiledHandlebarsTemplate";
import { LabelType } from "./types";

const FAKE_CHILDREN_CONTENTS = "__FAKE_CHILDREN__";

export const renderHtmlTemplate = (
  htmlTemplate,
  labelName: string,
  labelType: LabelType,
  labelAttributes: BlockAttributes,
  // labelPosition: Position,
) => {
  const rawRenderedTemplate = getCompiledHandlebarsTemplate(htmlTemplate)({
    ...labelAttributes,
    children: FAKE_CHILDREN_CONTENTS,
  });
  const $ = load(rawRenderedTemplate);
  $("*").attr("ns-role", "label-child");
  $(":root")
    .attr("ns-role", "label")
    .attr("ns-label-name", labelName)
    // .attr("ns-position-start-line", labelPosition.start.line)
    // .attr("ns-position-start-column", labelPosition.start.column)
    // .attr("ns-position-end-column", labelPosition.end.column)
    // .attr("ns-position-end-line", labelPosition.end.line)
    .attr("ns-label-kind", labelType === "single" ? "single" : "paired");
  // .attr(
  //   "data-narrativeSchemaLabelAttributes",
  //   JSON.stringify(labelAttributes),
  // );
  const rawHtml = $.html();

  const positionOfFakeChildren = rawHtml.indexOf(FAKE_CHILDREN_CONTENTS);
  let html;
  if (labelType === "single") {
    if (positionOfFakeChildren !== -1) {
      throw new Error("Single label cannot have children");
    }
    html = rawHtml;
  } else {
    if (positionOfFakeChildren === -1) {
      throw new Error("Paired label must have children");
    }
    if (labelType === "paired_opening") {
      html = rawHtml.substr(0, positionOfFakeChildren);
    } else {
      html = rawHtml.substr(
        positionOfFakeChildren + FAKE_CHILDREN_CONTENTS.length,
      );
    }
  }
  return html;
};
