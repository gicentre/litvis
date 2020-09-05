import fs from "fs";
import globby from "globby";
import kindOf from "kind-of";
import _ from "lodash";
import path from "path";

import { FromYamlTestCaseConfig } from "./__fixtures__/types";
import { fromYaml } from "./fromYaml";
import { getKind } from "./getKind";
import { getPosition } from "./getPosition";
import { getValue } from "./getValue";

const yamlPaths = globby.sync(`__fixtures__/fromYaml/*.yaml`, {
  cwd: __dirname,
  absolute: true,
});
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

      if (nodeDefinition.expectedKind) {
        test(`path ${pathAsStr} has expected position`, () => {
          expect(getKind(node)).toEqual(nodeDefinition.expectedKind);
          expect(kindOf(getValue(node))).toEqual(getKind(node));
        });
      }

      if (nodeDefinition.expectedKind === "undefined") {
        return;
      }

      test(`path ${pathAsStr} contains node`, () => {
        expect(node).toBeDefined();
      });

      if (!node) {
        return;
      }

      if (nodeDefinition.expectedObjectKeys) {
        test(`path ${pathAsStr} has object keys ${nodeDefinition.expectedObjectKeys}`, () => {
          expect(Object.keys(node)).toEqual(nodeDefinition.expectedObjectKeys);
          let count = 0;
          for (const key in node) {
            if (node.hasOwnProperty(key)) {
              expect(node[key]).toBeDefined();
              count += 1;
            }
          }
          expect(count).toEqual(nodeDefinition.expectedObjectKeys!.length);
        });
      }

      if (Number.isFinite(nodeDefinition.expectedArrayLength!)) {
        test(`path ${pathAsStr} has expected length`, () => {
          expect(node.length).toEqual(nodeDefinition.expectedArrayLength);

          let lastSeenIndex = -1;
          for (const el of node) {
            lastSeenIndex += 1;
            expect(el).toEqual(node[lastSeenIndex]);
          }
          expect(lastSeenIndex).toEqual(
            nodeDefinition.expectedArrayLength! - 1,
          );

          for (let i = 0; i < node.length; i += 1) {
            expect(node[i]).toBeDefined();
          }
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
