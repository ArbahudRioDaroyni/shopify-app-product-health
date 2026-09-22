import { duplicateBarcode } from "./duplicate-barcode.js";
import { duplicateSku } from "./duplicate-sku.js";
import { missingBarcode } from "./missing-barcode.js";
import { missingSku } from "./missing-sku.js";
import { missingWeight } from "./missing-weight.js";

export const variantRules = [
	duplicateBarcode,
	duplicateSku,
	missingBarcode,
	missingSku,
	missingWeight
];
