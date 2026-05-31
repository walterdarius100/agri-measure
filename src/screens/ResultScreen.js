import { ScrollView, StyleSheet, Text, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
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
    return 'Indisponible';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Indisponible';
  }

  return date.toLocaleString('fr-FR');
}

function ResultRow({ label, value }) {
  return (
    <View style={styles.resultRow}>
      <Text style={screenStyles.summaryLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

export default function ResultScreen({ navigation, route }) {
  const result = route.params ?? {};
  const measurementInfo = result.measurementInfo ?? {};
  const pointsCount = Array.isArray(result.points) ? result.points.length : 0;
  const shouldShowAccuracyWarning = Number.isFinite(result.averageAccuracy) && result.averageAccuracy > 10;

  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Résultat</Text>
      <Text style={screenStyles.subtitle}>Superficie et périmètre calculés à partir des points GPS enregistrés.</Text>

      <InfoCard title="Informations de la mesure">
        <ResultRow label="Nom du client" value={formatText(measurementInfo.clientName)} />
        <ResultRow label="Téléphone" value={formatText(measurementInfo.phone)} />
        <ResultRow label="Localisation / zone" value={formatText(measurementInfo.locationName)} />
        <ResultRow label="Type de projet agricole" value={formatText(measurementInfo.projectType)} />
        <ResultRow label="Notes terrain" value={formatText(measurementInfo.notes)} />
        <ResultRow label="Date de mesure" value={formatDate(result.createdAt)} />
      </InfoCard>

      <InfoCard title="Calculs du terrain">
        <ResultRow label="Superficie en m²" value={`${formatNumber(result.areaM2)} m²`} />
        <ResultRow label="Superficie en hectares" value={`${formatNumber(result.areaHa, 4)} ha`} />
        <ResultRow label="Périmètre en mètres" value={formatMeters(result.perimeterM)} />
        <ResultRow label="Nombre de points GPS" value={`${pointsCount}`} />
      </InfoCard>

      <InfoCard title="Précision GPS">
        <ResultRow label="Précision moyenne GPS" value={formatMeters(result.averageAccuracy)} />
        <ResultRow label="Meilleure précision GPS" value={formatMeters(result.minAccuracy)} />
        <ResultRow label="Plus mauvaise précision GPS" value={formatMeters(result.maxAccuracy)} />
      </InfoCard>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeText}>
          Cette mesure est indicative. Elle dépend de la précision GPS du téléphone et ne remplace pas une mesure
          topographique officielle.
        </Text>
      </View>

      {shouldShowAccuracyWarning ? (
        <View style={styles.strongWarningCard}>
          <Text style={styles.strongWarningText}>
            Attention : précision GPS faible. Cette mesure doit être vérifiée avant toute décision importante.
          </Text>
        </View>
      ) : null}

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Nouvelle mesure" onPress={() => navigation.navigate('NewMeasurement')} />
        <PrimaryButton label="Accueil" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resultRow: {
    gap: 4,
    paddingVertical: 5,
  },
  resultValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  noticeCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  noticeText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  strongWarningCard: {
    backgroundColor: '#FFF3CD',
    borderColor: colors.warning,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  strongWarningText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
});
