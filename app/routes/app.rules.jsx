import { useState } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getProducts } from "../services/shopify/products.server";
import { scanProducts } from "../services/scanner/product-scanner.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const products = await getProducts(admin);
  const scanResult = scanProducts(products);

  return {
    scanResult,
  };
};

export default function ProductCompletenessPage() {
  const { scanResult } = useLoaderData();

  const [selectedIssue, setSelectedIssue] = useState(null);

  const selectedData =
    selectedIssue === "missingDescription"
      ? scanResult.missingDescription
      : selectedIssue === "missingImages"
        ? scanResult.missingImages
        : selectedIssue === "missingSku"
          ? scanResult.missingSku
          : selectedIssue === "missingBarcode"
            ? scanResult.missingBarcode
            : selectedIssue === "missingAltText"
              ? scanResult.missingAltText
              : null;

  return (
    <s-page heading="Product Completeness Checker">
      {/* <s-section heading="Log">
        <s-paragraph>
          {JSON.stringify(scanResult.missingDescription, null, 2)}
        </s-paragraph>
      </s-section> */}

      <s-section heading="Scan Result">
        <s-paragraph>
          Total Products: {scanResult.totalProducts}
        </s-paragraph>
      </s-section>

      <s-section heading="Issues">
        <s-stack direction="inline" gap="base">
          <s-button onClick={() => setSelectedIssue("missingDescription")} icon={scanResult.missingDescription.count > 0 ? "alert-octagon-filled" : "check-circle-filled"}>
            Missing Description ({scanResult.missingDescription.count})
          </s-button>

          <s-button onClick={() => setSelectedIssue("missingImages")}>
            Missing Images ({scanResult.missingImages.count})
          </s-button>

          <s-button onClick={() => setSelectedIssue("missingSku")}>
            Missing SKU ({scanResult.missingSku.count})
          </s-button>

          <s-button onClick={() => setSelectedIssue("missingBarcode")}>
            Missing Barcode ({scanResult.missingBarcode.count})
          </s-button>

          <s-button onClick={() => setSelectedIssue("missingAltText")}>
            Missing Alt Text ({scanResult.missingAltText.count})
          </s-button>
        </s-stack>
      </s-section>

      {selectedIssue === "missingDescription" && (
        <s-section heading="Products with Missing Description">
          <s-unordered-list>
            {selectedData.products.map((product) => (
              <s-list-item key={product.id}>
                <s-link href={`shopify://admin/products/${product.legacyResourceId}`}>{product.title}</s-link>
              </s-list-item>
            ))}
          </s-unordered-list>
        </s-section>
      )}

      {selectedIssue === "missingImages" && (
        <s-section heading="Products with Missing Images">
          {selectedData.products.map((product) => (
            <s-paragraph key={product.id}>
              {product.title}
            </s-paragraph>
          ))}
        </s-section>
      )}

      {selectedIssue === "missingSku" && (
        <s-section heading="Variants with Missing SKU">
          {selectedData.variants.map((item) => (
            <s-paragraph key={item.variantId}>
              <a
                href={`shopify://admin/products/${item.productLegacyId}`}
              >
                {item.productTitle}
              </a>

              {" - "}

              <a
                href={`shopify://admin/products/${item.productLegacyId}/variants/${item.variantLegacyId}`}
              >
                {item.variantTitle}
              </a>
            </s-paragraph>
          ))}
        </s-section>
      )}

      {selectedIssue === "missingBarcode" && (
        <s-section heading="Variants with Missing Barcode">
          {selectedData.variants.map((item) => (
            <s-paragraph key={item.variantId}>
              {item.productTitle} - {item.variantTitle}
            </s-paragraph>
          ))}
        </s-section>
      )}

      {selectedIssue === "missingAltText" && (
        <s-section heading="Images with Missing Alt Text">
          {selectedData.media.map((item) => (
            <s-paragraph key={item.mediaId}>
              {item.productTitle}
            </s-paragraph>
          ))}
        </s-section>
      )}
    </s-page>
  );
}