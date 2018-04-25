import { ensureDir, readFile, remove, writeFile } from "fs-extra";
import * as hash from "object-hash";
import { resolve } from "path";
import * as sleep from "sleep-promise";
import { initializeElmPackage, installElmPackage } from "./tools";
import {
  Dependencies,
  Environment,
  EnvironmentMetadata,
  EnvironmentSpec,
  EnvironmentStatus,
} from "./types";

const VERSION = "0.0.1";
const TICK = 100;
const DEFAULT_TIMEOUT = 30000;

export async function ensureEnvironment(
  spec: EnvironmentSpec,
  literateElmDirectory: string,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Environment> {
  const now = +new Date();
  const workingSubdirectory = hash(spec);
  const workingDirectory = resolve(literateElmDirectory, workingSubdirectory);

  try {
    await ensureDir(workingDirectory);
  } catch (e) {
    return {
      spec,
      workingDirectory,
      metadata: {
        version: VERSION,
        status: EnvironmentStatus.ERROR,
        createdAt: now,
        usedAt: now,
        errorMessage: `Could not create directory ${workingSubdirectory}`,
      },
    };
  }

  // attempt to restore existing environment
  try {
    const timeToGiveUp = +new Date() + timeout;
    // the same elm environment can be initializing by another process,
    // so waiting till initialization is over or it's time to give up
    do {
      const existingMetadata = await readMetadata(workingDirectory);
      if (existingMetadata.status === EnvironmentStatus.INITIALIZING) {
        if (existingMetadata.createdAt + timeout < +new Date()) {
          throw new Error("Initialization is stuck, retrying...");
        }
      } else {
        const metadata = { ...existingMetadata };
        metadata.usedAt = now;
        if (!(metadata.usedAt - existingMetadata.usedAt < 1000)) {
          await writeMetadata(workingDirectory, metadata);
        }
        return {
          metadata: existingMetadata,
          spec,
          workingDirectory,
        };
      }
      await sleep(TICK);
    } while (+new Date() < timeToGiveUp);
    throw new Error(
      "Something unexpected happened while reading existing metadata",
    );
  } catch (e) {
    // initialize new Elm project if Environment directory is empty
    // or there have been problems with existing metadata
    const metadata: EnvironmentMetadata = {
      version: VERSION,
      status: EnvironmentStatus.INITIALIZING,
      createdAt: now,
      usedAt: now,
    };
    try {
      // clean-up working directory; do not delete non-elm files
      // to avoid user data deletion
      await Promise.all([
        writeMetadata(workingDirectory, metadata),
        remove(resolve(workingDirectory, "elm-stuff")),
        remove(resolve(workingDirectory, "elm-package.json")),
      ]);
      await initializeElmProject(
        workingDirectory,
        spec.dependencies,
        spec.sourceDirectories,
      );

      metadata.status = EnvironmentStatus.READY;
      await writeMetadata(workingDirectory, metadata);
    } catch (e) {
      // mark environment with an error if it cannot be initialized
      metadata.status = EnvironmentStatus.ERROR;
      metadata.errorMessage = e.message || e;
      try {
        await writeMetadata(workingDirectory, metadata);
      } catch (e2) {
        // not being able to save metadata error is not fatal
      }
    }

    return {
      metadata,
      spec,
      workingDirectory,
    };
  }
}

async function initializeElmProject(
  directory,
  dependencies: Dependencies,
  sourceDirectories: string[],
) {
  // install dependencies
  await initializeElmPackage(directory);
  for (const packageName in dependencies) {
    if (dependencies.hasOwnProperty(packageName)) {
      const packageVersion = dependencies[packageName];
      await installElmPackage(directory, packageName, packageVersion);
    }
  }

  // add sourceDirectories to elm-package.json
  const pathToElmPackageJson = resolve(directory, "elm-package.json");
  const packageContents = await JSON.parse(
    await readFile(pathToElmPackageJson, "utf8"),
  );
  packageContents["source-directories"] = [...sourceDirectories, "."];
  return writeFile(
    pathToElmPackageJson,
    JSON.stringify(packageContents, null, 4),
    "utf8",
  );
}

function resolvePathToMetadata(workingDirectory: string) {
  return resolve(workingDirectory, "literate-elm-metadata.json");
}
async function readMetadata(workingDirectory: string) {
  return JSON.parse(
    await readFile(resolvePathToMetadata(workingDirectory), "utf8"),
  );
}

async function writeMetadata(
  workingDirectory: string,
  metadata: EnvironmentMetadata,
) {
  return writeFile(
    resolvePathToMetadata(workingDirectory),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );
}
