import { inventoryNotTracked } from "./inventory-not-tracked.js";
import { lowStock } from "./low-stock.js";
import { outOfStock } from "./out-of-stock.js";

export const inventoryRules = [
	inventoryNotTracked,
	lowStock,
	outOfStock
];
