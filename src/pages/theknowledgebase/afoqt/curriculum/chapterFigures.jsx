import AnglePairDiagram from '../render/AnglePairDiagram';
import { Transversal, ExteriorAngle, IsoscelesHalving, SimilarTriangles, PolygonAngles } from '../render/figures/Ch09Angles.jsx';
import { ParallelogramHeight, TriangleIsHalf, ObtuseHeight, TrapezoidAverage, RadiusDiameter, SectorArc, CompositeSquareCircle } from '../render/figures/Ch10Area.jsx';
import { PythagorasSides, Triangle454590, Triangle306090, ConeInCylinder, CylinderNet, BoxFaces } from '../render/figures/Ch11Solids.jsx';
import { SlopeMidpointDistance, Intercepts, PerpendicularSlopes } from '../render/figures/Ch12Coordinate.jsx';

// Every figure a lesson can call for, keyed by the id used in the markdown.
//
// A lesson places one by writing an image whose src uses the `figure:` scheme, on its own line:
//
//     ![Vertical angles and a linear pair](figure:angle-pairs)
//
// ChapterView swaps that line for the component (see `lessonComponents` there). The point of
// going through markdown rather than keying figures to a whole chapter - which is what this file
// used to do - is PLACEMENT: a chapter has six or seven sections and a picture that belongs to
// section 4 teaches nothing sitting above section 1. The alt text is not decoration either; it is
// what a screen reader gets, and it is what shows if an id is ever mistyped.
//
// Adding a figure is: write the component, add one line here, write one line in the markdown.

export const FIGURES = {
  // Ch09 - angles, lines, triangles
  // 38° because the lesson prose beside it names 38 and 142 explicitly.
  'angle-pairs': () => <AnglePairDiagram acute={38} />,
  transversal: Transversal,
  'exterior-angle': ExteriorAngle,
  'isosceles-halving': IsoscelesHalving,
  'similar-triangles': SimilarTriangles,
  'polygon-angles': PolygonAngles,

  // Ch10 - perimeter, area, circles
  'parallelogram-height': ParallelogramHeight,
  'triangle-is-half': TriangleIsHalf,
  'obtuse-height': ObtuseHeight,
  'trapezoid-average': TrapezoidAverage,
  'radius-diameter': RadiusDiameter,
  'sector-arc': SectorArc,
  'composite-square-circle': CompositeSquareCircle,

  // Ch11 - right triangles and solids
  'pythagoras-sides': PythagorasSides,
  'triangle-45-45-90': Triangle454590,
  'triangle-30-60-90': Triangle306090,
  'cone-in-cylinder': ConeInCylinder,
  'cylinder-net': CylinderNet,
  'box-faces': BoxFaces,

  // Ch12 - coordinate geometry
  'slope-midpoint-distance': SlopeMidpointDistance,
  intercepts: Intercepts,
  'perpendicular-slopes': PerpendicularSlopes,
};

export const getFigure = (id) => FIGURES[id] ?? null;
