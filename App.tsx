/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ComandaScreen from './src/screens/ComandaScreen';
import EditarScreen from './src/screens/EditarScreen';
import GerenciarScreen from './src/screens/GerenciarScreen';
import RelatorioScreen from './src/screens/RelatorioScreen';
import CozinhaMonitorScreen from './src/screens/CozinhaMonitorScreen';
import './src/config/firebase';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerShown: false,
              headerStyle: { backgroundColor: '#ffb300' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Comanda"
            component={ComandaScreen}
            options={{
              title: 'Comanda',
              headerStyle: { backgroundColor: '#ffb300' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="Relatorio"
            component={RelatorioScreen}
            options={{
              title: 'Relatório',
              headerStyle: { backgroundColor: '#4caf50' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="AdicionarSabor"
            component={GerenciarScreen}
            options={{
              title: 'Gerenciar Cardápio',
              headerStyle: { backgroundColor: '#1976d2' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="EditarComanda"
            component={EditarScreen}
            options={{
              title: 'Editar Comanda',
              headerStyle: { backgroundColor: '#9c27b0' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="CozinhaMonitor"
            component={CozinhaMonitorScreen}
            options={{
              title: 'Monitor da Cozinha',
              headerStyle: { backgroundColor: '#ff6b35' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
