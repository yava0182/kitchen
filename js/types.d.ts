// Type definitions for the project

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as THREE from 'three';

// Clodis data structure (референс: Clodis формат)
export interface ClodisData {
  type: string;
  name?: string;
  size?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  pos?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  pivot?: {
    x?: number;
    y?: number;
    z?: number;
  };
  rot?: {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  };
  spec?: {
    material?: {
      group?: string;
      thickness_lock?: number;
    };
    orientation?: 'v' | 'h' | 'f';
  };
  children?: ClodisData[];
}

// ⚠️ Алиас для совместимости
export type ClodisData = ClodisData;

// Furniture parameters
export interface FurnitureParams {
  sectionSize?: {
    x: number;
    y: number;
    z: number;
  };
  variables?: Record<string, number>;
  groups?: Record<string, { thickness: number }>;
}

// Room dimensions
export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
}

// Wall name type
export type WallName = 'front' | 'back' | 'left' | 'right';

// Section context for ClodisBuilder (референс: ClodisBuilder)
export interface SectionContext {
  size: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  pivot: { x: number; y: number; z: number };
  parent: SectionContext | null;
  name: string;
}
