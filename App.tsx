/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SplashScreen from './src/screens/Splash/SplashScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import ComandaScreen from './src/screens/Comanda/ComandaScreen';
import EditarScreen from './src/screens/Editar/EditarScreen';
import GerenciarScreen from './src/screens/Gerenciar/GerenciarScreen';
import RelatorioScreen from './src/screens/Relatorio/RelatorioScreen';
import CozinhaMonitorScreen from './src/screens/Cozinha/CozinhaMonitorScreen';
import ConfigScreen from './src/screens/Config/ConfigScreen';

const Stack = createNativeStackNavigator();

// Componente para gerenciar a StatusBar baseada na rota
function StatusBarManager({ routeName }: { routeName: string }) {
  // Atualizar a StatusBar quando a rota mudar
  useFocusEffect(
    React.useCallback(() => {
      applyStatusBarConfig(routeName);
    }, [routeName])
  );

  // Função para aplicar a configuração da StatusBar com base na rota
  function applyStatusBarConfig(route: string) {
    switch (route) {
        case 'Home':
          StatusBar.setBarStyle('dark-content');
          StatusBar.setBackgroundColor('#ffffff');
          break;
        case 'Comanda':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#ffb300');
          break;
        case 'Relatorio':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#4caf50');
          break;
        case 'AdicionarSabor':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#1976d2');
          break;
        case 'EditarComanda':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#9c27b0');
          break;
        case 'CozinhaMonitor':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#ff6b35');
          break;
        case 'Config':
          StatusBar.setBarStyle('light-content');
          StatusBar.setBackgroundColor('#6366f1');
          break;
      }
    }

  return null;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = React.useState('Home');
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* A StatusBar será gerenciada pelo StatusBarManager baseado na rota */}
      <NavigationContainer
        onStateChange={(state) => {
          const route = state?.routes[state.index];
          if (route?.name) {
            setCurrentRoute(route.name);
          }
        }}
      >
        <StatusBarManager routeName={currentRoute} />
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
                headerShown: false,
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

          <Stack.Screen
            name="Config"
            component={ConfigScreen}
            options={{
                headerShown: false,
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: '#fff',
              }}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
