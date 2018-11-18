const flattenJsonToRawMarkdown = (data: any): string => {
  if (data instanceof Array) {
    return data.map(flattenJsonToRawMarkdown).join(" ");
  }
  if (typeof data === "object" && data !== null) {
    return flattenJsonToRawMarkdown(Object.entries(data));
  }
  return `${data}`;
};

export default flattenJsonToRawMarkdown;
