import executeRunElm from "@kachkaev/run-elm";
import * as execa from "execa";
import { readFile, writeFile } from "fs-extra";
import { resolve } from "path";

export async function initializeElmProject(projectDirectory: string) {
  const childProcess = execa("elm", ["init"], {
    cwd: projectDirectory,
    stdin: null,
  });
  childProcess.stdin.write("\n");
  await childProcess;
}

// const resolveVersion = (version: string) => {
//   // Can't use version ranges in Elm 0.19 (yet?)
//   // let min = version;
//   // let max = version;
//   // while ((min.match(/\./g) || []).length < 2) {
//   //   min = `${min}.0`;
//   //   max = `${max}.9999`;
//   // }
//   // if (min === max) {
//   //   return version;
//   // }
//   // return `${min} <= v < ${max}`;

//   let result = version;
//   while ((result.match(/\./g) || []).length < 2) {
//     result = `${result}.0`;
//   }
//   return result;
// };

export const patchElmJson = async (projectPath, callback) => {
  const pathToElmJson = resolve(projectPath, "elm.json");
  const packageContents = await JSON.parse(
    await readFile(pathToElmJson, "utf8"),
  );
  await writeFile(
    pathToElmJson,
    JSON.stringify(callback(packageContents) || packageContents),
    "utf8",
  );
};

export async function installElmPackage(
  projectDirectory: string,
  packageName: string,
  packageVersion: string,
) {
  if (packageVersion !== "latest") {
    // https://github.com/elm/compiler/issues/1759
    throw new Error(
      "Installing dependencies rather than latest is currently not supported by elm install v0.19",
    );
    // waiting for elm install to support version picking
    // await patchElmJson(projectDirectory, (elmJson) => {
    //   elmJson.dependencies.direct[packageName] = resolveVersion(packageVersion);
    // });
  }
  const childProcess = execa("elm", ["install", packageName], {
    cwd: projectDirectory,
    stdin: null,
  });
  childProcess.stdin.write("\n");
  await childProcess;
  // TODO: return meaningful error when elm package is not installed
  // see https://github.com/jwoLondon/litvis/issues/27
}

export async function runElm(
  projectDirectory: string,
  modulePath: string,
  outputSymbolName: string,
): Promise<string> {
  const result = await executeRunElm(modulePath, {
    report: "json",
    outputName: outputSymbolName,
    projectDir: projectDirectory,
  });
  return result;
}
