import { ensureDir, pathExists, readFile, writeFile } from "fs-extra";
import * as hash from "object-hash";
import { resolve } from "path";
import { ensureUnlocked, lock, touch, unlock } from "./auxFiles";
import { collectGarbageIfNeeded } from "./gc";
import { initializeElmProject, installElmPackage, patchElmJson } from "./tools";
import {
  Dependencies,
  Environment,
  EnvironmentMetadata,
  EnvironmentSpec,
  EnvironmentStatus,
} from "./types";

const CACHE_SHAPE_VERSION = "v1";
const CACHE_DIRECTORY_SALT = "v0.19";
const DEFAULT_TIMEOUT = 30000;
const PROJECT_EXPIRY_WITH_ERRORS = 1000 * 60;
const PROJECT_EXPIRY_WITH_NO_ELM_FOUND = 1000 * 5;
// const PROJECT_EXPIRY_WITH_LATEST = 1000 * 60 * 60 * 24 * 7;

export async function ensureEnvironment(
  spec: EnvironmentSpec,
  literateElmDirectory: string,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Environment> {
  const now = +new Date();

  const currentCacheDirectory = resolve(
    literateElmDirectory,
    CACHE_SHAPE_VERSION,
  );

  try {
    await ensureUnlocked(literateElmDirectory);
  } catch (e) {
    // resetting directory lock (garbage collector in another process could get stuck)
    unlock(literateElmDirectory);
  }
  await collectGarbageIfNeeded(literateElmDirectory);

  const specDirectory = resolve(
    currentCacheDirectory,
    `spec${hash({ spec, CACHE_DIRECTORY_SALT })}`,
  );
  try {
    await ensureDir(specDirectory);
    const specJsonPath = resolve(specDirectory, `spec.json`);
    if (!(await pathExists(specJsonPath))) {
      await writeFile(specJsonPath, JSON.stringify(spec, null, 4), "utf8");
    }
  } catch (e) {
    return {
      spec,
      workingDirectory: specDirectory,
      metadata: {
        createdAt: now,
        status: EnvironmentStatus.ERROR,
        errorMessage: `Could not create directory ${specDirectory}`,
      },
    };
  }

  // attempt to restore existing environment
  const currentWorkingDirectoryLocatorPath = resolve(specDirectory, "wd");
  try {
    await ensureUnlocked(specDirectory, timeout);
    const workingSubdirectory = await readFile(
      currentWorkingDirectoryLocatorPath,
      "utf8",
    );
    const workingDirectory = resolve(specDirectory, workingSubdirectory);
    const metadata = JSON.parse(
      await readFile(resolvePathToMetadata(workingDirectory), "utf8"),
    ) as EnvironmentMetadata;
    if (metadata.expiresAt && metadata.expiresAt < now) {
      throw new Error("Expired");
    }
    return {
      metadata,
      spec,
      workingDirectory,
    };
  } catch (e) {
    //
  }

  try {
    await lock(specDirectory);
    const workingSubdirectory = `wd${now}`;
    const workingDirectory = resolve(specDirectory, workingSubdirectory);
    await ensureDir(workingDirectory);

    let metadata: EnvironmentMetadata;
    try {
      await prepareElmApplication(
        workingDirectory,
        spec.dependencies,
        spec.sourceDirectories,
      );
      metadata = {
        status: EnvironmentStatus.READY,
        createdAt: now,
      };
    } catch (e) {
      await touch(resolve(workingDirectory, "ProgramFORGC"));
      const isElmFound =
        `${e.message}`.indexOf("ENOENT") === -1 &&
        `${e.message}`.indexOf("No elm global binary available") === -1;
      metadata = {
        status: EnvironmentStatus.ERROR,
        createdAt: now,
        expiresAt:
          now +
          (isElmFound
            ? PROJECT_EXPIRY_WITH_ERRORS
            : PROJECT_EXPIRY_WITH_NO_ELM_FOUND),
        errorMessage: isElmFound
          ? e.message
          : 'I am having trouble finding Elm on your machine. Is it installed? Check by opening a terminal window and typing "elm --version" (without quotation marks). If you have recently installed Elm, try restarting your machine.',
      };
    }

    await writeFile(
      resolvePathToMetadata(workingDirectory),
      JSON.stringify(metadata, null, 2),
      "utf8",
    );
    await writeFile(
      currentWorkingDirectoryLocatorPath,
      workingSubdirectory,
      "utf8",
    );
    return {
      spec,
      workingDirectory,
      metadata,
    };
  } catch (e) {
    return {
      spec,
      workingDirectory: specDirectory,
      metadata: {
        createdAt: now,
        status: EnvironmentStatus.ERROR,
        errorMessage: e.message,
      },
    };
  } finally {
    await unlock(specDirectory);
  }
}

async function prepareElmApplication(
  directory,
  dependencies: Dependencies,
  sourceDirectories: string[],
) {
  // install dependencies
  await initializeElmProject(directory);
  let userRequestsJsonPackage = false;
  for (const packageName in dependencies) {
    if (dependencies.hasOwnProperty(packageName)) {
      const packageVersion = dependencies[packageName];
      await installElmPackage(directory, packageName, packageVersion);
      if (packageName === "elm/json") {
        userRequestsJsonPackage = true;
      }
    }
  }
  if (!userRequestsJsonPackage) {
    await installElmPackage(directory, "elm/json", "latest");
  }

  // add sourceDirectories to elm.json
  await patchElmJson(directory, (elmJson) => {
    elmJson["source-directories"] = [...sourceDirectories, "."];
  });
}

function resolvePathToMetadata(workingDirectory: string) {
  return resolve(workingDirectory, "literate-elm-metadata.json");
}
