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
export default (text: string): any => {
  if (typeof text !== "string") {
    throw new Error(`Expected text to be string, "${typeof text}" given`);
  }
  if (!text.length) {
    return null;
  }

  // Replacing using regexps is potentially error-prone.
  // The method may be rewritten as a tokenizer
  // and a grammar parser to avoid this.
  const inputChunks = text.split('"');
  const outputChunks: string[] = [];

  let insideString = false;
  inputChunks.forEach((chunk) => {
    if (insideString) {
      outputChunks.push(chunk);
      if (!chunk.endsWith("\\")) {
        insideString = false;
      }
    } else {
      outputChunks.push(
        chunk
          .replace(/ = True/g, " = true")
          .replace(/ = False/g, " = false")
          .replace(/(,|{)(| ([$a-zA-Z_0-9]+)) = /g, '$1 "$3": ')
          .replace(/\(/g, "[")
          .replace(/\)/g, "]"),
      );
      insideString = true;
    }
  });

  try {
    return recursivelyConvertApplicableObjectsToArrays(
      JSON.parse(outputChunks.join('"')),
    );
  } catch (e) {
    throw new Error(
      `Could not parse "${
        text.length <= 20 ? text : `${text.substring(0, 15)}...`
      }"`,
    );
  }
};

/**
 * Scans through the object and replaces children like {"0": ..., "1": ..., "2": ...} into arrays.
 * Does not mutate the original object.
 * @param obj
 */
function recursivelyConvertApplicableObjectsToArrays(obj: object) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // apply the same function recursively for each key
  let childrenHaveChanged = false;
  const changedChildren = {};
  for (const key in obj) {
    // istanbul ignore next
    if (obj.hasOwnProperty(key)) {
      const newChild = recursivelyConvertApplicableObjectsToArrays(obj[key]);
      if (newChild !== obj[key]) {
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
    if (resultingObject.hasOwnProperty(key)) {
      // stop object scanning if the given key does not belong to a numeric sequence
      if (parseInt(key, 10) !== nextExpectedKey) {
        return resultingObject;
      }
      nextExpectedKey += 1;
      arrayValues.push(resultingObject[key]);
    }
  }

  // reaching the end of loop means that the object needs to be converted
  return arrayValues;
}
