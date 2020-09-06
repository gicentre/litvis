import { compile } from "handlebars";
import LRU from "lru-cache";

const cache = new LRU(1000);

export const getCompiledHandlebarsTemplate = (htmlTemplate: string) => {
  if (!cache[htmlTemplate]) {
    try {
      cache[htmlTemplate] = compile(htmlTemplate);
      cache[htmlTemplate]();
    } catch (e) {
      cache[htmlTemplate] = e;
    }
  }

  if (cache[htmlTemplate] instanceof Error) {
    throw cache[htmlTemplate];
  } else {
    return cache[htmlTemplate];
  }
};
