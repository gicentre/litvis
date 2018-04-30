// import * as _ from "lodash";
import { EntityDefinition } from "narrative-schema-common";
import * as visit from "unist-util-visit";
import { VFile } from "vfile";
import renderHtmlTemplate from "../renderHtmlTemplate";
import { LabelType } from "../types";

export default (
  ast,
  vFile: VFile<any>,
  labelDefinitionsByName: { [name: string]: EntityDefinition },
) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
    if (labelNode.data.syntaxError) {
      return;
    }

    const labelType = labelNode.data.labelType;
    const labelName = labelNode.data.labelName;
    const labelAttributes = labelNode.data.labelAttributes;

    const labelDefinition = labelDefinitionsByName[labelName];
    if (!labelDefinition) {
      vFile.message(
        `Label ${labelName} cannot be used because it does not exist in the linked narrative schemas or is not valid.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }

    if (labelType === LabelType.SINGLE) {
      if (!labelDefinition.data.single) {
        vFile.message(
          `Label ${labelName} cannot be used as single (no-paired), according to the linked narrative schemas.`,
          labelNode,
          "litvis:narrative-schema-label",
        );
        return;
      }
      try {
        const html = renderHtmlTemplate(
          labelDefinition.data.single.htmlTemplate,
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

    if (!labelDefinition.data.paired) {
      vFile.message(
        `Label ${labelName} cannot be used as paired, according to the linked narrative schemas.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }

    try {
      const html = renderHtmlTemplate(
        labelDefinition.data.paired.htmlTemplate,
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
