import * as _ from "lodash";
import * as visit from "unist-util-visit";
import { LitvisDocument } from "../document";
import {
  ComposedNarrativeSchema,
  LabelType,
  LabelWithOrigin,
} from "../narrative-schema";
import renderHtmlTemplate from "./render-html-template";

function visitNarrativeSchemaLabel(
  ast,
  vFile: LitvisDocument,
  labelsByName: { [name: string]: LabelWithOrigin },
) {
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
    if (labelNode.data.syntaxError) {
      return;
    }

    const labelType = labelNode.data.labelType;
    const labelName = labelNode.data.labelName;
    const labelAttributes = labelNode.data.labelAttributes;

    const label = labelsByName[labelName];
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
}

export default (composedNarrativeSchema: ComposedNarrativeSchema) => () => {
  const labelsByName = _.keyBy(
    composedNarrativeSchema.labels,
    (label) => label.name,
  );
  return function transformer(ast, vFile, next) {
    visitNarrativeSchemaLabel(ast, vFile, labelsByName);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
};
