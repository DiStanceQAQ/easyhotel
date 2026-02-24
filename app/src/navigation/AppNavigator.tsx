import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../theme/tokens';
import { HotelDetailScreen } from '../screens/HotelDetailScreen';
import { HotelListScreen } from '../screens/HotelListScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.ink900,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HotelList"
        component={HotelListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HotelDetail"
        component={HotelDetailScreen}
        options={{
          headerShown: true,
          title: '酒店详情',
        }}
      />
    </Stack.Navigator>
  );
}
