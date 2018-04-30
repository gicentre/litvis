import { loadAndProcessLitvisNarrative } from "litvis";
import * as toVFile from "to-vfile";
import { VFile, VFileBase } from "vfile";
import { LitvisEnhancerCache } from "../types";
import enhanceWithLitvisLiterateElm from "./literateElm";
import enhanceWithLitvisNarrativeSchemas from "./narrativeSchemas";
import enhanceWithLitvisVegaBlockKeywords from "./vegaBlockKeywords";

// export * from "../types";

export default async function enhance(
  $: CheerioStatic,
  fileContents: string,
  filePath: string,
  cache: LitvisEnhancerCache,
  updateLintingReport: (vFiles: Array<VFile<{}>>) => void,
) {
  // process current file with litvis
  // TODO: pass all unsaved Atom files as virtual files
  const processedNarrative = await loadAndProcessLitvisNarrative(
    filePath,
    [
      toVFile({
        path: filePath,
        contents: fileContents,
      }),
    ],
    cache.litvisCache,
  );

  const vFilesToReport: Array<VFileBase<any>> = [
    ...processedNarrative.documents,
  ];
  if (processedNarrative.composedNarrativeSchema) {
    vFilesToReport.push(
      ...processedNarrative.composedNarrativeSchema.components,
    );
  }
  updateLintingReport(vFilesToReport);

  await enhanceWithLitvisNarrativeSchemas($, processedNarrative, cache);
  await enhanceWithLitvisLiterateElm($, processedNarrative, cache);
  await enhanceWithLitvisVegaBlockKeywords($, processedNarrative, cache);
}
