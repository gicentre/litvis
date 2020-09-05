import MarkdownIt from "markdown-it";

import useNarrativeSchemaLabel from "./narrativeSchemaLabel";
import useTripleHatReference from "./tripleHatReference";

export default (md: MarkdownIt, config: any) => {
  useNarrativeSchemaLabel(md);
  useTripleHatReference(md);
};
