import type { FilterType } from '@penmedia/shared-types';
import type { FilterProcessor } from './types';

// Utility functions for image processing
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// No filter - passthrough
export const noFilter: FilterProcessor = {
  type: 'none',
  name: 'No Filter',
  description: 'Original image without any modifications',
  process(imageData: ImageData, _intensity: number): ImageData {
    return imageData;
  },
};

// Grayscale filter
export const grayscaleFilter: FilterProcessor = {
  type: 'grayscale',
  name: 'Grayscale',
  description: 'Convert image to black and white',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i] + (gray - data[i]) * factor;
      data[i + 1] = data[i + 1] + (gray - data[i + 1]) * factor;
      data[i + 2] = data[i + 2] + (gray - data[i + 2]) * factor;
    }

    return imageData;
  },
};

// Sepia filter
export const sepiaFilter: FilterProcessor = {
  type: 'sepia',
  name: 'Sepia',
  description: 'Apply warm vintage sepia tone',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const newR = r * 0.393 + g * 0.769 + b * 0.189;
      const newG = r * 0.349 + g * 0.686 + b * 0.168;
      const newB = r * 0.272 + g * 0.534 + b * 0.131;

      data[i] = clamp(r + (newR - r) * factor, 0, 255);
      data[i + 1] = clamp(g + (newG - g) * factor, 0, 255);
      data[i + 2] = clamp(b + (newB - b) * factor, 0, 255);
    }

    return imageData;
  },
};

// Warm filter
export const warmFilter: FilterProcessor = {
  type: 'warm',
  name: 'Warm',
  description: 'Add warm orange/yellow tones',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = (intensity / 100) * 30;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + factor, 0, 255);
      data[i + 1] = clamp(data[i + 1] + factor * 0.5, 0, 255);
      data[i + 2] = clamp(data[i + 2] - factor * 0.3, 0, 255);
    }

    return imageData;
  },
};

// Cool filter
export const coolFilter: FilterProcessor = {
  type: 'cool',
  name: 'Cool',
  description: 'Add cool blue tones',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = (intensity / 100) * 30;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] - factor * 0.3, 0, 255);
      data[i + 1] = clamp(data[i + 1] + factor * 0.2, 0, 255);
      data[i + 2] = clamp(data[i + 2] + factor, 0, 255);
    }

    return imageData;
  },
};

// Vintage filter
export const vintageFilter: FilterProcessor = {
  type: 'vintage',
  name: 'Vintage',
  description: 'Classic film-like vintage effect',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Reduce contrast
      const contrastFactor = 0.9;
      let newR = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
      let newG = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
      let newB = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

      // Add sepia tint
      newR = newR * 1.1;
      newG = newG * 0.95;
      newB = newB * 0.8;

      data[i] = clamp(r + (newR - r) * factor, 0, 255);
      data[i + 1] = clamp(g + (newG - g) * factor, 0, 255);
      data[i + 2] = clamp(b + (newB - b) * factor, 0, 255);
    }

    return imageData;
  },
};

// Vignette filter
export const vignetteFilter: FilterProcessor = {
  type: 'vignette',
  name: 'Vignette',
  description: 'Darken edges for focus effect',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const factor = intensity / 100;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vignette = 1 - (dist / maxDist) * factor;

        data[i] = clamp(data[i] * vignette, 0, 255);
        data[i + 1] = clamp(data[i + 1] * vignette, 0, 255);
        data[i + 2] = clamp(data[i + 2] * vignette, 0, 255);
      }
    }

    return imageData;
  },
};

