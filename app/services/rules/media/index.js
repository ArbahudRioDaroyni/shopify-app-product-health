import { duplicateImagesAcrossProducts } from "./duplicate-images-across-products.js";
import { missingAltText } from "./missing-alt-text.js";
import { productMissingImages } from "./product-missing-images.js";
import { tooFewImages } from "./too-few-images.js";
import { variantMissingImage } from "./variant-missing-image.js";

export const mediaRules = [
	duplicateImagesAcrossProducts,
	missingAltText,
	productMissingImages,
	tooFewImages,
	variantMissingImage
];
