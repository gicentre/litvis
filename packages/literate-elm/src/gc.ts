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
const MAX_PROGRAM_COUNT = 100;
const MAX_PROGRAM_LIFETIME = 1000 * 60 * 60 * 24 * 10;

export const collectGarbageIfNeeded = async (literateElmDirectory: string) => {
  const gcFilePath = `${literateElmDirectory}/gc`;
  if (await hasBeenTouchedWithin(gcFilePath, GARBAGE_COLLECTION_INTERVAL)) {
    return;
  }
  if (await isLocked(literateElmDirectory)) {
    return;
  }
  await lock(literateElmDirectory);
  const programRelatedPaths = await globby("*/*/Program*.*", {
    cwd: literateElmDirectory,
  });
  const groupedProgramRelatedPaths = _.groupBy(programRelatedPaths, (path) =>
    path.replace(/\..*/, ""),
  );

  const fileGroupInfos = _.map(
    groupedProgramRelatedPaths,
    (filePaths, relativeBasePath) => ({
      relativeEnvironmentPath: relativeBasePath.substring(
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
      index > MAX_PROGRAM_COUNT ||
      fileGroupInfo.lastTouchedAt < programLifetimeThreshold
    ) {
      fileGroupInfosToRemove.push(fileGroupInfo);
    } else {
      fileGroupInfosToRetain.push(fileGroupInfo);
    }
  });
  const relativeEnvironmentPathsToRetain = _.uniq(
    _.map(fileGroupInfosToRetain, "relativeEnvironmentPath"),
  );

  const fileGroupInfosToRemoveGroupedByRelativeEnvironmentPath = _.groupBy(
    fileGroupInfosToRemove,
    "relativeEnvironmentPath",
  );
  const removePromises: any[] = [];
  _.forEach(
    fileGroupInfosToRemoveGroupedByRelativeEnvironmentPath,
    (currentFileGroupInfos, relativeEnvironmentPath) => {
      if (
        _.includes(relativeEnvironmentPathsToRetain, relativeEnvironmentPath)
      ) {
        _.forEach(currentFileGroupInfos, (fileGroupInfo) => {
          _.forEach(fileGroupInfo.filePaths, (filePath) => {
            removePromises.push(resolve(literateElmDirectory, filePath));
          });
        });
      } else {
        removePromises.push(
          fs.remove(resolve(literateElmDirectory, relativeEnvironmentPath)),
        );
      }
    },
  );
  await Promise.all(removePromises);
  await touch(gcFilePath);
  await unlock(literateElmDirectory);
};
