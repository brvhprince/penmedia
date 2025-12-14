import type { FilterType, FilterSettings } from '@penmedia/shared-types';

// ImageData type definition for non-browser environments
export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface FilterProcessor {
  type: FilterType;
  name: string;
  description: string;
  process(imageData: ImageData, intensity: number): ImageData;
  getShaderCode?(): string;
}

export interface FilterPipeline {
  filters: FilterProcessor[];
  add(filter: FilterProcessor): void;
  remove(type: FilterType): void;
  clear(): void;
  process(imageData: ImageData, settings: FilterSettings[]): ImageData;
}

export interface ColorAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  hue: number; // -180 to 180
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
}

export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
};
