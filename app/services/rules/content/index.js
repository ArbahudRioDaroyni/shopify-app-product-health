import { brokenLinks } from "./broken-links.js";
import { excessiveWhitespace } from "./excessive-whitespace.js";
import { placeholderContent } from "./placeholder-content.js";
import { shortDescription } from "./short-description.js";

export const contentRules = [
	brokenLinks,
	excessiveWhitespace,
	placeholderContent,
	shortDescription
];
