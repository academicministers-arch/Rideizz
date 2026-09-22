import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { searchPlaces, getPlaceDetails, PlaceSuggestion, PlaceDetails } from "../services/maps";

interface Props {
  placeholder: string;
  onSelect: (place: PlaceDetails) => void;
}

// Debounced Google Places autocomplete. Type a few letters, see suggestions,
// tap one, get real lat/lng back via onSelect. Replaces any hardcoded
// coordinates that used to sit in the ride/delivery request screens.
export default function PlaceAutocompleteInput({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return; // don't re-search right after picking a result
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSelect(suggestion: PlaceSuggestion) {
    setSelected(true);
    setQuery(suggestion.description);
    setSuggestions([]);
    const details = await getPlaceDetails(suggestion.place_id);
    onSelect({ ...details, address: details.address || suggestion.description });
  }

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setSelected(false);
          setQuery(text);
        }}
      />
      {loading && <ActivityIndicator style={styles.loading} size="small" color="#1A73E8" />}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s.place_id} style={styles.suggestionRow} onPress={() => handleSelect(s)}>
              <Text style={styles.suggestionText}>{s.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 4 },
  loading: { position: "absolute", right: 14, top: 14 },
  suggestions: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, marginBottom: 10, overflow: "hidden" },
  suggestionRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2" },
  suggestionText: { fontSize: 14, color: "#333" },
});