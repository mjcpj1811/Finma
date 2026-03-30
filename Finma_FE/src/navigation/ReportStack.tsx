import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ReportScreen } from '../screens/ReportScreen';
import type { ReportStackParamList } from './types';

const Stack = createNativeStackNavigator<ReportStackParamList>();

export function ReportStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
    </Stack.Navigator>
  );
}
