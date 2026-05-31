import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import AccuracyBadge from '../components/AccuracyBadge';
import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import {
  calculateAreaM2,
  calculateAverageAccuracy,
  calculateMaxAccuracy,
  calculateMinAccuracy,
  calculatePerimeterM,
  m2ToHectares,
} from '../utils/geoUtils';
import screenStyles from './screenStyles';

const POSITION_UNAVAILABLE_MESSAGE =
  'Position GPS indisponible. Vérifiez que le GPS est activé et réessayez en extérieur.';
const MAX_SAVED_POINTS = 100;

function formatCoordinate(value) {
  return typeof value === 'number' ? value.toFixed(7) : 'Indisponible';
}

function formatAccuracy(value) {
  return typeof value === 'number' ? `${Math.round(value)} m` : 'Indisponible';
}

function formatTimestamp(value) {
  return typeof value === 'number' ? new Date(value).toLocaleString('fr-FR') : 'Indisponible';
}

function getAccuracyStatus(accuracy) {
  if (typeof accuracy !== 'number') {
    return 'idle';
  }

  return accuracy <= 10 ? 'good' : 'warning';
}

function buildGpsPoint(position) {
  if (!position?.coords) {
    return null;
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

function areSamePoint(firstPoint, secondPoint) {
  return (
    firstPoint?.latitude === secondPoint?.latitude &&
    firstPoint?.longitude === secondPoint?.longitude &&
    firstPoint?.accuracy === secondPoint?.accuracy &&
    firstPoint?.timestamp === secondPoint?.timestamp
  );
}

export default function MeasureMapScreen({ navigation, route }) {
  const measurementInfo = route.params?.measurementInfo;
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [savedPoints, setSavedPoints] = useState([]);

  const requestCurrentPosition = useCallback(async () => {
    setIsLoadingPosition(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setCurrentPosition(null);
        setLocationError('Permission GPS refusée. Autorisez la localisation pour lire votre position actuelle.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setCurrentPosition(position);
    } catch {
      setCurrentPosition(null);
      setLocationError(POSITION_UNAVAILABLE_MESSAGE);
    } finally {
      setIsLoadingPosition(false);
    }
  }, []);

  useEffect(() => {
    requestCurrentPosition();
  }, [requestCurrentPosition]);

  const addPoint = useCallback(() => {
    const nextPoint = buildGpsPoint(currentPosition);

    if (!nextPoint) {
      Alert.alert('Position indisponible', 'Aucune position GPS disponible. Actualisez la position avant d’ajouter un point.');
      return;
    }

    if (savedPoints.length >= MAX_SAVED_POINTS) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez pas enregistrer plus de 100 points GPS pour une mesure.');
      return;
    }

    const lastPoint = savedPoints[savedPoints.length - 1];

    if (areSamePoint(lastPoint, nextPoint)) {
      Alert.alert('Point déjà enregistré', 'Ce point GPS est exactement identique au dernier point enregistré.');
      return;
    }

    const savePoint = () => {
      setSavedPoints((previousPoints) => [...previousPoints, nextPoint]);
      Alert.alert('Point ajouté', 'Le point GPS a été ajouté avec succès.');
    };

    if (typeof nextPoint.accuracy === 'number' && nextPoint.accuracy > 15) {
      Alert.alert(
        'Précision GPS faible',
        `La précision actuelle est de ${formatAccuracy(nextPoint.accuracy)}. Voulez-vous quand même ajouter ce point ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ajouter', onPress: savePoint },
        ],
      );
      return;
    }

    savePoint();
  }, [currentPosition, savedPoints]);

  const deleteLastPoint = useCallback(() => {
    if (savedPoints.length === 0) {
      Alert.alert('Aucun point', 'Aucun point GPS enregistré à supprimer.');
      return;
    }

    setSavedPoints((previousPoints) => previousPoints.slice(0, -1));
    Alert.alert('Point supprimé', 'Le dernier point GPS enregistré a été supprimé.');
  }, [savedPoints.length]);

  const resetPoints = useCallback(() => {
    if (savedPoints.length === 0) {
      Alert.alert('Aucun point', 'Aucun point GPS enregistré à réinitialiser.');
      return;
    }

    Alert.alert(
      'Réinitialiser les points',
      'Voulez-vous vraiment supprimer tous les points GPS enregistrés pour cette mesure ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            setSavedPoints([]);
            Alert.alert('Points réinitialisés', 'Tous les points GPS enregistrés ont été supprimés.');
          },
        },
      ],
    );
  }, [savedPoints.length]);

  const calculateSurface = useCallback(() => {
    if (savedPoints.length < 3) {
      Alert.alert('Points insuffisants', 'Ajoutez au moins 3 points pour calculer la superficie.');
      return;
    }

    const areaM2 = calculateAreaM2(savedPoints);
    const areaHa = m2ToHectares(areaM2);
    const perimeterM = calculatePerimeterM(savedPoints);
    const averageAccuracy = calculateAverageAccuracy(savedPoints);
    const minAccuracy = calculateMinAccuracy(savedPoints);
    const maxAccuracy = calculateMaxAccuracy(savedPoints);

    navigation.navigate('Result', {
      measurementInfo,
      points: savedPoints,
      areaM2,
      areaHa,
      perimeterM,
      averageAccuracy,
      minAccuracy,
      maxAccuracy,
      createdAt: new Date().toISOString(),
    });
  }, [measurementInfo, navigation, savedPoints]);

  const accuracy = currentPosition?.coords?.accuracy;
  const accuracyBadge = useMemo(() => {
    if (isLoadingPosition) {
      return { label: 'Recherche du signal GPS…', status: 'idle' };
    }

    if (locationError) {
      return { label: 'GPS indisponible', status: 'warning' };
    }

    if (typeof accuracy === 'number') {
      return { label: `Précision GPS : ${formatAccuracy(accuracy)}`, status: getAccuracyStatus(accuracy) };
    }

    return { label: 'Précision GPS indisponible', status: 'idle' };
  }, [accuracy, isLoadingPosition, locationError]);

  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Carte de mesure</Text>
      <Text style={screenStyles.subtitle}>Écran réservé au suivi GPS et à l’affichage de la trace.</Text>

      <AccuracyBadge label={accuracyBadge.label} status={accuracyBadge.status} />

      {measurementInfo ? (
        <View style={screenStyles.measurementSummary}>
          <Text style={screenStyles.summaryTitle}>Informations de la mesure</Text>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Nom du client</Text>
            <Text style={screenStyles.summaryValue}>{measurementInfo.clientName}</Text>
          </View>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Localisation</Text>
            <Text style={screenStyles.summaryValue}>{measurementInfo.locationName}</Text>
          </View>

          <View style={screenStyles.summaryItem}>
            <Text style={screenStyles.summaryLabel}>Type de projet</Text>
            <Text style={screenStyles.summaryValue}>{measurementInfo.projectType}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}>Position GPS actuelle</Text>
          {isLoadingPosition ? <Text style={styles.loadingText}>Lecture en cours…</Text> : null}
        </View>

        <Text style={styles.helpText}>
          Attendez quelques secondes que le signal GPS se stabilise avant de commencer la mesure.
        </Text>

        {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

        <View style={styles.gpsDataGrid}>
          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Latitude</Text>
            <Text style={styles.gpsValue}>{formatCoordinate(currentPosition?.coords?.latitude)}</Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Longitude</Text>
            <Text style={styles.gpsValue}>{formatCoordinate(currentPosition?.coords?.longitude)}</Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Accuracy</Text>
            <Text style={styles.gpsValue}>{formatAccuracy(accuracy)}</Text>
          </View>

          <View style={styles.gpsDataItem}>
            <Text style={screenStyles.summaryLabel}>Timestamp</Text>
            <Text style={styles.gpsValue}>{formatTimestamp(currentPosition?.timestamp)}</Text>
          </View>
        </View>

        {typeof accuracy === 'number' && accuracy > 10 ? (
          <Text style={styles.warningText}>
            Attention : la précision GPS est faible. Déplacez-vous en zone dégagée si possible avant d’ajouter un point.
          </Text>
        ) : null}

        <PrimaryButton
          disabled={isLoadingPosition}
          label={isLoadingPosition ? 'Actualisation en cours…' : 'Actualiser la position'}
          onPress={requestCurrentPosition}
        />
      </View>

      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsTitle}>Points GPS enregistrés</Text>
          <Text style={styles.pointsCount}>{savedPoints.length} / {MAX_SAVED_POINTS} points</Text>
        </View>

        <View style={styles.pointsActions}>
          <PrimaryButton label="Ajouter ce point" onPress={addPoint} />
          <PrimaryButton label="Supprimer le dernier point" onPress={deleteLastPoint} variant="secondary" />
          <PrimaryButton label="Réinitialiser les points" onPress={resetPoints} variant="secondary" />
        </View>

        {savedPoints.length === 0 ? (
          <Text style={styles.emptyPointsText}>Aucun point GPS enregistré pour le moment.</Text>
        ) : (
          <View style={styles.pointsList}>
            {savedPoints.map((point, index) => (
              <View
                // Les points peuvent être exactement identiques à d’anciens points non consécutifs.
                // L’index garde donc une clé stable dans cette liste locale.
                key={`${point.timestamp}-${index}`}
                style={styles.pointItem}>
                <Text style={styles.pointTitle}>Point {index + 1}</Text>
                <Text style={styles.pointValue}>Latitude : {formatCoordinate(point.latitude)}</Text>
                <Text style={styles.pointValue}>Longitude : {formatCoordinate(point.longitude)}</Text>
                <Text style={styles.pointValue}>Accuracy : {formatAccuracy(point.accuracy)}</Text>
                <Text style={styles.pointValue}>Timestamp : {formatTimestamp(point.timestamp)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <InfoCard
        title="Calcul disponible"
        description="Dès que 3 points GPS au minimum sont enregistrés, calculez la superficie et le périmètre du terrain."
      />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Calculer la superficie" onPress={calculateSurface} />
        <PrimaryButton label="Annuler" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gpsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  gpsHeader: {
    gap: 4,
  },
  gpsTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  helpText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  warningText: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    padding: 12,
  },
  gpsDataGrid: {
    gap: 12,
  },
  gpsDataItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    gap: 6,
    padding: 14,
  },
  gpsValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pointsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  pointsHeader: {
    gap: 4,
  },
  pointsTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  pointsCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  pointsActions: {
    gap: 10,
  },
  emptyPointsText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  pointsList: {
    gap: 10,
  },
  pointItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    gap: 5,
    padding: 14,
  },
  pointTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  pointValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
