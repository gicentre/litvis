import {
  CodeNode,
  ensureEnvironment,
  ExpressionNode,
  ProgramResult,
  runProgram,
} from "literate-elm";
import _ from "lodash";
import { Position } from "unist";
import visit from "unist-util-visit";

import {
  Cache,
  CodeBlock,
  EvaluatedOutputExpression,
  FailedLitvisContext,
  LitvisCodeBlock,
  LitvisNarrative,
  OutputExpression,
  ProcessedLitvisContext,
  SucceededLitvisContext,
} from "../types";

interface WrappedCodeBlock {
  documentIndex: number;
  subject: LitvisCodeBlock;
}

interface WrappedOutputExpression {
  documentIndex: number;
  subject: OutputExpression;
}

interface UnprocessedLitvisContext {
  name: string;
  wrappedCodeBlocks: WrappedCodeBlock[];
  wrappedOutputExpressions: WrappedOutputExpression[];
}

const fallbackPosition: Position = {
  start: { column: 0, line: 0 },
  end: { column: 0, line: 0 },
};

export const processElmContexts = async (
  narrative: LitvisNarrative,
  cache: Cache,
): Promise<void> => {
  // const documentPaths = _.map(narrative.documents, (document) => document.path);
  // const documentIndexByPath: { [path: string]: number } = _.mapValues(
  //   _.invert(documentPaths),
  //   (v) => parseInt(v, 10),
  // );

  const lastDocument = _.last(narrative.documents);
  const lastDocumentIndex = narrative.documents.length - 1;
  if (!lastDocument) {
    return;
  }

  const literateElmJobs: Array<{
    contextName: string;
    codeNodes: CodeNode[];
    expressionNodes: ExpressionNode[];
  }> = [];

  try {
    const wrappedCodeBlocksInAllDocuments: WrappedCodeBlock[] = [];
    const wrappedCodeBlocksInLastDocument: WrappedCodeBlock[] = [];
    _.forEach(narrative.documents, (document, documentIndex) => {
      visit<CodeBlock>(document.data.root, "code", (codeBlock) => {
        if (codeBlock.data && codeBlock.data.litvisAttributeDerivatives) {
          const wrappedCodeBlock: WrappedCodeBlock = {
            subject: codeBlock as LitvisCodeBlock,
            documentIndex,
          };
          wrappedCodeBlocksInAllDocuments.push(wrappedCodeBlock);
          if (document === lastDocument) {
            wrappedCodeBlocksInLastDocument.push(wrappedCodeBlock);
          }
        }
      });
    });

    const wrappedOutputExpressionsInLastFile: WrappedOutputExpression[] = [];
    visit(
      lastDocument.data.root,
      "outputExpression",
      (outputExpression: OutputExpression) => {
        wrappedOutputExpressionsInLastFile.push({
          subject: outputExpression,
          documentIndex: lastDocumentIndex,
        });
      },
    );

    // build contexts by tracing down chains of code blocks
    const foundContextsByName: {
      [name: string]: UnprocessedLitvisContext;
    } = {};
    _.forEachRight(
      wrappedCodeBlocksInAllDocuments,
      (wrappedCodeBlock, index) => {
        const derivatives =
          wrappedCodeBlock.subject.data.litvisAttributeDerivatives;

        const contextName = derivatives.contextName;
        // skip if a code block belongs to a context that is already considered
        if (foundContextsByName[contextName]) {
          return;
        }
        // ignore contexts where last code blocks do not belong to the last document
        if (!_.includes(wrappedCodeBlocksInLastDocument, wrappedCodeBlock)) {
          return;
        }
        const context: UnprocessedLitvisContext = {
          name: contextName,
          wrappedCodeBlocks: [],
          wrappedOutputExpressions: [],
        };
        foundContextsByName[contextName] = context;
        let currentIndex = index;
        let currentContextName = contextName;
        do {
          context.wrappedCodeBlocks.unshift(
            wrappedCodeBlocksInAllDocuments[currentIndex]!,
          );
          if (currentIndex === 0) {
            break;
          }
          const follows =
            wrappedCodeBlocksInAllDocuments[currentIndex]!.subject.data
              .litvisAttributeDerivatives.follows;
          if (follows) {
            currentIndex = _.findLastIndex(
              wrappedCodeBlocksInAllDocuments,
              (b) =>
                b.subject.data.litvisAttributeDerivatives.id === follows ||
                b.subject.data.litvisAttributeDerivatives.contextName ===
                  follows,
              currentIndex - 1,
            );
            if (currentIndex !== -1) {
              currentContextName =
                wrappedCodeBlocksInAllDocuments[currentIndex]!.subject.data
                  .litvisAttributeDerivatives.contextName;
            }
          } else {
            currentIndex = _.findLastIndex(
              wrappedCodeBlocksInAllDocuments,
              (b) =>
                b.subject.data.litvisAttributeDerivatives.contextName ===
                currentContextName,
              currentIndex - 1,
            );
          }
        } while (currentIndex >= 0);
      },
    );

    // add output expressions to contexts
    _.forEach(wrappedOutputExpressionsInLastFile, (wrappedOutputExpression) => {
      const contextName = wrappedOutputExpression.subject.data.contextName;
      if (foundContextsByName[contextName]) {
        foundContextsByName[contextName].wrappedOutputExpressions.push(
          wrappedOutputExpression,
        );
      } else {
        foundContextsByName[contextName] = {
          name: contextName,
          wrappedCodeBlocks: [],
          wrappedOutputExpressions: [wrappedOutputExpression],
        };
      }
    });

    _.forEach(
      foundContextsByName,
      ({ wrappedCodeBlocks, wrappedOutputExpressions }, contextName) => {
        const codeNodes: CodeNode[] = _.map(
          wrappedCodeBlocks,
          (wrappedCodeBlock) => ({
            text: wrappedCodeBlock.subject.value,
            position: wrappedCodeBlock.subject.position || fallbackPosition,
            fileIndex: wrappedCodeBlock.documentIndex,
          }),
        );

        const expressionNodes: ExpressionNode[] = _.map(
          wrappedOutputExpressions,
          (wrappedOutputExpression) => ({
            text: wrappedOutputExpression.subject.data.text,
            position:
              wrappedOutputExpression.subject.position || fallbackPosition,
            fileIndex: wrappedOutputExpression.documentIndex,
          }),
        );

        literateElmJobs.push({
          contextName,
          codeNodes,
          expressionNodes,
        });
      },
    );

    if (!literateElmJobs.length) {
      return;
    }

    const literateElmEnvironment = await ensureEnvironment(
      narrative.elmEnvironmentSpecForLastFile!,
      cache.literateElmDirectory,
    );

    if (literateElmEnvironment.metadata.status !== "ready") {
      try {
        lastDocument.fail(
          literateElmEnvironment.metadata.errorMessage || "Unknown error",
          undefined,
          "litvis:elm-environment",
        );
      } catch (e) {
        // no need for action - just preventing .fail() from throwing further
      }

      return;
    }

    const literateElmProgramPromises: Array<Promise<ProgramResult>> =
      literateElmJobs.map(({ codeNodes, expressionNodes }) =>
        runProgram({
          environment: literateElmEnvironment,
          codeNodes,
          expressionNodes,
        }),
      );

    const literateElmProgramResults = await Promise.all(
      literateElmProgramPromises,
    );

    // map literate-elm messages to vfile messages
    const allMessages = _.flatten(
      _.map(literateElmProgramResults, (result) => result.messages),
    );
    const messagesGroupedByPositionAndText = _.groupBy(
      allMessages,
      (message) => `${JSON.stringify(message.position)}|${message.text}`,
    );
    _.forEach(messagesGroupedByPositionAndText, (messageGroup) => {
      const message = messageGroup[0]!;
      const document = narrative.documents[message.fileIndex]!;
      switch (message.severity) {
        case "info": {
          document.info(message.text, message.position, "literate-elm:compile");
          break;
        }
        case "warning": {
          document.message(
            message.text,
            message.position,
            "literate-elm:compile",
          );
          break;
        }
        default: {
          try {
            document.fail(
              message.text,
              message.position,
              "literate-elm:compile",
            );
          } catch (e) {
            // no need for action - just preventing .fail() from throwing further
          }
        }
      }
    });

    const processedContexts: ProcessedLitvisContext[] = _.map(
      literateElmJobs,
      ({ contextName }, index) => {
        const literateElmProgramResult = literateElmProgramResults[index]!;
        const context = foundContextsByName[contextName];
        if (literateElmProgramResult.status === "failed") {
          const processedContext: FailedLitvisContext = {
            name: contextName,
            status: "failed",
          };

          return processedContext;
        } else {
          if (literateElmProgramResult.debugLog.length) {
            lastDocument.info(
              `Debug.log results in context "${contextName}":\n${literateElmProgramResult.debugLog.join(
                "\n",
              )}`,
              undefined,
              "literate-elm:debug-log",
            );
          }
          const evaluatedOutputExpressions: EvaluatedOutputExpression[] = _.map(
            context!.wrappedOutputExpressions,
            (wrappedOutputExpression, i) => {
              const evaluatedExpressionInProgram =
                literateElmProgramResult.evaluatedExpressions[i]!;
              const evaluatedExpression =
                wrappedOutputExpression.subject as EvaluatedOutputExpression;
              const document =
                narrative.documents[
                  evaluatedExpressionInProgram.node.fileIndex || 0
                ]!;

              evaluatedExpression.data.value =
                evaluatedExpressionInProgram.value;
              evaluatedExpression.data.valueStringRepresentation =
                evaluatedExpressionInProgram.valueStringRepresentation;

              if (
                evaluatedExpression.data.outputFormat !== "r" &&
                evaluatedExpression.data.value instanceof Error
              ) {
                document.message(
                  evaluatedExpression.data.value.message,
                  evaluatedExpression.position,
                  "litvis:expression-value",
                );
              }

              return evaluatedExpression;
            },
          );
          const processedContext: SucceededLitvisContext = {
            name: contextName,
            status: literateElmProgramResult.status,
            evaluatedOutputExpressions,
            debugLog: literateElmProgramResult.debugLog,
          };

          return processedContext;
        }
      },
    );
    narrative.contexts = processedContexts;
  } catch (error) {
    try {
      lastDocument.fail(error instanceof Error ? error.message : String(error));
    } catch {
      // no need for action - just preventing .fail() from throwing further
    }
  }
};
