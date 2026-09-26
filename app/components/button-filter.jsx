import { useState } from "react";
import { toTitleCase } from "../utils/formatters";
import { useNavigation, useSearchParams } from "react-router";

export default function ButtonFilter({
  data = ["default"],
  selected,
  title = "Filter",
  params = "filter",
}) {
  const [activeFilter, setActiveFilter] = useState(String(selected));
  const [_filterParams, setFilterParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleFilter = (value) => {
    setActiveFilter(value);
    setFilterParams(
      (p) => {
        p.set(params, String(value));
        return p;
      },
      { preventScrollReset: true },
    );
  };

  return (
    <>
      <s-button commandFor={`${title}-menu`} disabled={isLoading}>
        {`${toTitleCase(title)}: ${toTitleCase(data.find((f) => f === activeFilter)) || "All"}`}
      </s-button>
      <s-menu
        id={`${title}-menu`}
        accessibilityLabel={`Filter ${title.toLowerCase()} menu action`}
      >
        {data.map((filter) => (
          <s-button
            key={filter}
            icon={activeFilter === filter ? "check" : undefined}
            onClick={() => handleFilter(filter)}
            accessibilityLabel={`Select ${title.toLowerCase()} for filter`}
          >
            {toTitleCase(filter)}
          </s-button>
        ))}
      </s-menu>
    </>
  );
}

ButtonFilter.propTypes = {
  data: (props, propName, componentName) => {
    const value = props[propName];
    if (!Array.isArray(value)) {
      return new Error(`${componentName}: data must be an array`);
    }

    return null;
  },
  selected: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== "string") {
      return new Error(`${componentName}: selected must be a string`);
    }
    return null;
  },
  title: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== "string") {
      return new Error(`${componentName}: selected must be a string`);
    }
    return null;
  },
  params: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== "string") {
      return new Error(`${componentName}: selected must be a string`);
    }
    return null;
  },
};
