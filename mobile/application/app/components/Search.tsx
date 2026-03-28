import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";

interface SearchBarProps<T> {
  onFilter: (filteredData: T[]) => void; // Receives data from backend
  placeholder?: string;
  apiEndpoint: string; // Backend URL
  filterKey?: keyof T; // Optional: if backend supports filtering on different keys
  debounceTime?: number; // Optional: debounce in ms (default 300)
}

export default function SearchBar<T>({
  onFilter,
  placeholder = "Search...",
  apiEndpoint,
  filterKey,
  debounceTime = 300,
}: SearchBarProps<T>) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      // If query is empty, you can fetch all items
      const url = new URL(apiEndpoint);
      if (query.trim() !== "") {
        url.searchParams.append("query", query); // Backend expects `query`
      }

      if (filterKey) {
        // Optional key parameter if backend supports it
        url.searchParams.append("key", filterKey as string);
      }

      fetch(url.toString())
        .then((res) => res.json())
        .then((data: T[]) => onFilter(data))
        .catch((err) => {
          console.error("Search error:", err);
          onFilter([]); // fallback empty array
        });
    }, debounceTime);

    return () => clearTimeout(handler); // cleanup debounce
  }, [query, apiEndpoint, filterKey, debounceTime]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});