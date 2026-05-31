import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import { deleteMeasurement, getMeasurements } from '../utils/storage';
import screenStyles from './screenStyles';

function formatText(value) {
  return value ? String(value) : 'Non renseigné';
}

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return 'Indisponible';
  }

  return value.toLocaleString('fr-FR', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function formatMeters(value) {
  return Number.isFinite(value) ? `${formatNumber(value)} m` : 'Indisponible';
}

function formatDate(value) {
  if (!value) {
    return 'Date indisponible';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date indisponible';
  }

  return date.toLocaleString('fr-FR');
}

function HistoryRow({ label, value }) {
  return (
    <View style={styles.historyRow}>
      <Text style={screenStyles.summaryLabel}>{label}</Text>
      <Text style={styles.historyValue}>{value}</Text>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const [measurements, setMeasurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMeasurements = useCallback(async () => {
    setIsLoading(true);
    const savedMeasurements = await getMeasurements();
    setMeasurements(savedMeasurements);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeasurements();
    }, [loadMeasurements]),
  );

  const openMeasurement = (measurement) => {
    navigation.navigate('Result', {
      ...measurement,
      readOnly: true,
      source: 'history',
    });
  };

  const confirmDeleteMeasurement = (measurement) => {
    Alert.alert(
      'Supprimer la mesure',
      'Voulez-vous vraiment supprimer cette mesure enregistrée ? Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeasurement(measurement.id);
              await loadMeasurements();
            } catch {
              Alert.alert('Suppression impossible', 'La mesure n’a pas pu être supprimée. Réessayez plus tard.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Historique</Text>
      <Text style={screenStyles.subtitle}>Les mesures sauvegardées localement sur ce téléphone apparaissent ici.</Text>

      {isLoading ? <InfoCard title="Chargement" description="Chargement des mesures enregistrées…" /> : null}

      {!isLoading && measurements.length === 0 ? (
        <InfoCard title="Aucune mesure" description="Aucune mesure enregistrée." />
      ) : null}

      {!isLoading && measurements.length > 0 ? (
        <View style={styles.list}>
          {measurements.map((measurement) => {
            const measurementInfo = measurement.measurementInfo ?? {};

            return (
              <InfoCard key={measurement.id} title={formatText(measurementInfo.clientName)}>
                <HistoryRow label="Localisation / zone" value={formatText(measurementInfo.locationName)} />
                <HistoryRow label="Type de projet agricole" value={formatText(measurementInfo.projectType)} />
                <HistoryRow label="Date" value={formatDate(measurement.createdAt)} />
                <HistoryRow label="Superficie en m²" value={`${formatNumber(measurement.areaM2)} m²`} />
                <HistoryRow label="Superficie en hectares" value={`${formatNumber(measurement.areaHa, 4)} ha`} />
                <HistoryRow label="Périmètre en mètres" value={formatMeters(measurement.perimeterM)} />
                <HistoryRow label="Précision moyenne GPS" value={formatMeters(measurement.averageAccuracy)} />

                <View style={styles.actions}>
                  <PrimaryButton label="Ouvrir la mesure" onPress={() => openMeasurement(measurement)} />
                  <PrimaryButton
                    label="Supprimer"
                    onPress={() => confirmDeleteMeasurement(measurement)}
                    variant="secondary"
                  />
                </View>
              </InfoCard>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  historyRow: {
    gap: 4,
    paddingVertical: 4,
  },
  historyValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});
