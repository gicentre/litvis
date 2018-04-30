// export const temp = () => {
//   for (const ruleDefinition of narrative.composedNarrativeSchema.rules) {
//     const filteredNodes = _.filter(
//       select(
//         combinedAst,
//         `narrativeSchemaLabel[labelName=${ruleDefinition.data.selector.label}]`,
//       ),
//       (node) => (node as any).data.labelType !== LabelType.PAIRED_CLOSING,
//     );
//     try {
//       if (
//         _.isFinite(ruleDefinition.data.minimumOccurrences) &&
//         filteredNodes.length < ruleDefinition.data.minimumOccurrences!
//       ) {
//         throw new Error("minimumOccurrences");
//       }
//       if (
//         _.isFinite(ruleDefinition.data.maximumOccurrences) &&
//         filteredNodes.length > ruleDefinition.data.maximumOccurrences!
//       ) {
//         throw new Error("maximumOccurrences");
//       }
//     } catch (e) {
//       lastFile.message(
//         ruleDefinition.data.description,
//         lastFile.data.root.position!.end,
//         "litvis:narrative-schema-rule",
//       );
//     }
//   }
// };
