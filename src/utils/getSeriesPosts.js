/** @typedef {import("astro:content").CollectionEntry<"blog">} BlogPost */

/**
 * @param {string | Date} date
 */
const getTime = date => new Date(date).getTime();

/**
 * @param {BlogPost} post
 */
const getSeriesOrder = post => {
  const order = Number(post.data.seriesOrder);
  return Number.isFinite(order) ? order : undefined;
};

/**
 * @param {BlogPost} a
 * @param {BlogPost} b
 */
const compareSeriesPosts = (a, b) => {
  const aOrder = getSeriesOrder(a);
  const bOrder = getSeriesOrder(b);
  const aHasOrder = aOrder !== undefined;
  const bHasOrder = bOrder !== undefined;

  if (aHasOrder && bHasOrder && aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  if (aHasOrder !== bHasOrder) {
    return aHasOrder ? -1 : 1;
  }

  const dateDiff = getTime(a.data.pubDatetime) - getTime(b.data.pubDatetime);
  if (dateDiff !== 0) return dateDiff;

  return a.id.localeCompare(b.id);
};

/**
 * @param {BlogPost[]} posts
 * @param {string | undefined} series
 * @returns {BlogPost[]}
 */
const getSeriesPosts = (posts, series) => {
  const normalizedSeries = series?.trim();
  if (!normalizedSeries) return [];

  return posts
    .filter(post => post.data.series?.trim() === normalizedSeries)
    .sort(compareSeriesPosts);
};

export { compareSeriesPosts, getSeriesOrder };
export default getSeriesPosts;
