import * as jsonschema from "jsonschema";
import schema = require("../schema.js");

const validator = new jsonschema.Validator();

export default (json) => validator.validate(json, schema);
