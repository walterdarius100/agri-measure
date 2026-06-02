import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';
import GuideScreen from '../screens/GuideScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import MeasureMapScreen from '../screens/MeasureMapScreen';
import NewMeasurementScreen from '../screens/NewMeasurementScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

const tabIcons = {
  Home: ['home', 'home-outline'],
  NewMeasurement: ['add-circle', 'add-circle-outline'],
  History: ['time', 'time-outline'],
  Guide: ['book', 'book-outline'],
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, focused, size }) => {
          const [focusedIcon, defaultIcon] = tabIcons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons color={color} name={focused ? focusedIcon : defaultIcon} size={size} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil', tabBarLabel: 'Accueil' }} />
      <Tab.Screen
        name="NewMeasurement"
        component={NewMeasurementScreen}
        options={{ title: 'Nouvelle mesure', tabBarLabel: 'Mesure' }}
      />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historique', tabBarLabel: 'Historique' }} />
      <Tab.Screen name="Guide" component={GuideScreen} options={{ title: 'Guide', tabBarLabel: 'Guide' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs" screenOptions={screenOptions}>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="MeasureMap" component={MeasureMapScreen} options={{ title: 'Mesure' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Résultat' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
