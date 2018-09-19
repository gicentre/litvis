import { parseUsingCache } from "elm-string-representation";
import { remove, writeFile } from "fs-extra";
import * as _ from "lodash";
import * as hash from "object-hash";
import { resolve } from "path";
import * as auxFiles from "./auxFiles";
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

interface ChunkifiedProgram {
  name: string;
  chunks: Chunk[];
  maxFileIndex: number;
}

interface CachedProgramResult {
  status: ProgramResultStatus.SUCCEEDED | ProgramResultStatus.FAILED;
  errors: any[];
  evaluatedExpressionTextMap?: { [expressionText: string]: string };
  debugLog?: string[];
}

const PROGRAM_TIMEOUT = 20000;

export async function runProgram(program: Program): Promise<ProgramResult> {
  const chunkifiedProgram = chunkifyProgram(program);
  const programBasePath = resolve(
    program.environment.workingDirectory,
    chunkifiedProgram.name,
  );
  await auxFiles.touch(programBasePath);
  const programResultPath = `${programBasePath}.result.json`;

  let cachedResult: CachedProgramResult;
  try {
    await auxFiles.ensureUnlocked(programBasePath, PROGRAM_TIMEOUT);
    cachedResult = require(programResultPath) as CachedProgramResult;
  } catch (e) {
    await auxFiles.lock(programBasePath);

    cachedResult = await runChunkifiedProgram(
      chunkifiedProgram,
      program.environment.workingDirectory,
    );
    await writeFile(programResultPath, JSON.stringify(cachedResult), "utf8");

    await auxFiles.unlock(programBasePath);
  }

  if (cachedResult && cachedResult.status === ProgramResultStatus.SUCCEEDED) {
    const evaluatedExpressions = program.expressionNodes.map(
      (expressionNode): EvaluatedExpression => {
        const valueStringRepresentation =
          (cachedResult.evaluatedExpressionTextMap &&
            cachedResult.evaluatedExpressionTextMap[expressionNode.text]) ||
          "";
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
      evaluatedExpressions,
      messages: convertErrorsToMessages(
        chunkifiedProgram,
        (cachedResult && cachedResult.errors) || [],
      ),
      debugLog:
        cachedResult.debugLog instanceof Array ? cachedResult.debugLog : [],
    };
  } else {
    return {
      program,
      status: ProgramResultStatus.FAILED,
      messages: convertErrorsToMessages(
        chunkifiedProgram,
        (cachedResult && cachedResult.errors) || [],
      ),
    };
  }
}

const outputSymbolName = "literateElmOutputSymbol";
const chunkifyProgram = (program: Program): ChunkifiedProgram => {
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
      )}", Json.Encode.string <| Debug.toString <| ${text})`,
    });
  });

  chunks.push({
    type: ChunkType.AUXILIARY,
    text: `-------- literate-elm output end\n            ]\n`,
  });

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

  const programName = `Program${hash(chunks.map((chunk) => chunk.text))}`;
  chunks.unshift({
    type: ChunkType.AUXILIARY,
    text: `module ${programName} exposing (..)`,
  });

  // measure vertical offset for each code chunk to map errors later
  let offsetY = 0;
  _.forEach(chunks, (chunk) => {
    const lineCount = (chunk.text.match(/\n/g) || []).length + 1;
    chunk.offsetY = offsetY;
    offsetY += lineCount;
  });

  return {
    name: programName,
    chunks,
    maxFileIndex: Math.max(
      ..._.map(
        [...program.codeNodes, ...program.expressionNodes],
        (node) => node.fileIndex || 0,
      ),
    ),
  };
};

