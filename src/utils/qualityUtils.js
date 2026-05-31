function getValidAccuracyValues(points) {
  return (Array.isArray(points) ? points : [])
    .map((point) => point?.accuracy)
    .filter((accuracy) => Number.isFinite(accuracy) && accuracy >= 0);
}

function resolveAverageAccuracy(points, averageAccuracy) {
  if (Number.isFinite(averageAccuracy)) {
    return averageAccuracy;
  }

  const accuracyValues = getValidAccuracyValues(points);

  if (accuracyValues.length === 0) {
    return null;
  }

  const totalAccuracy = accuracyValues.reduce((sum, accuracy) => sum + accuracy, 0);

  return totalAccuracy / accuracyValues.length;
}

function resolveMaxAccuracy(points, maxAccuracy) {
  if (Number.isFinite(maxAccuracy)) {
    return maxAccuracy;
  }

  const accuracyValues = getValidAccuracyValues(points);

  if (accuracyValues.length === 0) {
    return null;
  }

  return Math.max(...accuracyValues);
}

export function analyzeMeasurementQuality(points, averageAccuracy, maxAccuracy) {
  const safePoints = Array.isArray(points) ? points : [];
  const resolvedAverageAccuracy = resolveAverageAccuracy(safePoints, averageAccuracy);
  const resolvedMaxAccuracy = resolveMaxAccuracy(safePoints, maxAccuracy);
  const weakPointsCount = safePoints.filter((point) => Number.isFinite(point?.accuracy) && point.accuracy > 10).length;
  const veryWeakPointsCount = safePoints.filter((point) => Number.isFinite(point?.accuracy) && point.accuracy > 15).length;

  if (!Number.isFinite(resolvedAverageAccuracy) || !Number.isFinite(resolvedMaxAccuracy)) {
    return {
      qualityLevel: 'unavailable',
      qualityLabel: 'Non disponible',
      qualityMessage: 'La précision GPS n’est pas disponible pour cette mesure.',
      recommendation: 'Interpréter cette mesure avec prudence, car les données de précision GPS sont absentes.',
      totalPoints: safePoints.length,
      weakPointsCount,
      veryWeakPointsCount,
    };
  }

  if (resolvedAverageAccuracy > 10 || resolvedMaxAccuracy > 15) {
    return {
      qualityLevel: 'weak',
      qualityLabel: 'Qualité faible',
      qualityMessage: 'La précision GPS est faible sur une partie ou l’ensemble de la mesure.',
      recommendation: 'Il est recommandé de refaire la mesure dans une zone plus dégagée ou avec un meilleur signal GPS.',
      totalPoints: safePoints.length,
      weakPointsCount,
      veryWeakPointsCount,
    };
  }

  if (resolvedAverageAccuracy <= 5 && resolvedMaxAccuracy <= 10) {
    return {
      qualityLevel: 'good',
      qualityLabel: 'Bonne qualité',
      qualityMessage: 'La précision GPS est globalement bonne pour une mesure agricole indicative.',
      recommendation: 'Cette mesure peut être utilisée pour un diagnostic agricole indicatif.',
      totalPoints: safePoints.length,
      weakPointsCount,
      veryWeakPointsCount,
    };
  }

  return {
    qualityLevel: 'acceptable',
    qualityLabel: 'Qualité acceptable',
    qualityMessage:
      'La précision GPS est moyenne. La mesure reste utilisable pour une estimation, mais doit être interprétée avec prudence.',
    recommendation: 'Vérifier la cohérence du résultat avant toute décision technique importante.',
    totalPoints: safePoints.length,
    weakPointsCount,
    veryWeakPointsCount,
  };
}
