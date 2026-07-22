import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

const MATH_BLOG_PATH = `${BLOG_PATH}/AI/数学/`;
const CHINESE_PUNCTUATION = /([、，。：；！？（）《》【】])/;

function getMathPostSlug(filePath: string | undefined) {
  const normalizedPath = filePath?.replaceAll("\\", "/");

  if (!normalizedPath?.startsWith(MATH_BLOG_PATH)) return;

  const fileName = normalizedPath.split("/").at(-1)?.replace(/\.md$/i, "");

  return fileName
    ?.split(CHINESE_PUNCTUATION)
    .map(part => (CHINESE_PUNCTUATION.test(part) ? part : slugifyStr(part)))
    .join("");
}

/**
 * Get full path of a blog post
 * @param id - id of the blog post (aka slug)
 * @param filePath - the blog post full file location
 * @param includeBase - whether to include `/posts` in return value
 * @returns blog post path
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== "") // remove empty string in the segments ["", "other-path"] <- empty string will be removed
    .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
    .slice(0, -1) // remove the last segment_ file name_ since it's unnecessary
    .map(segment => slugifyStr(segment)); // slugify each segment path

  const basePath = includeBase ? "/posts" : "";

  // Making sure `id` does not contain the directory
  const blogId = id.split("/");
  const slug =
    getMathPostSlug(filePath) ??
    (blogId.length > 0 ? blogId.slice(-1) : blogId);

  // If not inside the sub-dir, simply return the file path
  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }

  return [basePath, ...pathSegments, slug].join("/");
}
