import executeRunElm from "@kachkaev/run-elm";
import * as execa from "execa";

export async function initializeElmFile(projectDirectory: string) {
  const args = ["init"];
  const childProcess = execa("elm", args, {
    cwd: projectDirectory,
    stdin: null,
  });
  childProcess.stdin.write("\n");
  await childProcess;
}

export async function installElmPackage(
  projectDirectory: string,
  packageName: string,
  packageVersion: string,
) {
  const args = ["install", packageName];
  if (packageVersion !== "latest") {
    const semver = `${packageVersion}${".0".repeat(
      2 - (packageVersion.match(/\./g) || []).length,
    )}`;
    args.push(semver);
  }
  const childProcess = execa("elm", args, {
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
