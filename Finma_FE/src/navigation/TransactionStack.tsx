import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { TransactionListScreen } from '../screens/TransactionListScreen';
import type { TransactionStackParamList } from './types';

const Stack = createNativeStackNavigator<TransactionStackParamList>();

export function TransactionStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionList" component={TransactionListScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    </Stack.Navigator>
  );
}
