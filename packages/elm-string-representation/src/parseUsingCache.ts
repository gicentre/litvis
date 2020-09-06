import LRU from "lru-cache";

import { parse } from "./parse";

let cache: LRU<string, Error | unknown>;

/**
 * Returns Elm's string representation as a JS value.
 *
 * Unlike parse(), the function uses LRU cache
 * before attempting to parse value.
 *
 * Examples:
 * * '' -> null
 * * '42' -> 42
 * * '"42"' -> "42" (string)
 * * '{a = 1, b = 2}' -> {a: 1, b: 2} (json)
 * * '{0 = "a", 1 = 42}' -> ["a", 42] (array)
 */
export const parseUsingCache = (text: string): unknown => {
  if (!cache) {
    cache = new LRU(100);
  }

  let valueInCache = cache.get(text);
  if (typeof valueInCache === "undefined") {
    try {
      valueInCache = parse(text);
    } catch (e) {
      valueInCache = e;
    }
    cache.set(text, valueInCache);
  }
  if (valueInCache instanceof Error) {
    throw valueInCache;
  }
  return valueInCache;
};
