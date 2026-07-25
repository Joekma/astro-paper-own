import assert from "node:assert/strict";
import test from "node:test";
import {
  filterSeriesByInitial,
  getSeriesDisplayName,
  getSeriesInitial,
  getSeriesSummaries,
} from "./getSeriesData.js";

const createPost = ({
  id,
  series,
  pubDatetime,
  modDatetime,
  seriesOrder = 1,
}) => ({
  id,
  filePath: `${id}.md`,
  data: {
    title: id,
    description: id,
    tags: [],
    series,
    seriesOrder,
    pubDatetime: new Date(pubDatetime),
    modDatetime: modDatetime ? new Date(modDatetime) : undefined,
  },
});

test("groups series and sorts them by their latest effective update", () => {
  const summaries = getSeriesSummaries([
    createPost({
      id: "python-old",
      series: "python",
      pubDatetime: "2025-01-01T00:00:00.000Z",
      modDatetime: "2025-02-01T00:00:00.000Z",
    }),
    createPost({
      id: "python-new",
      series: "python",
      pubDatetime: "2025-03-01T00:00:00.000Z",
    }),
    createPost({
      id: "network",
      series: "网络",
      pubDatetime: "2025-04-01T00:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    summaries.map(summary => summary.rawName),
    ["网络", "python"]
  );
  assert.equal(summaries[1].posts.length, 2);
  assert.equal(
    summaries[1].latestUpdated.toISOString(),
    "2025-03-01T00:00:00.000Z"
  );
});

test("uses a stable display-name tie-breaker for equal update dates", () => {
  const summaries = getSeriesSummaries([
    createPost({
      id: "vue",
      series: "Vue",
      pubDatetime: "2025-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "python",
      series: "python",
      pubDatetime: "2025-01-01T00:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    summaries.map(summary => summary.displayName),
    ["Python", "Vue"]
  );
});

test("normalizes display aliases without changing raw series identity", () => {
  assert.equal(getSeriesDisplayName(" csharp "), "C#");
  assert.equal(getSeriesDisplayName("ui-automation"), "UI Automation");
  assert.equal(getSeriesDisplayName("AI 多端页面设计"), "AI 多端页面设计");
});

test("derives ASCII and Chinese pinyin initials", () => {
  assert.equal(getSeriesInitial("python"), "P");
  assert.equal(getSeriesInitial("网络"), "W");
  assert.equal(getSeriesInitial("消息队列"), "X");
  assert.equal(getSeriesInitial("设计模式"), "S");
});

test("filters summaries by initial and keeps the existing sort order", () => {
  const summaries = getSeriesSummaries([
    createPost({
      id: "python",
      series: "python",
      pubDatetime: "2025-03-01T00:00:00.000Z",
    }),
    createPost({
      id: "playwright",
      series: "playwright",
      pubDatetime: "2025-02-01T00:00:00.000Z",
    }),
    createPost({
      id: "network",
      series: "网络",
      pubDatetime: "2025-01-01T00:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    filterSeriesByInitial(summaries, "p").map(summary => summary.displayName),
    ["Python", "Playwright"]
  );
  assert.equal(filterSeriesByInitial(summaries).length, 3);
});

test("throws when two raw series names resolve to the same slug", () => {
  assert.throws(
    () =>
      getSeriesSummaries([
        createPost({
          id: "one",
          series: "Same Name",
          pubDatetime: "2025-01-01T00:00:00.000Z",
        }),
        createPost({
          id: "two",
          series: "same-name",
          pubDatetime: "2025-01-02T00:00:00.000Z",
        }),
      ]),
    /Series slug collision/
  );
});
