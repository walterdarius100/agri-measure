import AsyncStorage from '@react-native-async-storage/async-storage';

export const MEASUREMENTS_STORAGE_KEY = '@agri-measure/measurements';

function createMeasurementId() {
  return `measurement-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMeasurement(measurement) {
  return {
    id: measurement.id ?? createMeasurementId(),
    createdAt: measurement.createdAt ?? new Date().toISOString(),
    measurementInfo: measurement.measurementInfo ?? {},
    points: Array.isArray(measurement.points) ? measurement.points : [],
    areaM2: measurement.areaM2,
    areaHa: measurement.areaHa,
    perimeterM: measurement.perimeterM,
    averageAccuracy: measurement.averageAccuracy,
    minAccuracy: measurement.minAccuracy,
    maxAccuracy: measurement.maxAccuracy,
  };
}

export async function getMeasurements() {
  try {
    const rawMeasurements = await AsyncStorage.getItem(MEASUREMENTS_STORAGE_KEY);

    if (!rawMeasurements) {
      return [];
    }

    const measurements = JSON.parse(rawMeasurements);

    return Array.isArray(measurements) ? measurements : [];
  } catch (error) {
    console.warn('Impossible de charger les mesures sauvegardées.', error);
    return [];
  }
}

export async function saveMeasurement(measurement) {
  const normalizedMeasurement = normalizeMeasurement(measurement ?? {});

  try {
    const measurements = await getMeasurements();
    const existingMeasurement = measurements.find((item) => item.id === normalizedMeasurement.id);

    if (existingMeasurement) {
      return existingMeasurement;
    }

    const nextMeasurements = [normalizedMeasurement, ...measurements];
    await AsyncStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(nextMeasurements));

    return normalizedMeasurement;
  } catch (error) {
    console.warn('Impossible de sauvegarder la mesure.', error);
    throw error;
  }
}

export async function deleteMeasurement(id) {
  try {
    const measurements = await getMeasurements();
    const nextMeasurements = measurements.filter((measurement) => measurement.id !== id);

    await AsyncStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(nextMeasurements));
  } catch (error) {
    console.warn('Impossible de supprimer la mesure.', error);
    throw error;
  }
}

export const getSavedMeasurements = getMeasurements;
export const saveMeasurementDraft = saveMeasurement;
