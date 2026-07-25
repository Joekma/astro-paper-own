import { pinyin } from "pinyin-pro";
import { slugifyStr } from "./slugify.ts";

/** @typedef {import("astro:content").CollectionEntry<"blog">} BlogPost */

const SERIES_DISPLAY_ALIASES = new Map([
  ["csharp", "C#"],
  ["django", "Django"],
  ["flask", "Flask"],
  ["go", "Go"],
  ["llm本地部署", "LLM 本地部署"],
  ["mysql", "MySQL"],
  ["playwright", "Playwright"],
  ["python", "Python"],
  ["selenium", "Selenium"],
  ["ui-automation", "UI Automation"],
]);

const SERIES_NAME_COLLATOR = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

/**
 * @typedef {object} SeriesSummary
 * @property {string} rawName
 * @property {string} displayName
 * @property {string} slug
 * @property {string} initial
 * @property {Date} latestUpdated
 * @property {BlogPost[]} posts
 */

/**
 * @param {string} rawName
 */
const getSeriesDisplayName = rawName => {
  const normalizedName = rawName.trim();
  return (
    SERIES_DISPLAY_ALIASES.get(normalizedName.toLocaleLowerCase("en-US")) ??
    normalizedName
  );
};

/**
 * @param {string} rawName
 */
const getSeriesInitial = rawName => {
  const displayName = getSeriesDisplayName(rawName);
  const firstCharacter = Array.from(displayName.trim())[0] ?? "";

  if (/^[a-z]$/i.test(firstCharacter)) {
    return firstCharacter.toUpperCase();
  }

  const romanizedInitial = pinyin(firstCharacter, {
    pattern: "first",
    toneType: "none",
  })
    .charAt(0)
    .toUpperCase();

  return /^[A-Z]$/.test(romanizedInitial) ? romanizedInitial : "";
};

/**
 * @param {BlogPost} post
 */
const getPostUpdatedTime = post =>
  new Date(post.data.modDatetime ?? post.data.pubDatetime).getTime();

/**
 * @param {BlogPost[]} posts
 * @returns {SeriesSummary[]}
 */
const getSeriesSummaries = posts => {
  /** @type {Map<string, SeriesSummary>} */
  const summariesByName = new Map();

  for (const post of posts) {
    const rawName = post.data.series?.trim();
    if (!rawName) continue;

    const updatedTime = getPostUpdatedTime(post);
    const existingSummary = summariesByName.get(rawName);

    if (existingSummary) {
      existingSummary.posts.push(post);
      if (updatedTime > existingSummary.latestUpdated.getTime()) {
        existingSummary.latestUpdated = new Date(updatedTime);
      }
      continue;
    }

    summariesByName.set(rawName, {
      rawName,
      displayName: getSeriesDisplayName(rawName),
      slug: slugifyStr(rawName),
      initial: getSeriesInitial(rawName),
      latestUpdated: new Date(updatedTime),
      posts: [post],
    });
  }

  const summaries = Array.from(summariesByName.values()).sort((a, b) => {
    const dateDifference =
      b.latestUpdated.getTime() - a.latestUpdated.getTime();

    return (
      dateDifference ||
      SERIES_NAME_COLLATOR.compare(a.displayName, b.displayName)
    );
  });

  const seriesBySlug = new Map();
  for (const summary of summaries) {
    const existingName = seriesBySlug.get(summary.slug);
    if (existingName && existingName !== summary.rawName) {
      throw new Error(
        `Series slug collision: "${existingName}" and "${summary.rawName}" both resolve to "${summary.slug}".`
      );
    }
    seriesBySlug.set(summary.slug, summary.rawName);
  }

  return summaries;
};

/**
 * @param {SeriesSummary[]} summaries
 * @param {string | undefined} initial
 */
const filterSeriesByInitial = (summaries, initial) => {
  const normalizedInitial = initial?.trim().toUpperCase();
  if (!normalizedInitial) return summaries;

  return summaries.filter(summary => summary.initial === normalizedInitial);
};

export {
  filterSeriesByInitial,
  getPostUpdatedTime,
  getSeriesDisplayName,
  getSeriesInitial,
  getSeriesSummaries,
};
