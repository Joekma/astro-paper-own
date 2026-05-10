import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";

export type PostCategory = {
  category: string;
  categoryName: string;
};

const splitPath = (path: string) => path.split(/[\\/]/).filter(Boolean);

const getCategoryName = (post: CollectionEntry<"blog">) => {
  const segments = splitPath(post.id);

  if (segments.length > 1) {
    return segments[0];
  }

  const filePathSegments = post.filePath ? splitPath(post.filePath) : [];
  const blogIndex = filePathSegments.findIndex(segment => segment === "blog");

  if (blogIndex >= 0 && filePathSegments.length > blogIndex + 2) {
    return filePathSegments[blogIndex + 1];
  }

  return "\u672a\u5206\u7c7b";
};

export const getPostCategory = (
  post: CollectionEntry<"blog">
): PostCategory => {
  const categoryName = getCategoryName(post);

  return {
    category: slugifyStr(categoryName),
    categoryName,
  };
};
