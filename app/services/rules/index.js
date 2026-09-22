import { contentRules } from "./content/index.js";
import { inventoryRules } from "./inventory/index.js";
import { mediaRules } from "./media/index.js";
import { organizationRules } from "./organization/index.js";
import { pricingRules } from "./pricing/index.js";
import { productRules } from "./product/index.js";
import { seoRules } from "./seo/index.js";
import { variantRules } from "./variant/index.js";

export const rules = [
  ...contentRules,
  ...inventoryRules,
  ...mediaRules,
  ...organizationRules,
  ...pricingRules,
  ...productRules,
  ...seoRules,
  ...variantRules,
];

const ruleIds = new Set();

for (const rule of rules) {
  if (ruleIds.has(rule.id)) {
    throw new Error(`Duplicate rule id: ${rule.id}`);
  }

  ruleIds.add(rule.id);
}