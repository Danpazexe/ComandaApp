/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ComandaScreen from './src/screens/ComandaScreen';
import RelatorioScreen from './src/screens/RelatorioScreen';
import AdicionarSaborScreen from './src/screens/AdicionarSaborScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Comanda" component={ComandaScreen} options={{ title: 'Comanda', headerStyle: { backgroundColor: '#ffb300' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="Relatorio" component={RelatorioScreen} options={{ title: 'Relatório', headerStyle: { backgroundColor: '#4caf50' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="AdicionarSabor" component={AdicionarSaborScreen} options={{ title: 'Adicionar Sabor', headerStyle: { backgroundColor: '#1976d2' }, headerTintColor: '#fff' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
