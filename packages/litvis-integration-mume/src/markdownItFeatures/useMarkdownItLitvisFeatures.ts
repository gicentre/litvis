import type MarkdownIt from "markdown-it";

import { useNarrativeSchemaLabel } from "./useNarrativeSchemaLabel";
import { useTripleHatReference } from "./useTripleHatReference";

export const useMarkdownItLitvisFeatures = (md: MarkdownIt, config: any) => {
  useNarrativeSchemaLabel(md);
  useTripleHatReference(md);
};
