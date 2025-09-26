import { compile } from "handlebars";
import LRU from "lru-cache";

const cache = new LRU<string, HandlebarsTemplateDelegate<any> | Error>(1000);

export const getCompiledHandlebarsTemplate = (htmlTemplate: string) => {
  if (!cache.get(htmlTemplate)) {
    try {
      const compiledTemplate = compile(htmlTemplate);
      compiledTemplate({});
      cache.set(htmlTemplate, compiledTemplate);
    } catch (error) {
      cache.set(
        htmlTemplate,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  if (cache.get(htmlTemplate) instanceof Error) {
    throw cache.get(htmlTemplate);
  } else {
    return cache.get(htmlTemplate);
  }
};
