import { ScrollView, Text } from 'react-native';

import InfoCard from '../components/InfoCard';
import screenStyles from './screenStyles';

export default function GuideScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Guide</Text>
      <Text style={screenStyles.subtitle}>Bonnes pratiques pour préparer une mesure fiable sur le terrain.</Text>

      <InfoCard title="1. Préparer le parcours" description="Identifiez clairement les limites de la parcelle avant de commencer." />
      <InfoCard title="2. Faire le tour complet" description="Marchez autour du terrain à vitesse régulière avec une bonne vue du ciel." />
      <InfoCard title="3. Contrôler le résultat" description="Comparez toujours la mesure à votre connaissance du terrain." />
    </ScrollView>
  );
}
