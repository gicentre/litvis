declare module "to-vfile" {
  import { VFile } from "vfile";

  function read(path: string, encoding: string): Promise<VFile>;
}
