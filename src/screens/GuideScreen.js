import { ScrollView, StyleSheet, Text, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import screenStyles from './screenStyles';

const guideSections = [
  {
    title: '1. Avant de commencer',
    items: [
      'Activer la localisation du téléphone',
      'Vérifier la batterie',
      'Se placer dans une zone dégagée',
      'Éviter bâtiments, arbres denses, murs et obstacles',
      'Attendre que le signal GPS se stabilise',
    ],
  },
  {
    title: '2. Méthode de mesure',
    items: [
      'Ouvrir Nouvelle mesure',
      'Remplir les informations client',
      'Se placer au premier coin du terrain',
      'Attendre une précision acceptable',
      'Appuyer sur Ajouter ce point',
      'Marcher vers le coin suivant',
      'Répéter pour chaque coin',
      'Ajouter au minimum 3 points',
      'L’application ferme automatiquement le polygone pour le calcul',
    ],
  },
  {
    title: '3. Précision GPS',
    items: [
      '0 à 5 m : bonne précision',
      'plus de 5 à 10 m : précision moyenne',
      'plus de 10 m : précision faible',
      'plus de 15 m : mesure à éviter ou à confirmer',
    ],
  },
  {
    title: '4. Bonnes pratiques',
    items: [
      'Ne pas ajouter les points trop rapidement',
      'Ne pas ajouter deux points au même endroit',
      'Se placer près des vrais coins du terrain',
      'Noter les obstacles dans les notes terrain',
      'Refaire la mesure si le résultat semble incohérent',
    ],
  },
  {
    title: '6. Checklist rapide',
    items: [
      'Informations client remplies',
      'GPS activé',
      'Signal stabilisé',
      'Au moins 3 points enregistrés',
      'Points placés aux coins réels du terrain',
      'Précision GPS vérifiée',
      'Notes terrain ajoutées si nécessaire',
    ],
  },
];

function BulletList({ items }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function GuideScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={screenStyles.content} style={screenStyles.container}>
      <Text style={screenStyles.title}>Guide de mesure</Text>
      <Text style={screenStyles.subtitle}>
        Suivez ces étapes pour préparer, enregistrer et vérifier une mesure de parcelle avec AgriMeasure.
      </Text>

      {guideSections.slice(0, 4).map((section) => (
        <InfoCard key={section.title} title={section.title}>
          <BulletList items={section.items} />
        </InfoCard>
      ))}

      <InfoCard title="5. Limites">
        <Text style={styles.paragraph}>
          AgriMeasure fournit une mesure indicative réalisée avec GPS mobile. Les résultats dépendent de la précision du
          signal GPS, du téléphone utilisé et des conditions du terrain. Cette application ne remplace pas une mesure
          topographique, cadastrale ou juridique officielle.
        </Text>
      </InfoCard>

      <InfoCard title={guideSections[4].title}>
        <BulletList items={guideSections[4].items} />
      </InfoCard>

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Commencer une nouvelle mesure" onPress={() => navigation.navigate('NewMeasurement')} />
        <PrimaryButton label="Retour à l’accueil" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  itemText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
  paragraph: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
});
