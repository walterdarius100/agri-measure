import { ScrollView, Text, View } from 'react-native';

import AccuracyBadge from '../components/AccuracyBadge';
import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import screenStyles from './screenStyles';

export default function MeasureMapScreen({ navigation, route }) {
  const measurementInfo = route.params?.measurementInfo;

  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Carte de mesure</Text>
      <Text style={screenStyles.subtitle}>Écran réservé au suivi GPS et à l’affichage de la trace.</Text>

      <AccuracyBadge />

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

      <View style={screenStyles.placeholder}>
        <Text style={screenStyles.placeholderText}>
          Carte et acquisition GPS à implémenter. Aucun point GPS n’est collecté pour le moment.
        </Text>
      </View>

      <InfoCard title="Mode brouillon" description="La navigation est prête, mais les capteurs ne sont pas encore activés." />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Voir le résultat de test" onPress={() => navigation.navigate('Result')} />
        <PrimaryButton label="Annuler" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
