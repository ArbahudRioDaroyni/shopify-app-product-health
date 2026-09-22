import IssueTrendChart from "./chart";

const COLLECTION_TRENDS = [
  [72, 78, 75, 80, 78, 82, 82],
  [84, 80, 88, 84, 89, 87, 92],
  [76, 78, 84, 80, 86, 82, 88],
  [70, 66, 74, 72, 76, 73, 76],
  [68, 65, 72, 70, 75, 72, 71],
  [64, 58, 67, 63, 64, 62, 65],
];

function getTone(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "critical";
}

function getTrend(index) {
  return COLLECTION_TRENDS[index % COLLECTION_TRENDS.length];
}

export default function HealthByCollection({ collections }) {
  return (
    <s-section heading="Health by Collection">
      <s-link slot="secondary-actions" href="#collections">View all</s-link>
      <s-grid gap="none">
        <s-grid
          gridTemplateColumns="1fr 64px 104px"
          gap="small"
          paddingBlock="small-300"
        >
          <s-text tone="subdued">Collection</s-text>
          <s-text tone="subdued">Score</s-text>
          <s-text tone="subdued">Trend</s-text>
        </s-grid>
        {collections.slice(0, 6).map((collection, index) => {
          const tone = getTone(collection.score);

          return (
            <s-grid
              key={collection.id}
              gridTemplateColumns="1fr 64px 104px"
              gap="small"
              alignItems="center"
              borderBlockStart="base"
              paddingBlock="small-300"
            >
              <s-text>{collection.collectionTitle}</s-text>
              <s-text tone={tone}>{collection.score}</s-text>
              <IssueTrendChart data={getTrend(index)} tone={tone} />
            </s-grid>
          );
        })}
      </s-grid>
    </s-section>
  );
}

HealthByCollection.propTypes = {
  collections: (props, propName, componentName) => {
    if (!Array.isArray(props[propName])) {
      return new Error(`${componentName}: collections must be an array`);
    }

    return null;
  },
};
