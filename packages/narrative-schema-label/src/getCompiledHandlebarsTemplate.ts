import { compile } from "handlebars";
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, HandlebarsTemplateDelegate<any> | Error>({
  max: 1000,
});

export const getCompiledHandlebarsTemplate = (
  htmlTemplate: string,
): HandlebarsTemplateDelegate<any> => {
  const cachedTemplate = cache.get(htmlTemplate);

  if (!cachedTemplate) {
    try {
      const compiledTemplate = compile(htmlTemplate);
      compiledTemplate({});
      cache.set(htmlTemplate, compiledTemplate);

      return compiledTemplate;
    } catch (error) {
      cache.set(
        htmlTemplate,
        error instanceof Error ? error : new Error(String(error)),
      );

      throw error;
    }
  }

  if (cachedTemplate instanceof Error) {
    throw cachedTemplate;
  } else {
    return cachedTemplate;
  }
};
