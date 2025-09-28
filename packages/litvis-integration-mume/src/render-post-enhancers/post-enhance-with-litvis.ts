import type { AnyNode, Cheerio, CheerioAPI } from "cheerio";
import cheerio from "cheerio";
import { decode } from "html-entities";
import type { LitvisDocument, LitvisNarrative } from "litvis";
import { listNarrativeFiles } from "litvis";
import _ from "lodash";
import type { EntityDefinitionWithOrigin } from "narrative-schema-common";
import type { Position } from "unist";
import type { VFile } from "vfile";

const findOrFilter = (
  $: CheerioAPI,
  func: (selector: string) => Cheerio<AnyNode>,
  selector: any,
): Cheerio<AnyNode> => {
  const cheerioSelectorParts: string[] = [];
  if (selector) {
    cheerioSelectorParts.push(`[ns-role="label"]`);
    cheerioSelectorParts.push(`[ns-label-name="${selector.label}"]`);
    if (selector.kind) {
      cheerioSelectorParts.push(`[ns-label-kind="${selector.kind}"]`);
    }
  }
  let $result = func(cheerioSelectorParts.join(""));
  if (selector.trimmedContent) {
    $result = $result.filter(
      (i, element) =>
        $(element as AnyNode)
          .text()
          .trim() === selector.trimmedContent,
    );
  }

  return $result;
};

const find = (
  $: CheerioAPI,
  $where: Cheerio<AnyNode>,
  selector: any,
): Cheerio<AnyNode> => {
  return findOrFilter($, $where.find.bind($where), selector);
};
const filter = (
  $: CheerioAPI,
  $what: Cheerio<AnyNode>,
  selector: any,
): Cheerio<AnyNode> => {
  return findOrFilter(
    $,
    // @ts-expect-error - investigate type mismatch
    $what.filter.bind($what),
    selector,
  );
};
const ruleIsNotFollowed = (
  position?: Position,
): Error & { position?: Position } => {
  const result = new Error("rule is not followed") as Error & {
    position?: Position;
  };
  if (position) {
    result.position = position;
  }

  return result;
};

const elementPosition = ($el: Cheerio<AnyNode>): Position | undefined => {
  const startColumn = parseInt($el.attr("ns-position-start-column") || "0", 10);
  const startLine = parseInt($el.attr("ns-position-start-line") || "0", 10);
  const endColumn = parseInt($el.attr("ns-position-end-column") || "0", 10);
  const endLine = parseInt($el.attr("ns-position-end-line") || "0", 10);
  if (
    Number.isFinite(startColumn) &&
    Number.isFinite(startLine) &&
    Number.isFinite(endColumn) &&
    Number.isFinite(endLine)
  ) {
    return {
      start: {
        column: startColumn,
        line: startLine,
      },
      end: {
        column: endColumn,
        line: endLine,
      },
    };
  }

  return undefined;
};

export const postEnhanceWithLitvis = (
  processedNarrative: LitvisNarrative,
  html: string,
  updateLintingReport: (vFiles: VFile[]) => void,
) => {
  // hack labels
  // TODO: replace with a cleaner implementation
  const postEnhancedHtml = html
    // block labels
    .replace(
      /<p>(<litvis-narrative-schema-label>.*<\/litvis-narrative-schema-label>)<\/p>/g,
      "$1",
    )
    // inline labels
    .replace(
      /<litvis-narrative-schema-label>(.*)<\/litvis-narrative-schema-label>/g,
      (outer, inner) => decode(inner),
    );

  // apply rules
  const lastFile = _.last(processedNarrative.documents) as LitvisDocument;

  if (processedNarrative.composedNarrativeSchema) {
    const $ = cheerio.load(postEnhancedHtml, { xmlMode: true });
    const $root = $.root();
    processedNarrative.composedNarrativeSchema.rules.forEach(
      (ruleDefinition: EntityDefinitionWithOrigin) => {
        const ruleData = ruleDefinition.data;
        try {
          const $selection = find($, $root, ruleData.selector);

          // occurrences
          if (
            Number.isFinite(ruleData.minimumOccurrences) &&
            $selection.length < ruleData.minimumOccurrences
          ) {
            throw ruleIsNotFollowed();
          }
          if (
            Number.isFinite(ruleData.maximumOccurrences) &&
            $selection.length > ruleData.maximumOccurrences
          ) {
            throw ruleIsNotFollowed();
          }

          // single-element rules
          $selection.each((i, el) => {
            const $el = $(el as AnyNode);
            // children.minimumTrimmedTextLength
            if (
              ruleData.children &&
              Number.isFinite(ruleData.children.minimumTrimmedTextLength)
            ) {
              const trimmedText = $el.text().trim();
              if (
                trimmedText.length < ruleData.children.minimumTrimmedTextLength
              ) {
                throw ruleIsNotFollowed(elementPosition($el));
              }
            }
            // followedBy
            if (
              ruleData.followedBy &&
              ruleData.followedBy.selector &&
              filter($, $el.next(), ruleData.followedBy.selector).length === 0
            ) {
              throw ruleIsNotFollowed(elementPosition($el));
            }
            // notFollowedBy
            if (
              ruleData.notFollowedBy &&
              ruleData.notFollowedBy.selector &&
              filter($, $el.next(), ruleData.notFollowedBy.selector).length !==
                0
            ) {
              throw ruleIsNotFollowed(elementPosition($el));
            }

            // before
            if (
              ruleData.before &&
              ruleData.before.selector &&
              filter($, $el.nextAll(), ruleData.before.selector).length === 0
            ) {
              throw ruleIsNotFollowed(elementPosition($el));
            }
            // after
            if (
              ruleData.after &&
              ruleData.after.selector &&
              filter($, $el.prevAll(), ruleData.after.selector).length !== 0
            ) {
              throw ruleIsNotFollowed(elementPosition($el));
            }
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "rule is not followed"
          ) {
            lastFile.message(
              ruleData.description,
              (error as Error & { position?: Position }).position,
              "narrative-schema:rule-validation",
            );
          } else {
            // eslint-disable-next-line no-console -- TODO: Add explanation for this rule exception
            console.error(error);
          }
        }
      },
    );
  }

  // update linting report
  if (updateLintingReport) {
    updateLintingReport(listNarrativeFiles(processedNarrative));
  }

  return postEnhancedHtml;
};
