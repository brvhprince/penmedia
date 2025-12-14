import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppStore } from '@store/appStore';
import { DEFAULT_FILTER_PRESETS, type FilterType, type FilterSettings } from '@penmedia/shared-types';

interface FilterSelectorProps {
  onFilterChange: (filters: FilterSettings[]) => void;
}

const FILTER_OPTIONS: { type: FilterType; name: string; icon: string }[] = [
  { type: 'none', name: 'None', icon: '⭕' },
  { type: 'blur_background', name: 'Blur BG', icon: '🌫️' },
  { type: 'beauty', name: 'Beauty', icon: '✨' },
  { type: 'low_light', name: 'Low Light', icon: '🌙' },
  { type: 'grayscale', name: 'B&W', icon: '⚫' },
  { type: 'sepia', name: 'Sepia', icon: '🟤' },
  { type: 'warm', name: 'Warm', icon: '🔥' },
  { type: 'cool', name: 'Cool', icon: '❄️' },
  { type: 'vintage', name: 'Vintage', icon: '📷' },
  { type: 'vignette', name: 'Vignette', icon: '🔲' },
];

export function FilterSelector({ onFilterChange }: FilterSelectorProps) {
  const { filters, setFilters } = useAppStore();
  const activeFilter = filters.find(f => f.enabled && f.type !== 'none')?.type || 'none';

  const handleSelectFilter = (type: FilterType) => {
    const newFilters: FilterSettings[] = [
      { type, intensity: type === 'none' ? 0 : 50, enabled: true },
    ];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = DEFAULT_FILTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      onFilterChange(preset.filters);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filters</Text>

      {/* Filter Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTER_OPTIONS.map(filter => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterItem,
              activeFilter === filter.type && styles.filterItemActive,
            ]}
            onPress={() => handleSelectFilter(filter.type)}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text
              style={[
                styles.filterName,
                activeFilter === filter.type && styles.filterNameActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Presets */}
      <Text style={styles.presetTitle}>Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {DEFAULT_FILTER_PRESETS.map(preset => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetItem}
            onPress={() => handleSelectPreset(preset.id)}
          >
            <Text style={styles.presetName}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Intensity Slider would go here for active filter */}
      {activeFilter !== 'none' && (
        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>Intensity</Text>
          <View style={styles.intensitySlider}>
            {/* Custom slider component would go here */}
            <Text style={styles.intensityValue}>
              {filters.find(f => f.type === activeFilter)?.intensity || 50}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  filterItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  filterIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  filterName: {
    color: '#888',
    fontSize: 12,
  },
  filterNameActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  presetTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  presetScroll: {
    marginBottom: 16,
  },
  presetItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  presetName: {
    color: '#fff',
    fontSize: 14,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  intensityLabel: {
    color: '#888',
    fontSize: 14,
    marginRight: 12,
  },
  intensitySlider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityValue: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 'auto',
  },
});
