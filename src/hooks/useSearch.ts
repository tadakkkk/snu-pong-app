import { items } from "@/data/items";
import { sites, SITE_CATEGORY_LABELS } from "@/data/sites";

export function useSearch(query: string) {
  if (!query.trim()) {
    return { items: [], sites: [], isSearching: false };
  }

  const q = query.toLowerCase();

  const matchedItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.category_label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.provider?.toLowerCase().includes(q)
  );

  const matchedSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(q) ||
      site.description.toLowerCase().includes(q) ||
      SITE_CATEGORY_LABELS[site.category].toLowerCase().includes(q)
  );

  return { items: matchedItems, sites: matchedSites, isSearching: true };
}
