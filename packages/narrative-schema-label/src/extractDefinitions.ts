// @ts-ignore
import { NarrativeSchemaData } from "narrative-schema-common";
// @ts-ignore
import { VFileBase } from "vfile";

import {
  DataWithPosition,
  getKind,
  getPosition,
  getValue,
} from "data-with-position";
import * as _ from "lodash";
import {
  EntityDefinition,
  extractArrayOfEntities,
  NarrativeSchema,
} from "narrative-schema-common";
import getCompiledHandlebarsTemplate from "./getCompiledHandlebarsTemplate";

export default (
  dataWithPosition: DataWithPosition,
  narrativeSchema: NarrativeSchema,
): EntityDefinition[] =>
  extractArrayOfEntities(
    narrativeSchema,
    dataWithPosition,
    "labels",
    "label",
    extractDataFromLabel,
    {
      name: "",
      aliasFor: "",
      paired: { htmlTemplate: "" },
      single: { htmlTemplate: "" },
    },
  );

const extractDataFromLabel = (
  narrativeSchema,
  labelDataWithPosition,
  labelDataPath,
) => {
  let labelData: any = {};

  // ensure name exists
  const nameWithPosition = labelDataWithPosition.name;
  const kindOfName = getKind(nameWithPosition);
  if (kindOfName === "null" || kindOfName === "undefined") {
    narrativeSchema.message(
      `Expected label name to be defined as a string`,
      getPosition(nameWithPosition || labelDataWithPosition),
      "narrative-schema:label",
    );
  } else if (kindOfName !== "string") {
    narrativeSchema.message(
      `Expected label name to be a string, got ${kindOfName}`,
      getPosition(nameWithPosition),
      "narrative-schema:label",
    );
  } else {
    const name = getValue(nameWithPosition);
    if (!isValidLabelName(name)) {
      narrativeSchema.message(
        `Expected label name to have a form of an identifier (i.e. to consist of latin characters, numbers or _)`,
        getPosition(nameWithPosition),
        "narrative-schema:label",
      );
    } else {
      labelData.name = name;
    }
  }

  ["single", "paired"].forEach((labelKind) => {
    const htmlTemplateWithPosition = _.get(labelDataWithPosition, [
      labelKind,
      "htmlTemplate",
    ]);
    const kindOfHtmlTemplate = getKind(htmlTemplateWithPosition);
    if (kindOfHtmlTemplate === "null" || kindOfHtmlTemplate === "undefined") {
      return;
    }
    if (kindOfHtmlTemplate !== "string") {
      narrativeSchema.message(
        `Expected htmlTemplate to be a string, got ${kindOfHtmlTemplate}`,
        getPosition(htmlTemplateWithPosition),
        "narrative-schema:label",
      );
    }
    try {
      const htmlTemplate = getValue(htmlTemplateWithPosition);
      getCompiledHandlebarsTemplate(htmlTemplate);
      labelData[labelKind] = {
        htmlTemplate,
      };
    } catch (e) {
      narrativeSchema.message(
        `Provided htmlTemplate is a valid handlebars template, please check its syntax`,
        getPosition(htmlTemplateWithPosition),
        "narrative-schema:label",
      );
    }
  });

  const kindOfAliasFor = getKind(labelDataWithPosition.aliasFor);
  if (kindOfAliasFor !== "null" && kindOfAliasFor !== "undefined") {
    if (kindOfAliasFor !== "string") {
      narrativeSchema.message(
        `Expected aliasFor to be a string, got ${kindOfAliasFor}`,
        getPosition(labelDataWithPosition.aliasFor),
        "narrative-schema:label",
      );
    } else {
      const aliasFor = getValue(labelDataWithPosition.aliasFor);
      if (!isValidLabelName(aliasFor)) {
        narrativeSchema.message(
          `Expected aliasFor to have a form of an identifier (i.e. to consist of latin characters, numbers or _)`,
          getPosition(labelDataWithPosition.aliasFor),
          "narrative-schema:label",
        );
      } else {
        labelData.aliasFor = aliasFor;
      }
    }
  }

  if ((labelData.paired || labelData.single) && labelData.aliasFor) {
    narrativeSchema.message(
      `It is not allowed to declare a label as single or paired when it is an alias`,
      getPosition(labelDataWithPosition),
      "narrative-schema:label",
    );
    labelData = null;
  }

  if (!labelData.paired && !labelData.single && !labelData.aliasFor) {
    narrativeSchema.message(
      `Label should be declared as single, paired or aliasFor`,
      getPosition(labelDataWithPosition),
      "narrative-schema:label",
    );
    labelData = null;
  }

  if (!labelData || !labelData.name) {
    return null;
  }
  return labelData;
};

const isValidLabelName = (name: string): boolean =>
  !!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);
