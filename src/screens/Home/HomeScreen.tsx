import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const TROFEU = require('../../assets/LOGOSEMFUNDO.png');

type AnimatedButtonProps = {
  onPress: () => void;
  gradient: string[];
  children: ReactNode;
  style?: any;
};

function AnimatedButton({ onPress, gradient, children, style }: AnimatedButtonProps) {
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale: pressAnim }] }, style]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>{children}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function HomeScreen({ navigation }: NativeStackScreenProps<any, 'Home'>) {
  const { width, height } = useWindowDimensions();
  const [animValue] = useState(new Animated.Value(0));

  const isLandscape = width > height;
  const isTablet = width >= 768;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [animValue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        {/* Logo flutuando */}
        <Animated.Image
          source={TROFEU}
          style={[
            styles.logo,
            {
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Card de botões */}
        <View style={[styles.card, isTablet && { maxWidth: 500 }]}>
          <AnimatedButton
            onPress={() => navigation.navigate('Comanda', { nova: true })}
            gradient={['#ff9800', '#ffb74d']}
            style={styles.buttonWrapper}
          >
            Nova Comanda
          </AnimatedButton>

          <AnimatedButton
            onPress={() => navigation.navigate('EditarComanda')}
            gradient={['#8e24aa', '#ba68c8']}
            style={styles.buttonWrapper}
          >
            Editar Comanda
          </AnimatedButton>

          <AnimatedButton
            onPress={() => navigation.navigate('AdicionarSabor')}
            gradient={['#1976d2', '#64b5f6']}
            style={styles.buttonWrapper}
          >
            Gerenciar Cardápio
          </AnimatedButton>

          <AnimatedButton
            onPress={() => navigation.navigate('Relatorio')}
            gradient={['#43a047', '#81c784']}
            style={styles.buttonWrapper}
          >
            Relatório
          </AnimatedButton>

          <AnimatedButton
            onPress={() => navigation.navigate('CozinhaMonitor')}
            gradient={['#ef6c00', '#ff8a65']}
            style={styles.buttonWrapper}
          >
            Monitor da Cozinha
          </AnimatedButton>

          <AnimatedButton
            onPress={() => Linking.openURL('https://comandaapp-797db.web.app')}
            gradient={['#1e3a8a', '#3b82f6']}
            style={styles.buttonWrapper}
          >
            Monitor de Clientes
          </AnimatedButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  containerLandscape: { flexDirection: 'row' },

  logo: {
    width: 200,
    height: 160,
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },

  buttonWrapper: { width: '100%', marginBottom: 14 },

  gradientButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
