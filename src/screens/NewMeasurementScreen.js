import { ScrollView, Text, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import screenStyles from './screenStyles';

export default function NewMeasurementScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Nouvelle mesure</Text>
      <Text style={screenStyles.subtitle}>Vérifiez les consignes avant de partir autour de la parcelle.</Text>

      <InfoCard
        title="Avant de commencer"
        description="Placez-vous au point de départ, gardez le téléphone chargé et faites le tour complet du terrain."
      />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Aller à la carte" onPress={() => navigation.navigate('MeasureMap')} />
        <PrimaryButton label="Retour à l’accueil" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
