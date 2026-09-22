import { duplicateTitle } from "./duplicate-title.js";
import { missingDescription } from "./missing-description.js";
import { missingProductType } from "./missing-product-type.js";
import { missingVendor } from "./missing-vendor.js";

export const productRules = [
	duplicateTitle,
	missingDescription,
	missingProductType,
	missingVendor
];
