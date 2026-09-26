import db from "../../db.server.js";

const GET_STORE = `#graphql
  query GetShopDetails {
    shop {
      id
      name
      email
      contactEmail
      myshopifyDomain
      primaryDomain {
        url
        host
      }
      currencyCode
      currencyFormats {
        moneyFormat
      }
      timezoneAbbreviation
      ianaTimezone
      plan {
        publicDisplayName
        partnerDevelopment
      }
      # billingAddress {
      #   address1
      #   address2
      #   city
      #   province
      #   country
      #   zip
      # }
    }
  }
`;

export async function getOrCreateShop({ admin }) {
  if (!admin) return;

  const response = await admin.graphql(GET_STORE);
  const { data } = await response.json();

  const shopifyId = String(data.shop.id);
  const shopifyDomain = String(data.shop.primaryDomain.url);

  const shop = await db.shop.upsert({
    where: { shopifyId },
    update: {
      isActive: true,
    },
    create: {
      shopifyId,
      shopifyDomain,
      appSettings: {
        create: {},
      },
    },
    include: {
      appSettings: true,
    },
  });

  shop.details = data.shop;

  return shop;
}

export async function updateShopScanStatus({shopId, status, error = null}) {
  return await db.shop.update({
    where: { id: shopId },
    data: {
      scanStatus: status,
      scanStartedAt: status === "PROCESSING" ? new Date() : undefined,
      lastScanError: error,
    },
  });
}

export async function shouldRunInitialScan(shop) {
  return Boolean(shop.scanStatus === "IDLE" || shop.scanStatus === "FAILED");
}