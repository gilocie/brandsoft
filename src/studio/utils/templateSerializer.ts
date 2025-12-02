
import { CanvasElement } from '../hooks/useCanvas';

// This utility will handle the serialization and deserialization of templates.
// Templates are stored as a JSON string representing the array of canvas elements.

export function serializeTemplate(elements: CanvasElement[]): string {
  try {
    return JSON.stringify(elements, null, 2);
  } catch (error) {
    console.error("Failed to serialize template:", error);
    return "[]";
  }
}

export function deserializeTemplate(jsonString: string): CanvasElement[] {
  try {
    const elements = JSON.parse(jsonString);
    if (Array.isArray(elements)) {
      return elements;
    }
    return [];
  } catch (error) {
    console.error("Failed to deserialize template:", error);
    return [];
  }
}
