import type MarkdownIt from "markdown-it";

import { useNarrativeSchemaLabel } from "./use-narrative-schema-label";
import { useTripleHatReference } from "./use-triple-hat-reference";

export const useMarkdownItLitvisFeatures = (md: MarkdownIt, config: any) => {
  useNarrativeSchemaLabel(md);
  useTripleHatReference(md);
};
