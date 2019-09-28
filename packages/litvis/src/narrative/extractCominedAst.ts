import _ from "lodash";
import { LitvisNarrative } from "../types";

export default async (narrative: LitvisNarrative): Promise<void> => {
  narrative.combinedAst = {
    type: "parent",
    children: _.map(narrative.documents, (file) => file.data.root),
  };
};
