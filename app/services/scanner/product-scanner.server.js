import { rules } from "../rules/index.js";

export function scanProducts(products) {
  return rules.map((rule) => ({
    results: rule.check(products),
  }));
}