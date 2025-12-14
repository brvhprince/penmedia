import type { FilterType, FilterSettings } from '@penmedia/shared-types';
import type { FilterProcessor, FilterPipeline, ImageData } from './types';
import { getFilter } from './processors';

export class ImageFilterPipeline implements FilterPipeline {
  filters: FilterProcessor[] = [];

  constructor(initialFilters?: FilterType[]) {
    if (initialFilters) {
      initialFilters.forEach(type => this.add(getFilter(type)!));
    }
  }

  add(filter: FilterProcessor): void {
    if (!this.filters.find(f => f.type === filter.type)) {
      this.filters.push(filter);
    }
  }

  remove(type: FilterType): void {
    this.filters = this.filters.filter(f => f.type !== type);
  }

  clear(): void {
    this.filters = [];
  }

  process(imageData: ImageData, settings: FilterSettings[]): ImageData {
    let result = imageData;

    for (const setting of settings) {
      if (!setting.enabled || setting.type === 'none') continue;

      const filter = getFilter(setting.type);
      if (filter) {
        result = filter.process(result, setting.intensity);
      }
    }

    return result;
  }
}

// Utility to apply color adjustments
export function applyColorAdjustments(
  imageData: ImageData,
  brightness: number,
  contrast: number,
  saturation: number
): ImageData {
  const data = imageData.data;

  // Brightness: -100 to 100
  const brightnessOffset = (brightness / 100) * 255;

  // Contrast: -100 to 100
  const contrastFactor = (100 + contrast) / 100;

  // Saturation: -100 to 100
  const saturationFactor = (100 + saturation) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Apply contrast
    r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
    g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
    b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturationFactor;
    g = gray + (g - gray) * saturationFactor;
    b = gray + (b - gray) * saturationFactor;

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return imageData;
}

// Create a filter pipeline from settings
export function createPipeline(settings: FilterSettings[]): ImageFilterPipeline {
  const pipeline = new ImageFilterPipeline();

  for (const setting of settings) {
    if (setting.enabled && setting.type !== 'none') {
      const filter = getFilter(setting.type);
      if (filter) {
        pipeline.add(filter);
      }
    }
  }

  return pipeline;
}
