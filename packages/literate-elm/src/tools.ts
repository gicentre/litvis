import * as execa from "execa";
import * as findUp from "find-up";

export async function initializeElmPackage(projectDirectory: string) {
  const args = ["install", "--yes"];
  await execa(pathTo("elm-package"), args, {
    cwd: projectDirectory,
    localDir: __dirname,
    stripEof: false,
  });
}

export async function installElmPackage(
  projectDirectory: string,
  packageName: string,
  packageVersion: string,
) {
  const args = ["install", "--yes", packageName];
  if (packageVersion !== "latest") {
    const semver = `${packageVersion}${".0".repeat(
      2 - (packageVersion.match(/\./g) || []).length,
    )}`;
    args.push(semver);
  }
  await execa(pathTo("elm-package"), args, {
    cwd: projectDirectory,
    localDir: __dirname,
    stripEof: false,
  });
  // TODO: return meaningful error when elm-package is not installed
  // see https://github.com/jwoLondon/litvis/issues/27
}

export async function runElm(
  projectDirectory: string,
  modulePath: string,
  outputSymbolName: string,
): Promise<string> {
  return (await execa(
    "run-elm",
    [
      "--report=json",
      "--output-name",
      outputSymbolName,
      "--project-dir",
      projectDirectory,
      "--path-to-elm-make",
      pathTo("elm-make"),
      modulePath,
    ],
    {
      maxBuffer: 1024 * 1024 * 100,
      preferLocal: true,
      localDir: __dirname,
      stripEof: false,
    },
  )).stdout;
  // TODO: return meaningful error when elm-run is not installed
}

const pathByBinaryName: { [binaryName: string]: string } = {};
const pathTo = (binaryName) => {
  if (!pathByBinaryName[binaryName]) {
    pathByBinaryName[binaryName] =
      findUp.sync([`node_modules/.bin/${binaryName}`], { cwd: __dirname }) ||
      binaryName;
  }
  return pathByBinaryName[binaryName];
};
