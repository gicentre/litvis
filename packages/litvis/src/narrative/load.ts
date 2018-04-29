import { stat } from "fs-extra";
import * as _ from "lodash";
import { resolve } from "path";
import { read as readVFile } from "to-vfile";
import * as vfile from "vfile";
import { parse as parseDocument } from "../document";
import { Cache, LitvisDocument, LitvisNarrative } from "../types";

const MAX_CHAIN_LENGTH = 10;

export default async (
  filePath: string,
  filesInMemory: Array<vfile.VFile<{}>> = [],
  cache: Cache,
): Promise<LitvisNarrative> => {
  // build a chain of files [0]: root,
  const documents: LitvisDocument[] = [];
  let currentFilePath = filePath;
  try {
    do {
      if (documents.length === MAX_CHAIN_LENGTH) {
        documents[documents.length - 1].fail(
          `Too many documents to follow. Please reorganise your narrative by chaining maximum ${MAX_CHAIN_LENGTH} documents.`,
          undefined,
          "litvis:cross-document",
        );
        break;
      }
      const fileInMemory = _.find(
        filesInMemory,
        (f: LitvisDocument) => f.path === currentFilePath,
      );
      const document: LitvisDocument = fileInMemory
        ? vfile(fileInMemory)
        : await readVFile(currentFilePath, "utf8");
      documents.unshift(document);
      await parseDocument(document);
      currentFilePath = document.data.litvisFollowsPath
        ? resolve(document.dirname || "", document.data.litvisFollowsPath)
        : "";
      if (currentFilePath) {
        if (!currentFilePath.match(/\.md$/i)) {
          currentFilePath = `${currentFilePath}.md`;
        }
        let fileStat;
        try {
          fileStat = await stat(currentFilePath);
        } catch (e) {
          document.fail(
            `Document to follow ‘${
              document.data.litvisFollowsPath
            }’ does not exist`,
            undefined,
            "litvis:cross-document",
          );
        }
        if (!fileStat.isFile()) {
          document.fail(
            `Document to follow ‘${
              document.data.litvisFollowsPath
            }’ is not a file`,
            undefined,
            "litvis:cross-document",
          );
        }
        if (currentFilePath === document.path) {
          documents[documents.length - 1].fail(
            `Litvis document cannot follow itself.`,
            undefined,
            "litvis:cross-document",
          );
        }
        const sameFileInChain = _.find(
          documents,
          (f) => f.path === currentFilePath,
        );
        if (sameFileInChain) {
          const fileNames = _.reverse(_.map(documents, (f) => f.path));
          fileNames.push(currentFilePath);
          documents[documents.length - 1].fail(
            `Documents are not allowed to follow each other in a cycle ${fileNames.join(
              " → ",
            )} .`,
            undefined,
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
        documents[documents.length - 1].fail(e.message);
      } catch (e2) {
        // this try/catch is just needed to block throwing in .fail()
      }
    }
  }
  return {
    documents,
  };
};
