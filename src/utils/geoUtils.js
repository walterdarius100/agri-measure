import * as turf from '@turf/turf';

export function createEmptyMeasurementDraft() {
  return {
    points: [],
    areaSquareMeters: null,
    perimeterMeters: null,
  };
}

function isValidCoordinate(point) {
  return Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
}

function getValidAccuracyValues(points) {
  return points
    .map((point) => point?.accuracy)
    .filter((accuracy) => Number.isFinite(accuracy) && accuracy >= 0);
}

export function buildClosedCoordinates(points) {
  const validPoints = Array.isArray(points) ? points.filter(isValidCoordinate) : [];

  if (validPoints.length < 3) {
    throw new Error('Au moins 3 points GPS valides sont nécessaires pour créer un polygone.');
  }

  const coordinates = validPoints.map((point) => [point.longitude, point.latitude]);
  const firstCoordinate = coordinates[0];
  const lastCoordinate = coordinates[coordinates.length - 1];
  const isAlreadyClosed = firstCoordinate[0] === lastCoordinate[0] && firstCoordinate[1] === lastCoordinate[1];

  if (!isAlreadyClosed) {
    coordinates.push([...firstCoordinate]);
  }

  return coordinates;
}

export function calculateAreaM2(points) {
  const closedCoordinates = buildClosedCoordinates(points);
  const polygon = turf.polygon([closedCoordinates]);

  return turf.area(polygon);
}

export function calculatePerimeterM(points) {
  const closedCoordinates = buildClosedCoordinates(points);
  const line = turf.lineString(closedCoordinates);
  const perimeterKm = turf.length(line, { units: 'kilometers' });

  return perimeterKm * 1000;
}

export function calculateAverageAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(Array.isArray(points) ? points : []);

  if (accuracyValues.length === 0) {
    return null;
  }

  const totalAccuracy = accuracyValues.reduce((sum, accuracy) => sum + accuracy, 0);

  return totalAccuracy / accuracyValues.length;
}

export function calculateMinAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(Array.isArray(points) ? points : []);

  if (accuracyValues.length === 0) {
    return null;
  }

  return Math.min(...accuracyValues);
}

export function calculateMaxAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(Array.isArray(points) ? points : []);

  if (accuracyValues.length === 0) {
    return null;
  }

  return Math.max(...accuracyValues);
}

export function m2ToHectares(areaM2) {
  return Number.isFinite(areaM2) ? areaM2 / 10000 : null;
}
