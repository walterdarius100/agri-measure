import { ScrollView, Text, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import screenStyles from './screenStyles';

export default function ResultScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Résultat</Text>
      <Text style={screenStyles.subtitle}>Les valeurs seront calculées avec Turf lors de la prochaine étape.</Text>

      <InfoCard title="Superficie" description="Non calculée" />
      <InfoCard title="Périmètre" description="Non calculé" />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Nouvelle mesure" onPress={() => navigation.navigate('NewMeasurement')} />
        <PrimaryButton label="Accueil" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
