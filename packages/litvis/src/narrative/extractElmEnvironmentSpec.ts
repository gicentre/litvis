import { statSync } from "fs";
import * as _ from "lodash";
import { resolve } from "path";
import { LitvisNarrative } from "../types";

export default async (narrative: LitvisNarrative): Promise<void> => {
  // resolve litvisElmDependencies and litvisElmSourceDirectories
  const dependencies = {};
  const sourceDirectories: string[] = [];
  const checkDirectoryPromises: Array<Promise<void>> = [];
  _.forEach(narrative.documents, (file) => {
    _.forEach(
      file.data.litvisElmDependencyVersions,
      (packageVersion, packageName) => {
        if (packageVersion === false) {
          if (dependencies[packageName]) {
            delete dependencies[packageName];
          } else {
            file.info(
              `‘elm.dependencies.${packageName}:’ setting ${packageVersion} to false is only necessary if this packaged is mentioned in upstream documents.`,
              undefined,
              "litvis:elm-dependencies",
            );
          }
          return;
        }
        dependencies[packageName] = packageVersion;
      },
    );
    const resolvedDirsInThisFile = _.map(
      file.data.litvisElmSourceDirectoryPaths,
      (dir: string) => resolve(file.dirname || "", dir),
    );
    _.forEach(
      file.data.litvisElmSourceDirectoryPaths,
      (dir: string, index: number) => {
        const resolvedDir = resolvedDirsInThisFile[index];
        if (_.indexOf(resolvedDirsInThisFile, resolvedDir) < index) {
          file.info(
            `‘elm.source-directories[${index}]:’ directory ${dir} is already mentioned above.`,
            undefined,
            "litvis:elm-source-directories",
          );
        } else if (_.includes(sourceDirectories, resolvedDir)) {
          file.info(
            `‘elm.source-directories[${index}]:’ directory ${dir} is already mentioned in an upstream file.`,
            undefined,
            "litvis:elm-source-directories",
          );
        } else {
          sourceDirectories.push(resolvedDir);
          checkDirectoryPromises.push(
            (async () => {
              try {
                // FIXME: consider async version of stat to prevent thread blocking
                const directoryStat = statSync(resolvedDir);
                if (!directoryStat.isDirectory()) {
                  throw new Error();
                }
              } catch (e) {
                file.info(
                  `‘elm.source-directories[${index}]:’ ${dir} is not an existing directory and is therefore ignored.`,
                  undefined,
                  "litvis:elm-source-directories",
                );
              }
            })(),
          );
        }
      },
    );
  });
  await Promise.all(checkDirectoryPromises);

  narrative.elmEnvironmentSpecForLastFile = {
    dependencies,
    sourceDirectories,
  };
};
