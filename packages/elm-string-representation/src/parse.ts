const processChunksOutsideQuotedStrings = (
  input: string,
  processChunk: (chunk: string) => string,
) => {
  let insideString = false;
  const inputChunks = input.split('"');
  const outputChunks: string[] = [];

  inputChunks.forEach((chunk) => {
    if (insideString) {
      outputChunks.push(chunk);
      if (!chunk.endsWith("\\")) {
        insideString = false;
      }
    } else {
      outputChunks.push(processChunk(chunk));
      insideString = true;
    }
  });

  return outputChunks.join('"');
};

/**
 * Scans through the object and replaces children like {"0": ..., "1": ..., "2": ...} into arrays.
 * Does not mutate the original object.
 */
const recursivelyConvertApplicableObjectsToArrays = (obj: unknown) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // apply the same function recursively for each key
  let childrenHaveChanged = false;
  const changedChildren: Record<string, unknown> = {};
  for (const key in obj) {
    // istanbul ignore next
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newChild = recursivelyConvertApplicableObjectsToArrays(
        obj[key as keyof typeof obj],
      );
      if (newChild !== obj[key as keyof typeof obj]) {
        childrenHaveChanged = true;
        changedChildren[key] = newChild;
      }
    }
  }

  const resultingObject = childrenHaveChanged
    ? { ...obj, ...changedChildren }
    : obj;

  // convert any object that has only sequential numeric keys into an array
  const arrayValues: any[] = [];
  let nextExpectedKey = 0;
  for (const key in resultingObject) {
    // istanbul ignore next
    if (Object.prototype.hasOwnProperty.call(resultingObject, key)) {
      // stop object scanning if the given key does not belong to a numeric sequence
      if (parseInt(key, 10) !== nextExpectedKey) {
        return resultingObject;
      }
      nextExpectedKey += 1;
      arrayValues.push(resultingObject[key as keyof typeof resultingObject]);
    }
  }

  // reaching the end of loop means that the object needs to be converted
  return arrayValues;
};

/**
 * Parses Elm string representation into a corresponding JS value.
 *
 * It is recommended to use parseUsingCache() instead as it is using LRU cache.
 *
 * Examples:
 * * '' -> null
 * * '42' -> 42
 * * '"42"' -> "42" (string)
 * * '{a = 1, b = 2}' -> {a: 1, b: 2} (json)
 * * '{0 = "a", 1 = 42}' -> ["a", 42] (array)
 *
 * Array detection and conversion works recursively.
 */
export const parse = (text: string): unknown => {
  if (typeof text !== "string") {
    throw new Error(`Expected text to be string, "${typeof text}" given`);
  }
  if (!text.length) {
    return null;
  }

  // Replacing using regexps is potentially error-prone.
  // The method may be rewritten as a tokenizer
  // and a grammar parser to avoid this.
  const processedText = processChunksOutsideQuotedStrings(text, (chunk) =>
    processChunksOutsideQuotedStrings(
      chunk.replace(/(,|{) (((?! = ).)*) = /g, '$1 "$2": '), // wrap keys into quotes to avoid character replacement within
      (subChunk) => {
        if (subChunk === "True") {
          return "true";
        } else if (subChunk === "False") {
          return "false";
        }

        return subChunk
          .replace(/<function>/g, '"<function>"')
          .replace(/([^$a-zA-Z_0-9])True([^$a-zA-Z_0-9])/g, "$1true$2")
          .replace(/([^$a-zA-Z_0-9])False([^$a-zA-Z_0-9])/g, "$1false$2")
          .replace(/(,|{) = /g, '$1 "": ')
          .replace(/\(/g, "[")
          .replace(/\)/g, "]");
      },
    ),
  );

  try {
    return recursivelyConvertApplicableObjectsToArrays(
      JSON.parse(processedText),
    );
  } catch (e) {
    throw new Error(
      `Could not parse "${
        text.length <= 20 ? text : `${text.substring(0, 15)}...`
      }"`,
    );
  }
};
