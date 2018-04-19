import { XmlEntities } from "html-entities";

const entities = new XmlEntities();

export default (html) =>
  html
    .replace(
      /<p>(<litvis-narrative-schema-label>.*<\/litvis-narrative-schema-label>)<\/p>/g,
      "$1",
    )
    .replace(
      /<litvis-narrative-schema-label>(.*)<\/litvis-narrative-schema-label>/g,
      (_, inner) => entities.decode(inner),
    );
