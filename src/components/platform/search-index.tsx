"use client";

import * as React from "react";

export interface SearchEntry {
  label: string;
  /** Où se trouve l'élément : formation, module… */
  context: string;
  href: string;
}

const SearchContext = React.createContext<SearchEntry[]>([]);

// Index de recherche (formations, modules, étapes), préparé une fois par la mise en page.
export function SearchIndexProvider({ entries, children }: { entries: SearchEntry[]; children: React.ReactNode }) {
  return <SearchContext.Provider value={entries}>{children}</SearchContext.Provider>;
}

export function useSearchIndex() {
  return React.useContext(SearchContext);
}
