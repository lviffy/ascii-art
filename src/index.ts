/**
 * Main exports for ASCII 3D library
 */

// Core modules
export { SVGParser } from './core/svgParser';
export { ASCIIMapper } from './core/asciiMapper';
export { GeometryBuilder } from './core/geometryBuilder';

// React component
export { default as ASCII3D } from './components/Ascii3D';

// Types
export type { SVGParseResult, SVGParserOptions } from './core/svgParser';
export type { ASCIIMapperOptions, ASCIIResult } from './core/asciiMapper';
export type { GeometryBuilderOptions, ASCII3DResult } from './core/geometryBuilder';
export type { ASCII3DProps } from './components/Ascii3D';
