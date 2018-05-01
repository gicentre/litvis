export default (dataPath: Array<string | number>) => {
  const result: string[] = [];
  dataPath.forEach((pathElement) => {
    if (typeof pathElement === "number" || pathElement.includes(" ")) {
      result.push("[", pathElement.toString(), "]");
    } else {
      result.push(".", pathElement);
    }
  });
  if (result[0] === ".") {
    result.shift();
  }
  return result.join("");
};
