export function formatDateTime(isoString) {
  if (!isoString) return "-";

  const date = new Date(isoString);

  const datePart = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",    // <-- Ubah dari "02-digit" ke "2-digit"
    minute: "2-digit",  // <-- Ubah dari "02-digit" ke "2-digit"
    hour12: true,
    timeZone: "UTC",
  });

  const [month, day, year] = datePart.replace(",", "").split(" ");
  return `${day} ${month}, ${year} - ${timePart}`;
}

export function toTitleCase(str) {
  if (!str) return "";

  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function convertToSlug(str) {
  if (!str) return "";

  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getInitials(str) {
  if (!str) return "";

  return str
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

// Tulis fungsi pembantu ini di bagian paling atas file (di luar fungsi komponen IssueDetail)
export function customDebounce(func, delay) {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

// const debouncedSetSearch = useMemo(
//   () => customDebounce((value) => { ... LOGIKA TETAP SAMA ... }, 500),
//   [setSearchParams]
// );
