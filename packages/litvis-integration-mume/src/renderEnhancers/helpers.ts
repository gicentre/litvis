import { JsonObject } from "type-fest";

export interface MarkdownEngineRenderOption {
  useRelativeFilePath: boolean;
  isForPreview: boolean;
  hideFrontMatter: boolean;
  triggeredBySave?: boolean;
  runAllCodeChunks?: boolean;
  emojiToSvg?: boolean;
  vscodePreviewPanel?: unknown;
  fileDirectoryPath?: string;
}

export interface MarkdownEngineOutput {
  html: string;
  markdown: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
  tocHTML: string;
  yamlConfig: JsonObject;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
  JSAndCssFiles: string[];
}

export type ParseMd = (
  inputString: string,
  options: MarkdownEngineRenderOption,
) => Promise<MarkdownEngineOutput>;
