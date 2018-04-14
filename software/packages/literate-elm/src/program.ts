import { remove, writeFile } from "fs-extra";
import * as _ from "lodash";
import * as hash from "object-hash";
import { resolve } from "path";
import { runElm } from "./tools";
import {
  // CodeBlockWithFile,
  // Environment,
  // OutputExpressionWithFile,
  Program,
  ProgramResult,
  ProgramResultStatus,
} from "./types";

enum CodeChunkType {
  AUXILIARY,
  CODE_BLOCK,
  OUTPUT_SYMBOL,
}

interface CodeChunk {
  type: CodeChunkType;
  ref?: any;
  text: string;
  offsetX?: number;
  offsetY?: number;
}

export async function runProgram(program: Program): Promise<ProgramResult> {
  const outputSymbolName = "literateElmOutputSymbol";

  // generate module contents
  const codeChunks: CodeChunk[] = [];

  program.codeBlocks.forEach((codeBlock, i) => {
    codeChunks.push({
      type: CodeChunkType.CODE_BLOCK,
      ref: codeBlock,
      text: `-------- literate-elm code block ${i}\n${codeBlock.value}`,
    });
  });

  const outputExpressionsGroupedByText = {};
  program.outputExpressions.forEach((outputExpression, i) => {
    let group = outputExpressionsGroupedByText[outputExpression.data.text];
    if (!group) {
      group = [];
      outputExpressionsGroupedByText[outputExpression.data.text] = group;
    }
    group.push(outputExpression);
  });

  const orderedOutputExpressionTexts = _.sortBy(
    _.keys(outputExpressionsGroupedByText),
  );

  codeChunks.push({
    type: CodeChunkType.AUXILIARY,
    text: `-------- literate-elm output
${outputSymbolName} : String
${outputSymbolName} =
    encode 0 <|
        object
            [`,
  });
  _.forEach(orderedOutputExpressionTexts, (text, i) => {
    codeChunks.push({
      type: CodeChunkType.OUTPUT_SYMBOL,
      ref: outputExpressionsGroupedByText[text],
      text: `-------- literate-elm output expression ${text}
        ${i > 0 ? "," : " "} ("${text.replace(
        /"/g,
        '\\"',
      )}", string <| toString <| ${text})`,
      offsetY: 2,
    });
  });

  codeChunks.push({
    type: CodeChunkType.AUXILIARY,
    text: `-------- literate-elm output end\n            ]\n`,
  });

  const programId = hash(codeChunks);

  // only import Json.Encode if not done so in user code
  const containsJsonEncodeImport = _.some(codeChunks, (codeChunk) =>
    `\n${codeChunk.text}`.match(/\n\s*import Json\.Encode exposing/),
  );
  if (!containsJsonEncodeImport) {
    codeChunks.unshift({
      type: CodeChunkType.AUXILIARY,
      text: `import Json.Encode exposing (..)`,
    });
  }

  //
  const moduleName = `Main${programId}`;
  const modulePath = resolve(
    program.environment.workingDirectory,
    `${moduleName}.elm`,
  );

  codeChunks.unshift({
    type: CodeChunkType.AUXILIARY,
    text: `module ${moduleName} exposing (..)`,
  });

  // measure vertical offset for each code chunk to map errors later
  let offsetY = 0;
  codeChunks.forEach((codeChunk) => {
    const lineCount = (codeChunk.text.match(/\n/g) || []).length + 1;
    codeChunk.offsetY = offsetY;
    offsetY += lineCount;
  });

  const codeToRun = codeChunks.map(({ text }) => text).join("\n");
  try {
    let runElmStdout;
    await writeFile(modulePath, codeToRun, "utf8");
    try {
      runElmStdout = await runElm(
        program.environment.workingDirectory,
        modulePath,
        outputSymbolName,
      );
    } catch (stderr) {
      const linesInStdout = (stderr || "").split("\n");
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
        throw new Error(stderr);
      }

      _.forEach(elmErrors, (elmError) => {
        const currentCodeChunk =
          codeChunks[
            _.findIndex(
              codeChunks,
              (codeChunk) =>
                codeChunk.offsetY + 1 >
                _.get(elmError, ["region", "start", "line"], 0),
            ) - 1
          ];
        try {
          if (currentCodeChunk.type === CodeChunkType.CODE_BLOCK) {
            currentCodeChunk.ref.data.file.fail(
              `${elmError.overview || ""}${
                elmError.details
                  ? `. ${elmError.details.replace(/\s+/g, " ")}`
                  : ""
              }`,
              {
                start: {
                  line:
                    _.get(elmError, ["region", "start", "line"], 0) -
                    currentCodeChunk.offsetY -
                    1 +
                    currentCodeChunk.ref.position.start.line,
                  column:
                    _.get(elmError, ["region", "start", "column"], 0) -
                    1 +
                    currentCodeChunk.ref.position.start.column,
                },
                end: {
                  line:
                    _.get(elmError, ["region", "end", "line"], 0) -
                    currentCodeChunk.offsetY -
                    1 +
                    currentCodeChunk.ref.position.start.line,
                  column:
                    _.get(elmError, ["region", "end", "column"], 0) -
                    1 +
                    currentCodeChunk.ref.position.start.column,
                },
              },
              "litvis:elm-code-block",
            );
          } else if (currentCodeChunk.type === CodeChunkType.OUTPUT_SYMBOL) {
            const outputExpressions = currentCodeChunk.ref;
            _.forEach(outputExpressions, (outputExpression) => {
              outputExpression.data.file.fail(
                `${elmError.overview || ""}${
                  elmError.details
                    ? `. ${elmError.details.replace(/\s+/g, " ")}`
                    : ""
                }`,
                outputExpression.position,
                "litvis:elm-output-expression",
              );
            });
          } else {
            throw new Error(elmError);
          }
        } catch (e) {
          if (!e.location /* not a VFileMessage */) {
            throw e;
          }
        }
      });
      // TODO: map error positions and add them to messages
      // throw new Error();
    }

    // create a map for expression string representations from elm output
    // only parse the last non-empty row in stdout not to include Debug.log output
    const outputRows = (runElmStdout || "").split("\n");
    const output = outputRows[outputRows.length - 2];
    const evaluatedOutputExpressionMap = JSON.parse(output || "{}");

    const evaluatedOutputExpressions = program.outputExpressions.map(
      (outputExpression) => {
        const stringRepresentation =
          evaluatedOutputExpressionMap[outputExpression.data.text];
        // let value;
        // try {
        //   value = parseElmStringRepresentation(stringRepresentation);
        // } catch (e) {
        //   outputExpression.data.file.message(
        //     `‘${outputExpression.data.text}’: ${e.message}`,
        //     outputExpression,
        //   );
        // }
        return {
          ...outputExpression,
          data: {
            ...outputExpression.data,
            stringRepresentation,
            // value,
          },
        };
      },
    );
    return {
      program,
      status: ProgramResultStatus.SUCCESS,
      evaluatedOutputExpressions,
    };
  } catch (e) {
    if (!e.location /* not a VFileMessage */) {
      try {
        (
          _.last(program.codeBlocks) || _.last(program.outputExpressions)
        ).data.file.fail(e.message || e);
      } catch (e2) {
        // try/catch only prevents fail from throwing further
      }
    }
    return {
      program,
      status: ProgramResultStatus.ERROR,
      evaluatedOutputExpressions: [],
    };
  } finally {
    await remove(modulePath);
  }
}
