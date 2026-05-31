import { ScrollView, Text } from 'react-native';

import InfoCard from '../components/InfoCard';
import screenStyles from './screenStyles';

export default function HistoryScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Historique</Text>
      <Text style={screenStyles.subtitle}>Les mesures sauvegardées localement apparaîtront ici.</Text>

      <InfoCard title="Aucune mesure" description="La persistance locale sera branchée après la structure initiale." />
    </ScrollView>
  );
}
