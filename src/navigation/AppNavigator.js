import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import colors from '../constants/colors';
import GuideScreen from '../screens/GuideScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import MeasureMapScreen from '../screens/MeasureMapScreen';
import NewMeasurementScreen from '../screens/NewMeasurementScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  contentStyle: {
    backgroundColor: colors.background,
  },
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerTintColor: colors.primaryDark,
  headerTitleStyle: {
    fontWeight: '700',
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
        <Stack.Screen name="NewMeasurement" component={NewMeasurementScreen} options={{ title: 'Nouvelle mesure' }} />
        <Stack.Screen name="MeasureMap" component={MeasureMapScreen} options={{ title: 'Mesure' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Résultat' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Historique' }} />
        <Stack.Screen name="Guide" component={GuideScreen} options={{ title: 'Guide' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
