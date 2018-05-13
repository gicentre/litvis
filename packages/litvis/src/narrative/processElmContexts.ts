import {
  CodeNode,
  ensureEnvironment,
  EnvironmentStatus,
  ExpressionNode,
  MessageSeverity,
  ProgramResult,
  ProgramResultStatus,
  runProgram,
} from "literate-elm";
import * as _ from "lodash";
import * as visit from "unist-util-visit";
import {
  Cache,
  EvaluatedOutputExpression,
  FailedLitvisContext,
  OutputExpression,
  OutputFormat,
  SucceededLitvisContext,
} from "../types";
import { LitvisNarrative, ProcessedLitvisContext } from "../types";
import { CodeBlock } from "../types";

interface WrappedCodeBlock {
  documentIndex: number;
  subject: CodeBlock;
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

export default async (
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
      visit(document.data.root, "code", (codeBlock: CodeBlock) => {
        if (codeBlock.data && codeBlock.data.litvisAttributeDerivatives) {
          const wrappedCodeBlock = {
            subject: codeBlock,
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
            wrappedCodeBlocksInAllDocuments[currentIndex],
          );
          if (currentIndex === 0) {
            break;
          }
          const follows =
            wrappedCodeBlocksInAllDocuments[currentIndex].subject.data
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
                wrappedCodeBlocksInAllDocuments[currentIndex].subject.data
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
            position: wrappedCodeBlock.subject.position!,
            fileIndex: wrappedCodeBlock.documentIndex,
          }),
        );

        const expressionNodes: ExpressionNode[] = _.map(
          wrappedOutputExpressions,
          (wrappedOutputExpression) => ({
            text: wrappedOutputExpression.subject.data.text,
            position: wrappedOutputExpression.subject.position!,
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

    if (literateElmEnvironment.metadata.status !== EnvironmentStatus.READY) {
      try {
        lastDocument.fail(
          literateElmEnvironment.metadata.errorMessage!,
          undefined,
          "litvis:elm-environment",
        );
      } catch (e) {
        // no need for action - just preventing .fail() from throwing further
      }
      return;
    }

    const literateElmProgramPromises: Array<
      Promise<ProgramResult>
    > = literateElmJobs.map(({ codeNodes, expressionNodes }) =>
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
      const message = messageGroup[0];
      const document = narrative.documents[message.fileIndex];
      switch (message.severity) {
        case MessageSeverity.INFO: {
          document.info(message.text, message.position, "literate-elm:compile");
        }
        case MessageSeverity.WARNING: {
          document.message(
            message.text,
            message.position,
            "literate-elm:compile",
          );
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
        const literateElmProgramResult = literateElmProgramResults[index];
        const context = foundContextsByName[contextName];
        if (literateElmProgramResult.status === ProgramResultStatus.FAILED) {
          const processedContext: FailedLitvisContext = {
            name: contextName,
            status: ProgramResultStatus.FAILED,
          };
          return processedContext;
        } else {
          const debugLog = literateElmProgramResult.debugLog;
          if (debugLog) {
            lastDocument.info(
              `Debug.log results in context "${contextName}":\n${debugLog}`,
              undefined,
              "literate-elm:debug-log",
            );
          }
          const evaluatedOutputExpressions: EvaluatedOutputExpression[] = _.map(
            context.wrappedOutputExpressions,
            (wrappedOutputExpression, i) => {
              const evaluatedExpressionInProgram =
                literateElmProgramResult.evaluatedExpressions[i];
              const evaluatedExpression = wrappedOutputExpression.subject as EvaluatedOutputExpression;
              const document =
                narrative.documents[
                  evaluatedExpressionInProgram.node.fileIndex || 0
                ];

              evaluatedExpression.data.value =
                evaluatedExpressionInProgram.value;
              evaluatedExpression.data.valueStringRepresentation =
                evaluatedExpressionInProgram.valueStringRepresentation;

              if (
                evaluatedExpression.data.outputFormat !== OutputFormat.R &&
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
            debugLog,
          };
          return processedContext;
        }
      },
    );
    narrative.contexts = processedContexts;
  } catch (e) {
    lastDocument.fail(e.message);
  }
};
