"use client";

import { useState, useEffect, useRef } from "react";

export function useDebouncedSearch(delay = 300) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [query, delay]);

  return { query, setQuery, debouncedQuery };
}
