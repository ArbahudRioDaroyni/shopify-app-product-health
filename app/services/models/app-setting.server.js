import db from "../../db.server.js";

export const DEFAULT_APP_SETTINGS = {
  highPenalty: 15,
  mediumPenalty: 5,
  lowPenalty: 2,
  maxHighPenalty: 60,
  maxMediumPenalty: 30,
  maxLowPenalty: 10,
  autoReconcileDays: 7,
  disabledRuleIds: [],
};

export async function getAppSetting({shopId}) {
  let setting = await db.appSetting.findUnique({
    where: { shopId },
  });

  if (!setting) {
    setting = await db.appSetting.create({
      data: {
        shopId,
        disabledRuleIds: JSON.stringify(DEFAULT_APP_SETTINGS.disabledRuleIds),
      },
    });
  }

  return {
    ...setting,
    disabledRuleIds: JSON.parse(setting.disabledRuleIds || "[]"),
  };
}

/**
  Update atau Upsert AppSetting berdasarkan shopId.
 */
export async function updateAppSetting({shopId, data}) {
  const payload = { ...data };

  // Konversi array disabledRuleIds ke JSON string jika ada
  if (Array.isArray(payload.disabledRuleIds)) {
    payload.disabledRuleIds = JSON.stringify(payload.disabledRuleIds);
  }

  // Sanitasi input number
  const numericKeys = [
    "highPenalty",
    "mediumPenalty",
    "lowPenalty",
    "maxHighPenalty",
    "maxMediumPenalty",
    "maxLowPenalty",
    "autoReconcileDays",
  ];

  numericKeys.forEach((key) => {
    if (payload[key] !== undefined) {
      payload[key] = Number(payload[key]);
    }
  });

  const updated = await db.appSetting.upsert({
    where: { shopId },
    update: payload,
    create: {
      shopId,
      ...DEFAULT_APP_SETTINGS,
      ...payload,
      disabledRuleIds: JSON.stringify(payload.disabledRuleIds || []),
    },
  });

  return {
    ...updated,
    disabledRuleIds: JSON.parse(updated.disabledRuleIds || "[]"),
  };
}