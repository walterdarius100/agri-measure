import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import InfoCard from '../components/InfoCard';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import screenStyles from './screenStyles';

const initialFormState = {
  clientName: '',
  phone: '',
  locationName: '',
  projectType: '',
  notes: '',
};

export default function NewMeasurementScreen({ navigation }) {
  const [form, setForm] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState('');

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));

    if (errorMessage) {
      setErrorMessage('');
    }
  }

  function handleStartMeasurement() {
    const measurementInfo = {
      clientName: form.clientName.trim(),
      phone: form.phone.trim(),
      locationName: form.locationName.trim(),
      projectType: form.projectType.trim(),
      notes: form.notes.trim(),
    };

    if (!measurementInfo.clientName || !measurementInfo.locationName || !measurementInfo.projectType) {
      setErrorMessage('Veuillez renseigner le nom du client, la localisation / zone et le type de projet agricole.');
      return;
    }

    navigation.navigate('MeasureMap', { measurementInfo });
  }

  return (
    <ScrollView
      contentContainerStyle={screenStyles.content}
      keyboardShouldPersistTaps="handled"
      style={screenStyles.container}>
      <Text style={screenStyles.title}>Nouvelle mesure</Text>
      <Text style={screenStyles.subtitle}>Renseignez les informations de la mission avant la mesure terrain.</Text>

      <InfoCard
        title="Avant de commencer"
        description="Ces informations accompagneront la mesure. La collecte GPS et les calculs de surface seront ajoutés plus tard."
      />

      <View style={screenStyles.formCard}>
        <View style={screenStyles.formField}>
          <Text style={screenStyles.inputLabel}>Nom du client *</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => updateField('clientName', value)}
            placeholder="Ex. Coopérative Bassin Vert"
            placeholderTextColor={colors.muted}
            style={screenStyles.textInput}
            value={form.clientName}
          />
        </View>

        <View style={screenStyles.formField}>
          <Text style={screenStyles.inputLabel}>Téléphone</Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(value) => updateField('phone', value)}
            placeholder="Ex. +225 07 00 00 00 00"
            placeholderTextColor={colors.muted}
            style={screenStyles.textInput}
            value={form.phone}
          />
        </View>

        <View style={screenStyles.formField}>
          <Text style={screenStyles.inputLabel}>Localisation / zone *</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => updateField('locationName', value)}
            placeholder="Ex. Zone agricole de Yamoussoukro"
            placeholderTextColor={colors.muted}
            style={screenStyles.textInput}
            value={form.locationName}
          />
        </View>

        <View style={screenStyles.formField}>
          <Text style={screenStyles.inputLabel}>Type de projet agricole *</Text>
          <TextInput
            autoCapitalize="sentences"
            onChangeText={(value) => updateField('projectType', value)}
            placeholder="Ex. Plantation de cacao"
            placeholderTextColor={colors.muted}
            style={screenStyles.textInput}
            value={form.projectType}
          />
        </View>

        <View style={screenStyles.formField}>
          <Text style={screenStyles.inputLabel}>Notes terrain</Text>
          <TextInput
            multiline
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Ajoutez les remarques utiles pour la visite."
            placeholderTextColor={colors.muted}
            style={[screenStyles.textInput, screenStyles.textArea]}
            textAlignVertical="top"
            value={form.notes}
          />
        </View>

        {errorMessage ? <Text style={screenStyles.errorText}>{errorMessage}</Text> : null}
      </View>

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton label="Commencer la mesure" onPress={handleStartMeasurement} />
        <PrimaryButton label="Retour à l’accueil" onPress={() => navigation.navigate('Home')} variant="secondary" />
      </View>
    </ScrollView>
  );
}
