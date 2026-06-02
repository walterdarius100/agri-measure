import { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const TAB_BAR_BASE_HEIGHT = 74;
const TAB_BAR_MIN_BOTTOM_PADDING = 20;
const TAB_BAR_TOP_PADDING = 8;

const tabIcons = {
  Home: ['home', 'home-outline'],
  NewMeasurement: ['add-circle', 'add-circle-outline'],
  History: ['time', 'time-outline'],
  Guide: ['book', 'book-outline'],
};

function MainTabs() {
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom + 8, TAB_BAR_MIN_BOTTOM_PADDING);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + bottomPadding;

  const commonTabOptions = useMemo(
    () => ({
      ...screenOptions,
      lazy: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarAllowFontScaling: false,
      tabBarHideOnKeyboard: true,
      tabBarItemStyle: {
        minHeight: TAB_BAR_BASE_HEIGHT,
        paddingTop: 2,
        paddingBottom: 4,
      },
      tabBarIconStyle: {
        marginTop: -2,
        marginBottom: 1,
      },
      tabBarLabelPosition: 'below-icon',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 15,
        marginTop: 1,
        marginBottom: 2,
      },
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        elevation: 8,
        height: tabBarHeight,
        paddingBottom: bottomPadding,
        paddingTop: TAB_BAR_TOP_PADDING,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
    [bottomPadding, tabBarHeight]
  );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarIcon: ({ color, focused }) => {
          const [focusedIcon, defaultIcon] = tabIcons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons color={color} name={focused ? focusedIcon : defaultIcon} size={26} />;
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
