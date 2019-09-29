import { stat } from "fs-extra";
import _ from "lodash";
import { resolve } from "path";
import { LitvisNarrative } from "../types";

export default async (narrative: LitvisNarrative): Promise<void> => {
  // resolve litvisElmDependencies and litvisElmSourceDirectories
  const dependencies = {};
  const sourceDirectories: string[] = [];
  const checkDirectoryPromises: Array<Promise<void>> = [];
  _.forEach(narrative.documents, (document) => {
    _.forEach(
      document.data.litvisElmDependencyVersions,
      (packageVersion, packageName) => {
        if (packageVersion === false) {
          if (dependencies[packageName]) {
            delete dependencies[packageName];
          } else {
            document.info(
              `‘elm.dependencies.${packageName}:’ setting ${packageVersion} to false is only necessary if this packaged is mentioned in upstream documents.`,
              document.data.litvisElmDependencyPositions![packageName],
              "litvis:elm-dependencies",
            );
          }
          return;
        }
        dependencies[packageName] = packageVersion;
      },
    );
    const resolvedDirsInThisFile = _.map(
      document.data.litvisElmSourceDirectoryPaths,
      (dir: string) => resolve(document.dirname || "", dir),
    );
    _.forEach(
      document.data.litvisElmSourceDirectoryPaths,
      (dir: string, index: number) => {
        const position = document.data.litvisElmSourceDirectoryPositions![
          index
        ];
        const resolvedDir = resolvedDirsInThisFile[index];
        if (_.indexOf(resolvedDirsInThisFile, resolvedDir) < index) {
          document.info(
            `‘elm.source-directories[${index}]:’ directory ${dir} is already mentioned above.`,
            position,
            "litvis:elm-source-directories",
          );
        } else if (_.includes(sourceDirectories, resolvedDir)) {
          document.info(
            `‘elm.source-directories[${index}]:’ directory ${dir} is already mentioned in an upstream file.`,
            position,
            "litvis:elm-source-directories",
          );
        } else {
          checkDirectoryPromises.push(
            (async () => {
              try {
                const directoryStat = await stat(resolvedDir);
                if (!directoryStat.isDirectory()) {
                  throw new Error();
                }
                sourceDirectories.push(resolvedDir);
              } catch (e) {
                document.info(
                  `‘elm.source-directories[${index}]:’ ${dir} is not an existing directory and is therefore ignored.`,
                  position,
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
