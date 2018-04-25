import { parseUsingCache } from "elm-string-representation";
import { remove, writeFile } from "fs-extra";
import * as _ from "lodash";
import * as hash from "object-hash";
import { resolve } from "path";
import { runElm } from "./tools";
import {
  CodeNode,
  EvaluatedExpression,
  ExpressionNode,
  Message,
  MessageSeverity,
  Program,
  ProgramResult,
  ProgramResultStatus,
} from "./types";

enum ChunkType {
  AUXILIARY,
  CODE_NODE,
  EXPRESSION_TEXT,
}

interface AbstractChunk {
  text: string;
  offsetY?: number;
}

interface AuxiliaryChunk extends AbstractChunk {
  type: ChunkType.AUXILIARY;
}

interface CodeNodeChunk extends AbstractChunk {
  type: ChunkType.CODE_NODE;
  ref: CodeNode;
}

interface ExpressionTextChunk extends AbstractChunk {
  type: ChunkType.EXPRESSION_TEXT;
  ref: ExpressionNode[];
}

type Chunk = AuxiliaryChunk | CodeNodeChunk | ExpressionTextChunk;

export async function runProgram(program: Program): Promise<ProgramResult> {
  const outputSymbolName = "literateElmOutputSymbol";

  // generate Elm module contents
  const chunks: Chunk[] = [];

  _.forEach(program.codeNodes, (codeNode, i) => {
    chunks.push({
      type: ChunkType.CODE_NODE,
      ref: codeNode,
      text: `-------- literate-elm code ${i}\n${codeNode.text}`,
    });
  });

  const expressionNodesGroupedByText = _.groupBy(
    program.expressionNodes,
    (expressionNode: ExpressionNode) => expressionNode.text,
  );
  const orderedExpressionTexts = _.sortBy(_.keys(expressionNodesGroupedByText));

  chunks.push({
    type: ChunkType.AUXILIARY,
    text: `-------- literate-elm output
${outputSymbolName} : String
${outputSymbolName} =
    Json.Encode.encode 0 <|
        Json.Encode.object
            [`,
  });
  _.forEach(orderedExpressionTexts, (text, i) => {
    chunks.push({
      type: ChunkType.EXPRESSION_TEXT,
      ref: expressionNodesGroupedByText[text],
      text: `-------- literate-elm output expression ${text}
        ${i > 0 ? "," : " "} ("${text.replace(
        /"/g,
        '\\"',
      )}", Json.Encode.string <| toString <| ${text})`,
    });
  });

  chunks.push({
    type: ChunkType.AUXILIARY,
    text: `-------- literate-elm output end\n            ]\n`,
  });

  const programId = hash(chunks);

  // only import Json.Encode if not done so in user code
  const containsJsonEncodeImport = _.some(chunks, (codeChunk) =>
    `\n${codeChunk.text}`.match(/\n\s*import\s+Json\.Encode/),
  );
  if (!containsJsonEncodeImport) {
    chunks.unshift({
      type: ChunkType.AUXILIARY,
      text: `import Json.Encode`,
    });
  }

  const moduleName = `Main${programId}`;
  const modulePath = resolve(
    program.environment.workingDirectory,
    `${moduleName}.elm`,
  );

  chunks.unshift({
    type: ChunkType.AUXILIARY,
    text: `module ${moduleName} exposing (..)`,
  });

  // measure vertical offset for each code chunk to map errors later
  let offsetY = 0;
  _.forEach(chunks, (chunk) => {
    const lineCount = (chunk.text.match(/\n/g) || []).length + 1;
    chunk.offsetY = offsetY;
    offsetY += lineCount;
  });

  const codeToRun = chunks.map(({ text }) => text).join("\n");
  const messages: Message[] = [];
  try {
    let runElmStdout;
    await writeFile(modulePath, codeToRun, "utf8");
    try {
      runElmStdout = await runElm(
        program.environment.workingDirectory,
        modulePath,
        outputSymbolName,
      );
    } catch (e) {
      const linesInStdout = (e.message || "").split("\n");
      let elmErrors;
      _.findLast(linesInStdout, (line) => {
        try {
          elmErrors = JSON.parse(line);
          return true;
        } catch (e) {
          return false;
        }
      });
      if (!elmErrors || !_.isArray(elmErrors)) {
        throw e;
      }
      _.forEach(elmErrors, (elmError) => {
        const currentChunk =
          chunks[
            _.findIndex(
              chunks,
              (chunk) =>
                chunk.offsetY + 1 >
                _.get(elmError, ["region", "start", "line"], 0),
            ) - 1
          ];
        if (currentChunk.type === ChunkType.CODE_NODE) {
          const position = {
            start: {
              line:
                _.get(elmError, ["region", "start", "line"], 0) -
                currentChunk.offsetY -
                1 +
                currentChunk.ref.position.start.line,
              column:
                _.get(elmError, ["region", "start", "column"], 0) -
                1 +
                currentChunk.ref.position.start.column,
            },
            end: {
              line:
                _.get(elmError, ["region", "end", "line"], 0) -
                currentChunk.offsetY -
                1 +
                currentChunk.ref.position.start.line,
              column:
                _.get(elmError, ["region", "end", "column"], 0) -
                1 +
                currentChunk.ref.position.start.column,
            },
          };
          messages.push({
            text: `${elmError.overview || ""}${
              elmError.details
                ? `. ${elmError.details.replace(/\s+/g, " ")}`
                : ""
            }`,
            position,
            severity: MessageSeverity.ERROR,
            fileIndex: currentChunk.ref.fileIndex || 0,
            node: currentChunk.ref,
          });
        } else if (currentChunk.type === ChunkType.EXPRESSION_TEXT) {
          const messageText = `${elmError.overview || ""}${
            elmError.details ? `. ${elmError.details.replace(/\s+/g, " ")}` : ""
          }`;
          const expressionNodes = currentChunk.ref;
          _.forEach(expressionNodes, (expressionNode) => {
            messages.push({
              text: messageText,
              position: expressionNode.position,
              fileIndex: expressionNode.fileIndex || 0,
              severity: MessageSeverity.ERROR,
              node: expressionNode,
            });
          });
        } else {
          throw new Error(
            elmError.overview || elmError.details || JSON.stringify(elmError),
          );
        }
      });
      return {
        program,
        status: ProgramResultStatus.FAILED,
        messages,
      };
    }

    // create a map for expression string representations from elm output
    // only parse the last non-empty row in stdout not to include Debug.log output
    const outputRows = (runElmStdout || "").split("\n");
    const output = outputRows[outputRows.length - 2];
    const debugLog = outputRows
      .slice(0, outputRows.length - 2)
      .join("\n")
      .replace(/This is output from elm to the console.: /g, "")
      .trim();
    const evaluatedExpressionTextMap = JSON.parse(output || "{}");

    const evaluatedExpressions = program.expressionNodes.map(
      (expressionNode): EvaluatedExpression => {
        const valueStringRepresentation =
          evaluatedExpressionTextMap[expressionNode.text];
        let value;
        try {
          value = parseUsingCache(valueStringRepresentation);
        } catch (e) {
          value = e;
        }
        return {
          node: expressionNode,
          value,
          valueStringRepresentation,
        };
      },
    );
    return {
      program,
      status: ProgramResultStatus.SUCCEEDED,
      messages,
      evaluatedExpressions,
      debugLog,
    };
  } catch (e) {
    messages.push({
      text: e.message,
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
      severity: MessageSeverity.ERROR,
      fileIndex: Math.max(
        ..._.map(
          [...program.codeNodes, ...program.expressionNodes],
          (node) => node.fileIndex || 0,
        ),
      ),
      node: null,
    });
    return {
      program,
      status: ProgramResultStatus.FAILED,
      messages,
    };
  } finally {
    await remove(modulePath);
  }
}
