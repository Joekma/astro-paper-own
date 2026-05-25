import assert from "node:assert/strict";
import test from "node:test";
import getSeriesPosts from "./getSeriesPosts.js";

const createPost = ({
  id,
  series = "React",
  seriesOrder,
  pubDatetime,
  title = id,
}) => ({
  id,
  filePath: `${id}.md`,
  data: {
    title,
    series,
    seriesOrder,
    pubDatetime: new Date(pubDatetime),
  },
});

test("sorts same-series posts by seriesOrder, then unordered posts by publish date", () => {
  const posts = [
    createPost({
      id: "react-unordered-newer",
      pubDatetime: "2024-02-01T00:00:00.000Z",
    }),
    createPost({
      id: "react-order-2",
      seriesOrder: 2,
      pubDatetime: "2024-01-02T00:00:00.000Z",
    }),
    createPost({
      id: "vue-order-1",
      series: "Vue",
      seriesOrder: 1,
      pubDatetime: "2024-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "react-order-1",
      series: " React ",
      seriesOrder: 1,
      pubDatetime: "2024-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "react-unordered-older",
      pubDatetime: "2024-01-15T00:00:00.000Z",
    }),
  ];

  assert.deepEqual(
    getSeriesPosts(posts, "React").map(post => post.id),
    [
      "react-order-1",
      "react-order-2",
      "react-unordered-older",
      "react-unordered-newer",
    ]
  );
});

test("returns an empty list when no series is provided", () => {
  assert.deepEqual(getSeriesPosts([createPost({ id: "react" })]), []);
});

test("sorts numeric string seriesOrder values numerically", () => {
  const posts = [
    createPost({
      id: "a-order-11",
      series: "Avalonia",
      seriesOrder: "11",
      pubDatetime: "2024-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "z-order-1",
      series: "Avalonia",
      seriesOrder: "1",
      pubDatetime: "2024-01-01T00:00:00.000Z",
    }),
  ];

  assert.deepEqual(
    getSeriesPosts(posts, "Avalonia").map(post => post.id),
    ["z-order-1", "a-order-11"]
  );
});
