import { stat } from "fs-extra";
import * as _ from "lodash";
import { resolve } from "path";
import { read as readVFile } from "to-vfile";
import * as vfile from "vfile";
import { LitvisNarrative } from ".";
import { Cache } from "../cache";
import { LitvisDocument, parse as parseDocument } from "../document";

const MAX_CHAIN_LENGTH = 10;

export default async (
  filePath: string,
  filesInMemory: Array<vfile.VFile<{}>> = [],
  cache: Cache,
): Promise<LitvisNarrative> => {
  // build a chain of files [0]: root,
  const files: LitvisDocument[] = [];
  let currentFilePath = filePath;
  try {
    do {
      if (files.length === MAX_CHAIN_LENGTH) {
        files[files.length - 1].fail(
          `Too many documents to follow. Please reorganise your narrative by chaining maximum ${MAX_CHAIN_LENGTH} documents.`,
          null,
          "litvis:cross-document",
        );
        break;
      }
      const fileInMemory = _.find(
        filesInMemory,
        (f: LitvisDocument) => f.path === currentFilePath,
      );
      const file: LitvisDocument = fileInMemory
        ? vfile(fileInMemory)
        : await readVFile(currentFilePath, "utf8");
      files.unshift(file);
      await parseDocument(file);
      currentFilePath = file.data.litvisFollows
        ? resolve(file.dirname, file.data.litvisFollows)
        : null;
      if (currentFilePath) {
        if (!currentFilePath.match(/\.md$/i)) {
          currentFilePath = `${currentFilePath}.md`;
        }
        let fileStat;
        try {
          fileStat = await stat(currentFilePath);
        } catch (e) {
          file.fail(
            `Document to follow ‘${file.data.litvisFollows}’ does not exist`,
            null,
            "litvis:cross-document",
          );
        }
        if (!fileStat.isFile()) {
          file.fail(
            `Document to follow ‘${file.data.litvisFollows}’ is not a file`,
            null,
            "litvis:cross-document",
          );
        }
        if (currentFilePath === file.path) {
          files[files.length - 1].fail(
            `Litvis document cannot follow itself.`,
            null,
            "litvis:cross-document",
          );
        }
        const sameFileInChain = _.find(
          files,
          (f) => f.path === currentFilePath,
        );
        if (sameFileInChain) {
          const fileNames = _.reverse(_.map(files, (f) => f.path));
          fileNames.push(currentFilePath);
          files[files.length - 1].fail(
            `Documents are not allowed to follow each other in a cycle ${fileNames.join(
              " → ",
            )} .`,
            null,
            "litvis:cross-document",
          );
        }
      }
    } while (currentFilePath);
  } catch (e) {
    // FIXME: add a single vfile to the list of returned files
    // if the first file does not exist
    if (!e.location /* not a VFileMessage */) {
      try {
        files[files.length - 1].fail(e.message);
      } catch (e2) {
        // this try/catch is just needed to block throwing in .fail()
      }
    }
  }
  return {
    files,
  };
};
