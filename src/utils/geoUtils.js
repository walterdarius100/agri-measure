import * as turf from "@turf/turf";

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
  const validPoints = Array.isArray(points)
    ? points.filter(isValidCoordinate)
    : [];

  if (validPoints.length < 3) {
    throw new Error(
      "Au moins 3 points GPS valides sont nécessaires pour créer un polygone.",
    );
  }

  const coordinates = validPoints.map((point) => [
    point.longitude,
    point.latitude,
  ]);
  const firstCoordinate = coordinates[0];
  const lastCoordinate = coordinates[coordinates.length - 1];
  const isAlreadyClosed =
    firstCoordinate[0] === lastCoordinate[0] &&
    firstCoordinate[1] === lastCoordinate[1];

  if (!isAlreadyClosed) {
    coordinates.push([...firstCoordinate]);
  }

  return coordinates;
}

export function calculateSegmentDistances(points) {
  const validPoints = Array.isArray(points)
    ? points
        .map((point, index) => ({ point, index }))
        .filter(({ point }) => isValidCoordinate(point))
    : [];

  if (validPoints.length < 2) {
    return [];
  }

  const segments = [];
  const addSegment = (fromPoint, toPoint) => {
    const from = turf.point([
      fromPoint.point.longitude,
      fromPoint.point.latitude,
    ]);
    const to = turf.point([toPoint.point.longitude, toPoint.point.latitude]);
    const distanceKm = turf.distance(from, to, { units: "kilometers" });

    segments.push({
      from: fromPoint.index + 1,
      to: toPoint.index + 1,
      distanceM: distanceKm * 1000,
    });
  };

  for (let index = 0; index < validPoints.length - 1; index += 1) {
    addSegment(validPoints[index], validPoints[index + 1]);
  }

  if (validPoints.length >= 3) {
    addSegment(validPoints[validPoints.length - 1], validPoints[0]);
  }

  return segments;
}

export function calculateAreaM2(points) {
  const closedCoordinates = buildClosedCoordinates(points);
  const polygon = turf.polygon([closedCoordinates]);

  return turf.area(polygon);
}

export function calculatePerimeterM(points) {
  const closedCoordinates = buildClosedCoordinates(points);
  const line = turf.lineString(closedCoordinates);
  const perimeterKm = turf.length(line, { units: "kilometers" });

  return perimeterKm * 1000;
}

export function calculateAverageAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(
    Array.isArray(points) ? points : [],
  );

  if (accuracyValues.length === 0) {
    return null;
  }

  const totalAccuracy = accuracyValues.reduce(
    (sum, accuracy) => sum + accuracy,
    0,
  );

  return totalAccuracy / accuracyValues.length;
}

export function calculateMinAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(
    Array.isArray(points) ? points : [],
  );

  if (accuracyValues.length === 0) {
    return null;
  }

  return Math.min(...accuracyValues);
}

export function calculateMaxAccuracy(points) {
  const accuracyValues = getValidAccuracyValues(
    Array.isArray(points) ? points : [],
  );

  if (accuracyValues.length === 0) {
    return null;
  }

  return Math.max(...accuracyValues);
}

export function m2ToHectares(areaM2) {
  return Number.isFinite(areaM2) ? areaM2 / 10000 : null;
}
