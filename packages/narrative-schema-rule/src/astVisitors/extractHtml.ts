// import * as _ from "lodash";
import * as visit from "unist-util-visit";
import { VFile } from "vfile";
import renderHtmlTemplate from "../renderHtmlTemplate";
import { LabelDefinition, LabelType } from "../types";

export default (
  ast,
  vFile: VFile<any>,
  labelDefinitionsByName: { [name: string]: LabelDefinition },
) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
    if (labelNode.data.syntaxError) {
      return;
    }

    const labelType = labelNode.data.labelType;
    const labelName = labelNode.data.labelName;
    const labelAttributes = labelNode.data.labelAttributes;

    const label = labelDefinitionsByName[labelName];
    if (!label) {
      vFile.message(
        `Label ${labelName} cannot be used because it does not exist in the linked narrative schemas or is not valid.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }

    if (labelType === LabelType.SINGLE) {
      if (!label.single) {
        vFile.message(
          `Label ${labelName} cannot be used as single (no-paired), according to the linked narrative schemas.`,
          labelNode,
          "litvis:narrative-schema-label",
        );
        return;
      }
      try {
        const html = renderHtmlTemplate(
          label.single.htmlTemplate,
          labelName,
          labelType,
          labelAttributes,
        );
        labelNode.data.html = html;
      } catch (e) {
        vFile.message(
          `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
          labelNode,
          "litvis:narrative-schema-label",
        );
      }
      return;
    }

    if (!label.paired) {
      vFile.message(
        `Label ${labelName} cannot be used as paired, according to the linked narrative schemas.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }

    try {
      const html = renderHtmlTemplate(
        label.paired.htmlTemplate,
        labelName,
        labelType,
        labelAttributes,
      );
      labelNode.data.html = html;
    } catch (e) {
      vFile.message(
        `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
        labelNode,
        "litvis:narrative-schema-label",
      );
    }
  });
};