const runChunkifiedProgram = async (
  chunkifiedProgram: ChunkifiedProgram,
  workingDirectory: string,
  keepElmFiles: boolean = false,
): Promise<CachedProgramResult> => {
  const programPath = resolve(
    workingDirectory,
    `${chunkifiedProgram.name}.elm`,
  );
  const codeToRun = chunkifiedProgram.chunks.map(({ text }) => text).join("\n");
  try {
    let runElmResult;
    await writeFile(programPath, codeToRun, "utf8");
    try {
      runElmResult = await runElm(
        workingDirectory,
        programPath,
        outputSymbolName,
      );
    } catch (e) {
      const linesInStdout = (e.message || "").split("\n");
      let errors;
      _.findLast(linesInStdout, (line) => {
        try {
          errors = JSON.parse(line);
          return true;
        } catch (e) {
          return false;
        }
      });

      if (!errors || !_.isArray(errors)) {
        throw e;
      }
      return {
        status: ProgramResultStatus.FAILED,
        errors,
      };
    }

    return {
      status: ProgramResultStatus.SUCCEEDED,
      errors: [],
      evaluatedExpressionTextMap: JSON.parse(runElmResult.output || "{}"),
      debugLog: runElmResult.debugLog,
    };
  } catch (e) {
    // some messages need to be patched to avoid confusing output
    const message = (e.message || "")
      .replace(/^Compilation failed\n/, "")
      .replace(/\n{2,}/, "\n")
      .replace(/Module .* is trying to import it.\n\n/, "")
      .replace(
        /(\n  \* Need to add a source directory or new dependency) to elm.json/,
        "$1",
      );
    const indexOfFirstNewline = message.indexOf("\n");

    const overview =
      indexOfFirstNewline !== -1
        ? message.substring(0, indexOfFirstNewline)
        : message;
    const details =
      indexOfFirstNewline !== -1
        ? message.substring(indexOfFirstNewline + 1)
        : "";

    return {
      status: ProgramResultStatus.FAILED,
      errors: [
        {
          overview,
          details,
          region: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 1 },
          },
        },
      ],
    };
  } finally {
    if (!keepElmFiles) {
      await remove(programPath);
    }
  }
};

const convertErrorsToMessages = (
  chunkifiedProgram: ChunkifiedProgram,
  errors: any[],
): Message[] => {
  const result: Message[] = [];
  errors.map((error) => {
    const currentChunk =
      chunkifiedProgram.chunks[
        _.findIndex(
          chunkifiedProgram.chunks,
          (chunk) =>
            chunk.offsetY! + 1 > _.get(error, ["region", "start", "line"], 0),
        ) - 1
      ];
    if (currentChunk && currentChunk.type === ChunkType.CODE_NODE) {
      const position = {
        start: {
          line:
            _.get(error, ["region", "start", "line"], 0) -
            currentChunk.offsetY! -
            1 +
            currentChunk.ref.position.start.line,
          column:
            _.get(error, ["region", "start", "column"], 0) -
            1 +
            currentChunk.ref.position.start.column,
        },
        end: {
          line:
            _.get(error, ["region", "end", "line"], 0) -
            currentChunk.offsetY! -
            1 +
            currentChunk.ref.position.start.line,
          column:
            _.get(error, ["region", "end", "column"], 0) -
            1 +
            currentChunk.ref.position.start.column,
        },
      };
      result.push({
        text: getErrorMessageText(error),
        position,
        severity: MessageSeverity.ERROR,
        fileIndex: currentChunk.ref.fileIndex || 0,
        node: currentChunk.ref,
      });
    } else if (
      currentChunk &&
      currentChunk.type === ChunkType.EXPRESSION_TEXT
    ) {
      const messageText = getErrorMessageText(error);
      const expressionNodes = currentChunk.ref;
      _.forEach(expressionNodes, (expressionNode) => {
        result.push({
          text: messageText,
          position: expressionNode.position,
          fileIndex: expressionNode.fileIndex || 0,
          severity: MessageSeverity.ERROR,
          node: expressionNode,
        });
      });
    } else {
      result.push({
        text: getErrorMessageText(error),
        severity: MessageSeverity.ERROR,
        position: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 1 },
        },
        fileIndex: chunkifiedProgram.maxFileIndex,
        node: null,
      });
    }
  });
  return result;
};

const getErrorMessageText = (error): string => {
  if (error.overview) {
    return `${error.overview || ""}${
      error.details ? `. ${error.details.replace(/\s+/g, " ")}` : ""
    }`;
  }
  return error.message || error.valueOf();
};
