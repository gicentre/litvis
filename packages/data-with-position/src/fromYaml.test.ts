import * as fs from "fs";
// tslint:disable-next-line:no-implicit-dependencies
import * as globby from "globby";
// tslint:disable-next-line:no-implicit-dependencies
import * as _ from "lodash";
import * as path from "path";
import { FromYamlTestCaseConfig } from "./fixtures/types";
import fromYaml from "./fromYaml";
import getPosition from "./getPosition";
import getValue from "./getValue";

const yamlPaths = globby.sync(`${__dirname}/fixtures/fromYaml/*.yaml`);
_.forEach(yamlPaths, (yamlPath) => {
  const fixtureName = path.basename(yamlPath, ".yaml");
  describe(`fromYaml() for fixture ${fixtureName}`, () => {
    const configPath = yamlPath.replace(/\.yaml$/, ".config");
    const config = require(configPath).default as FromYamlTestCaseConfig;

    const dataWithPosition = fromYaml(fs.readFileSync(yamlPath, "utf-8"));

    config.nodesToCheck.forEach((nodeDefinition) => {
      const pathAsStr = nodeDefinition.path.join(" → ") || "root";
      const node = nodeDefinition.path.length
        ? _.get(dataWithPosition, nodeDefinition.path)
        : dataWithPosition;

      test(`path ${pathAsStr} contains node`, () => {
        expect(node).toBeDefined();
      });

      if (!node) {
        return;
      }

      if (nodeDefinition.expectedObjectKeys) {
        test(`path ${pathAsStr} has object keys ${
          nodeDefinition.expectedObjectKeys
        }`, () => {
          expect(Object.keys(node)).toEqual(nodeDefinition.expectedObjectKeys);
        });
      }

      if (nodeDefinition.expectedPosition) {
        test(`path ${pathAsStr} has expected position`, () => {
          expect(getPosition(node)).toEqual(nodeDefinition.expectedPosition);
        });
      }
      if (
        Object.prototype.hasOwnProperty.call(nodeDefinition, "expectedValue")
      ) {
        test(`path ${pathAsStr} has expected value`, () => {
          expect(getValue(node)).toEqual(nodeDefinition.expectedValue);
        });
      }
    });
  });
});
