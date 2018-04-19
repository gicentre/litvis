import * as _ from "lodash";
import * as visit from "unist-util-visit";
import { LitvisNarrative } from ".";
import { CodeBlockWithFile, ProcessedLitvisContext } from "..";
import { Cache } from "../cache";
import {
  ensureEnvironment,
  EnvironmentStatus,
  ProgramResult,
  runProgram,
} from "literate-elm";

export default async (
  narrative: LitvisNarrative,
  cache: Cache,
): Promise<void> => {
  const lastFile = _.last(narrative.files);
  if (!lastFile) {
    return;
  }
  try {
    const literateElmEnvironment = await ensureEnvironment(
      narrative.elmEnvironmentSpecForLastFile,
      cache.literateElmDirectory,
    );

    if (literateElmEnvironment.metadata.status !== EnvironmentStatus.READY) {
      lastFile.fail(
        literateElmEnvironment.metadata.errorMessage,
        null,
        "litvis:elm-environment",
      );
    }

    const codeBlocksInAllFiles: CodeBlockWithFile[] = [];
    _.forEach(narrative.files, (file) => {
      visit(file.data.root, "code", (node) => {
        if (node.data && node.data.litvisAttributeDerivatives) {
          node.data.file = file;
          codeBlocksInAllFiles.push(node);
        }
      });
    });
    const outputExpressionsInLastFile = [];
    visit(lastFile.data.root, "outputExpression", (node) => {
      node.data.file = lastFile;
      outputExpressionsInLastFile.push(node);
    });

    // build contexts by tracing down chains of code blocks
    const foundContextsByName = {};
    _.forEachRight(codeBlocksInAllFiles, (codeBlock, index) => {
      const derivatives = codeBlock.data.litvisAttributeDerivatives;
      const contextName = derivatives.contextName;
      // skip if a code block belongs to a context that is already considered
      if (foundContextsByName[contextName]) {
        return;
      }
      // ignore contexts where last code blocks do not belong to the last file
      if (codeBlock.data.file !== lastFile) {
        return;
      }
      const context = {
        codeBlocks: [],
        outputExpressions: [],
      };
      foundContextsByName[contextName] = context;
      let currentIndex = index;
      let currentContextName = contextName;
      do {
        context.codeBlocks.unshift(codeBlocksInAllFiles[currentIndex]);
        if (currentIndex === 0) {
          break;
        }
        const follows =
          codeBlocksInAllFiles[currentIndex].data.litvisAttributeDerivatives
            .follows;
        if (follows) {
          currentIndex = _.findLastIndex(
            codeBlocksInAllFiles,
            (b) =>
              b.data.litvisAttributeDerivatives.id === follows ||
              b.data.litvisAttributeDerivatives.contextName === follows,
            currentIndex - 1,
          );
          if (currentIndex !== -1) {
            currentContextName =
              codeBlocksInAllFiles[currentIndex].data.litvisAttributeDerivatives
                .contextName;
          }
        } else {
          currentIndex = _.findLastIndex(
            codeBlocksInAllFiles,
            (b) =>
              b.data.litvisAttributeDerivatives.contextName ===
              currentContextName,
            currentIndex - 1,
          );
        }
      } while (currentIndex >= 0);
    });

    // add output expressions into contexts
    _.forEach(outputExpressionsInLastFile, (outputExpression) => {
      const contextName = outputExpression.data.contextName;
      if (foundContextsByName[contextName]) {
        foundContextsByName[contextName].outputExpressions.push(
          outputExpression,
        );
      } else {
        foundContextsByName[contextName] = {
          codeBlocks: [],
          outputExpressions: [outputExpression],
        };
      }
    });

    const literateElmProgramPromises: Array<Promise<ProgramResult>> = [];
    const ranContextNames = [];
    _.forEach(
      foundContextsByName,
      ({ codeBlocks, outputExpressions }, contextName) => {
        // const chunksExistInLastFile =
        //   _.some(
        //     codeBlocks,
        //     (node) => node.data && node.data.file === lastFile,
        //   ) ||
        //   _.some(
        //     outputExpressions,
        //     (node) => node.data && node.data.file === lastFile,
        //   );

        // // do not run a context if it is not present in the active document
        // if (!chunksExistInLastFile) {
        //   return;
        // }

        ranContextNames.push(contextName);
        literateElmProgramPromises.push(
          runProgram({
            environment: literateElmEnvironment,
            codeBlocks,
            outputExpressions,
          }),
        );
      },
    );
    const literateElmProgramResults = await Promise.all(
      literateElmProgramPromises,
    );

    const contexts: ProcessedLitvisContext[] = _.map(
      ranContextNames,
      (contextName, index) => {
        const literateElmProgramResult = literateElmProgramResults[index];
        return {
          name: contextName,
          status: literateElmProgramResult.status,
          evaluatedOutputExpressions:
            literateElmProgramResult.evaluatedOutputExpressions,
        };
      },
    );
    narrative.contexts = contexts;
  } catch (e) {
    if (!e.location /* not a VFileMessage */) {
      try {
        lastFile.fail(e.message);
      } catch (e2) {
        // this try/catch is just needed to block throwing in .fail()
      }
    }
  }
};
