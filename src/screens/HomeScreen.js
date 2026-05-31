import { ScrollView, Text, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import screenStyles from './screenStyles';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>AgriMeasure</Text>
      <Text style={screenStyles.subtitle}>
        Mesurez approximativement la superficie et le périmètre d’un terrain agricole avec le GPS du téléphone.
      </Text>

      <InfoCard
        title="Nouvelle mesure"
        description="Préparez une session de mesure terrain. Le GPS et les calculs seront ajoutés dans une prochaine étape."
      />

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Démarrer une mesure" onPress={() => navigation.navigate('NewMeasurement')} />
        <PrimaryButton label="Historique" onPress={() => navigation.navigate('History')} variant="secondary" />
        <PrimaryButton label="Guide d’utilisation" onPress={() => navigation.navigate('Guide')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
