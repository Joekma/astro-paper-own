import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

interface Tag {
  tag: string;
  tagName: string;
  count: number;
}

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  const tagMap = new Map<string, Tag>();

  posts
    .filter(postFilter)
    .flatMap(post => post.data.tags)
    .forEach(tagName => {
      const tag = slugifyStr(tagName);
      const currentTag = tagMap.get(tag);

      tagMap.set(tag, {
        tag,
        tagName,
        count: currentTag ? currentTag.count + 1 : 1,
      });
    });

  return Array.from(tagMap.values()).sort(
    (tagA, tagB) =>
      tagB.count - tagA.count || tagA.tag.localeCompare(tagB.tag)
  );
};

export default getUniqueTags;
