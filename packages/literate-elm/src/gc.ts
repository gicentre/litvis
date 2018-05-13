import * as fs from "fs-extra";
import * as globby from "globby";
import * as _ from "lodash";
import { resolve } from "path";
import {
  getLastTouchedAt,
  hasBeenTouchedWithin,
  isLocked,
  lock,
  touch,
  unlock,
} from "./auxFiles";

const GARBAGE_COLLECTION_INTERVAL = 1000 * 60 * 5;
const MAX_PROGRAM_COUNT = 500;
const MAX_PROGRAM_LIFETIME = 1000 * 60 * 60 * 24 * 10;

// const GARBAGE_COLLECTION_INTERVAL = 1000 * 5;
// const MAX_PROGRAM_COUNT = 20;
// const MAX_PROGRAM_LIFETIME = 1000 * 60;

export const collectGarbageIfNeeded = async (literateElmDirectory: string) => {
  const gcFilePath = `${literateElmDirectory}/gc`;
  if (await hasBeenTouchedWithin(gcFilePath, GARBAGE_COLLECTION_INTERVAL)) {
    return;
  }
  if (await isLocked(literateElmDirectory)) {
    return;
  }
  await lock(literateElmDirectory);
  const programRelatedPaths = await globby("*/*/*/Program*.*", {
    cwd: literateElmDirectory,
  });

  const groupedProgramRelatedPaths = _.groupBy(programRelatedPaths, (path) =>
    path.replace(/\..*/, ""),
  );

  const fileGroupInfos = _.map(
    groupedProgramRelatedPaths,
    (filePaths, relativeBasePath) => ({
      relativeSpecDirectory: relativeBasePath.substring(
        0,
        relativeBasePath.indexOf("wd") - 1,
      ),
      relativeWorkingDirectory: relativeBasePath.substring(
        0,
        relativeBasePath.indexOf("Program") - 1,
      ),
      relativeBasePath,
      filePaths,
      lastTouchedAt: 0,
    }),
  );

  const touchedAtResolutionPromises = fileGroupInfos.map((fileGroupInfo) =>
    (async () => {
      const lastTouchedAt = await getLastTouchedAt(
        resolve(literateElmDirectory, fileGroupInfo.relativeBasePath),
      );
      fileGroupInfo.lastTouchedAt = lastTouchedAt;
    })(),
  );
  await Promise.all(touchedAtResolutionPromises);

  const sortedFileGroupInfos = _.orderBy(
    fileGroupInfos,
    "lastTouchedAt",
    "desc",
  );

  const programLifetimeThreshold = +new Date() - MAX_PROGRAM_LIFETIME;
  const fileGroupInfosToRemove: any[] = [];
  const fileGroupInfosToRetain: any[] = [];
  sortedFileGroupInfos.forEach((fileGroupInfo, index) => {
    if (
      index >= MAX_PROGRAM_COUNT ||
      fileGroupInfo.lastTouchedAt < programLifetimeThreshold
    ) {
      fileGroupInfosToRemove.push(fileGroupInfo);
    } else {
      fileGroupInfosToRetain.push(fileGroupInfo);
    }
  });
  const relativeSpecDirectoriesToRetain = _.uniq(
    _.map(fileGroupInfosToRetain, "relativeSpecDirectory"),
  );
  const relativeWorkingDirectoriesToRetain = _.uniq(
    _.map(fileGroupInfosToRetain, "relativeWorkingDirectory"),
  );

  const removedRelativeSpecDirectories: string[] = [];
  const removedRelativeWorkingDirectories: string[] = [];

  const relativePathsToRemove: string[] = [];
  _.forEach(
    fileGroupInfosToRemove,
    ({ relativeSpecDirectory, relativeWorkingDirectory, filePaths }) => {
      if (!_.includes(relativeSpecDirectoriesToRetain, relativeSpecDirectory)) {
        if (
          !_.includes(removedRelativeSpecDirectories, relativeSpecDirectory)
        ) {
          relativePathsToRemove.push(relativeSpecDirectory);
        }
        removedRelativeSpecDirectories.push(relativeSpecDirectory);
        return;
      }

      if (
        !_.includes(
          relativeWorkingDirectoriesToRetain,
          relativeWorkingDirectory,
        )
      ) {
        if (
          !_.includes(
            removedRelativeWorkingDirectories,
            relativeWorkingDirectory,
          )
        ) {
          relativePathsToRemove.push(relativeWorkingDirectory);
        }
        removedRelativeWorkingDirectories.push(relativeWorkingDirectory);
        return;
      }

      _.forEach(filePaths, (filePath) => relativePathsToRemove.push(filePath));
    },
  );

  const removePromises = relativePathsToRemove.map((relativePath) =>
    fs.remove(resolve(literateElmDirectory, relativePath)),
  );
  await Promise.all(removePromises);

  await touch(gcFilePath);
  await unlock(literateElmDirectory);
};