// Beauty filter (skin smoothing)
export const beautyFilter: FilterProcessor = {
  type: 'beauty',
  name: 'Beauty',
  description: 'Smooth skin and enhance features',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const factor = intensity / 100;

    // Simple bilateral-like smoothing for skin tones
    const radius = Math.max(1, Math.floor(factor * 3));
    const output = new Uint8ClampedArray(data.length);
    output.set(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is skin-like color
        const isSkinTone = r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;

        if (isSkinTone) {
          let sumR = 0,
            sumG = 0,
            sumB = 0,
            count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const ni = ((y + dy) * width + (x + dx)) * 4;
              sumR += data[ni];
              sumG += data[ni + 1];
              sumB += data[ni + 2];
              count++;
            }
          }

          output[i] = r + ((sumR / count - r) * factor) / 2;
          output[i + 1] = g + ((sumG / count - g) * factor) / 2;
          output[i + 2] = b + ((sumB / count - b) * factor) / 2;
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }

    return imageData;
  },
};

// Low light enhancement
export const lowLightFilter: FilterProcessor = {
  type: 'low_light',
  name: 'Low Light',
  description: 'Enhance visibility in dark conditions',
  process(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data;
    const factor = intensity / 100;

    // Calculate average brightness
    let avgBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      avgBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    avgBrightness /= data.length / 4;

    // Only apply if image is dark
    if (avgBrightness < 128) {
      const boostFactor = 1 + ((128 - avgBrightness) / 128) * factor;
      const gamma = 1 / (1 + factor * 0.5);

      for (let i = 0; i < data.length; i += 4) {
        // Apply gamma correction and boost
        data[i] = clamp(Math.pow(data[i] / 255, gamma) * 255 * boostFactor, 0, 255);
        data[i + 1] = clamp(Math.pow(data[i + 1] / 255, gamma) * 255 * boostFactor, 0, 255);
        data[i + 2] = clamp(Math.pow(data[i + 2] / 255, gamma) * 255 * boostFactor, 0, 255);
      }
    }

    return imageData;
  },
};

// Background blur (simplified - full implementation requires ML)
export const blurBackgroundFilter: FilterProcessor = {
  type: 'blur_background',
  name: 'Blur Background',
  description: 'Blur background while keeping subject sharp',
  process(imageData: ImageData, intensity: number): ImageData {
    // Note: Full background segmentation requires ML model
    // This is a simplified radial blur that simulates the effect
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const factor = intensity / 100;

    const centerX = width / 2;
    const centerY = height / 2;
    const innerRadius = Math.min(width, height) * 0.25;
    const outerRadius = Math.min(width, height) * 0.5;

    const blurRadius = Math.max(1, Math.floor(factor * 5));
    const output = new Uint8ClampedArray(data.length);
    output.set(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > innerRadius) {
          const blurAmount = Math.min(1, (dist - innerRadius) / (outerRadius - innerRadius));
          const currentBlur = Math.floor(blurRadius * blurAmount);

          if (currentBlur > 0) {
            let sumR = 0,
              sumG = 0,
              sumB = 0,
              count = 0;

            for (let dy2 = -currentBlur; dy2 <= currentBlur; dy2++) {
              for (let dx2 = -currentBlur; dx2 <= currentBlur; dx2++) {
                const ny = y + dy2;
                const nx = x + dx2;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  const ni = (ny * width + nx) * 4;
                  sumR += data[ni];
                  sumG += data[ni + 1];
                  sumB += data[ni + 2];
                  count++;
                }
              }
            }

            output[i] = sumR / count;
            output[i + 1] = sumG / count;
            output[i + 2] = sumB / count;
          }
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }

    return imageData;
  },
};

// Filter registry
export const filterRegistry: Map<FilterType, FilterProcessor> = new Map([
  ['none', noFilter],
  ['grayscale', grayscaleFilter],
  ['sepia', sepiaFilter],
  ['warm', warmFilter],
  ['cool', coolFilter],
  ['vintage', vintageFilter],
  ['vignette', vignetteFilter],
  ['beauty', beautyFilter],
  ['low_light', lowLightFilter],
  ['blur_background', blurBackgroundFilter],
]);

export function getFilter(type: FilterType): FilterProcessor | undefined {
  return filterRegistry.get(type);
}

export function getAllFilters(): FilterProcessor[] {
  return Array.from(filterRegistry.values());
}
