import { invalidCompareAtPrice } from "./invalid-compare-at-price.js";
import { invalidPrice } from "./invalid-price.js";
import { missingPrice } from "./missing-price.js";
import { priceIsZero } from "./price-is-zero.js";

export const pricingRules = [
	invalidCompareAtPrice,
	invalidPrice,
	missingPrice,
	priceIsZero
];
