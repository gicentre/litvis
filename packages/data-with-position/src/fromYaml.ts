import {
  Kind,
  load,
  YamlMap,
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
} from "yaml-ast-parser";

import { kindKey, positionKey } from "./keys";
import { DataKind, DataWithPosition, Position } from "./types";

// The following code is inspired by
// https://github.com/yldio/pseudo-yaml-ast

const isBetween = (start: number, pos: number, end: number) =>
  pos <= end && pos >= start;

const calculatePosition = (input: string, { start, end }: { start: number, end: number }) => {
  const lines = input.split(/\n/);

  const position: Position = {
    start: {
      line: -1,
      column: -1,
    },
    end: {
      line: -1,
      column: -1,
    },
  };

  let sum = 0;

  for (const i of lines.keys()) {
    const line = lines[i];
    const ls = sum;
    const le = sum + (line?.length ?? 0);

    if (position.start.line === -1 && isBetween(ls, start, le)) {
      position.start.line = i + 1;
      position.start.column = start - ls + 1;
    }

    if (position.end.line === -1 && isBetween(ls, end, le)) {
      position.end.line = i + 1;
      position.end.column = end - ls + 1;
    }

    sum = le + 1; // +1 because the break is also a char
  }

  return position;
};

const wrappedScalar = (Constructor: any, kind: DataKind, value: any, position: Position) => {
  const v = new Constructor(value);
  v[positionKey] = position;
  v[kindKey] = kind;

  return v;
};

const returnNull = () => null;
const wrappedNull = (position: Position) => ({
  [positionKey]: position,
  [kindKey]: "null",
  valueOf: returnNull as any,
});

const visitorByNodeKind: Record<
  number,
  // Kind,
  (
    node: YAMLNode,
    input: string,
    ctx: unknown[] | Record<string, unknown> | undefined,
  ) => void
> = {};

const walk = (nodes: YAMLNode[], input: string, ctx: unknown[] | Record<string, unknown> | undefined = {}) => {
  const onNode = (node: YAMLNode, ctx2: unknown[] | Record<string, unknown> | undefined, fallback: any) => {
    const visitor = node
      ? visitorByNodeKind[node.kind]
      : visitorByNodeKind[Kind.SCALAR];

    return visitor ? visitor(node, input, ctx2) : fallback;
  };

  const walkObj = () =>
    nodes.reduce((sum, node) => {
      return onNode(node, sum, sum);
    }, ctx);

  const walkArr = () =>
    nodes.map((node) => onNode(node, ctx, null), ctx).filter(Boolean);

  return Array.isArray(ctx) ? walkArr() : walkObj();
};

visitorByNodeKind[Kind.MAP] = (node: YamlMap, input, ctx) => {
  return Object.assign(walk(node.mappings, input), {
    [positionKey]: calculatePosition(input, {
      start: node.startPosition,
      end: node.endPosition,
    }),
    [kindKey]: "object",
  });
};

visitorByNodeKind[Kind.MAPPING] = (node: YAMLMapping, input, ctx) => {
  const value = walk([node.value], input);

  if (node.value === null) {
    return Object.assign(ctx, {
      [node.key.value]: wrappedNull(
        calculatePosition(input, {
          start: node.startPosition,
          end: node.endPosition,
        }),
      ),
    });
  }

  value[positionKey] = calculatePosition(input, {
    start: node.startPosition,
    end: node.endPosition,
  });

  return Object.assign(ctx, {
    [node.key.value]: value,
  });
};

visitorByNodeKind[Kind.SCALAR] = (node: YAMLScalar, input) => {
  if (!node) {
    return;
  }

  const position = calculatePosition(input, {
    start: node.startPosition,
    end: node.endPosition,
  });

  if (typeof node.valueObject === "boolean") {
    return wrappedScalar(Boolean, "boolean", node.valueObject, position);
  } else if (typeof node.valueObject === "number") {
    return wrappedScalar(Number, "number", node.valueObject, position);
  } else if (node.valueObject === null || node.value === null) {
    return wrappedNull(position);
  }

  return wrappedScalar(String, "string", node.value, position);
};

visitorByNodeKind[Kind.SEQ] = (node: YAMLSequence, input) => {
  const items = walk(node.items, input, []);

  items[positionKey] = calculatePosition(input, {
    start: node.startPosition,
    end: node.endPosition,
  });
  items[kindKey] = "array";

  return items;
};

export const fromYaml = (input: string): DataWithPosition =>
  walk([load(input)], input);
