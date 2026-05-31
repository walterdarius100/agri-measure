import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import AccuracyBadge from '../components/AccuracyBadge';
import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import screenStyles from './screenStyles';

const POSITION_UNAVAILABLE_MESSAGE =
  'Position GPS indisponible. Vérifiez que le GPS est activé et réessayez en extérieur.';

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

export default function MeasureMapScreen({ navigation, route }) {
  const measurementInfo = route.params?.measurementInfo;
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [locationError, setLocationError] = useState(null);

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

        <PrimaryButton
          disabled={isLoadingPosition}
          label={isLoadingPosition ? 'Actualisation en cours…' : 'Actualiser la position'}
          onPress={requestCurrentPosition}
        />
      </View>

      <InfoCard
        title="Lecture GPS uniquement"
        description="La position actuelle est lue à la demande. Aucun point GPS n’est collecté et aucun calcul n’est lancé pour le moment."
      />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Voir le résultat de test" onPress={() => navigation.navigate('Result')} />
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
});
