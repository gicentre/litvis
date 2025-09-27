import type { JsonObject } from "type-fest";

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
  tocHTML: string;
  yamlConfig: JsonObject;
  JSAndCssFiles: string[];
}

export type ParseMd = (
  inputString: string,
  options: MarkdownEngineRenderOption,
) => Promise<MarkdownEngineOutput>;
