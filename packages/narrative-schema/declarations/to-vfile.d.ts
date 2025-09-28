declare module "to-vfile" {
  import type { VFile } from "vfile";

  function read(path: string, encoding: string): Promise<VFile>;
}
