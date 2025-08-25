import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

const TROFEU = require('../../assets/PASTELSEMFUNDO.png');

type AnimatedButtonProps = {
  onPress: () => void;
  color: object;
  children: ReactNode;
  style?: any;
};

function AnimatedButton({ onPress, color, children, style }: AnimatedButtonProps) {
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
      <Animated.View style={[styles.button, color, style, { transform: [{ scale: pressAnim }] }]}>        
        <Text style={styles.buttonText}>{children}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function HomeScreen({ navigation }: NativeStackScreenProps<any, 'Home'>) {
  const { width, height } = useWindowDimensions();
  const [animValue] = useState(new Animated.Value(0));

  // Responsive breakpoints
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const isMediumPhone = width >= 375 && width < 414;
  const isLargePhone = width >= 414 && width < 768;

  // Dynamic sizing based on screen dimensions
  const getResponsiveSize = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLargePhone) return large;
    if (isMediumPhone) return medium;
    return small;
  };

  // Dynamic spacing based on screen size
  const getSpacing = (small: number, medium: number, large: number) => {
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Dynamic width percentage based on screen size
  const getWidthPercentage = () => {
    if (isLargeTablet) return '80%';
    if (isTablet) return '85%';
    if (isLargePhone) return '95%';
    if (isMediumPhone) return '90%';
    return '85%';
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 3, duration: 1200, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [animValue]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[
        styles.container, 
        isLandscape && styles.containerLandscape,
        isTablet && styles.containerTablet
      ]}>
        <View style={[
          styles.contentBox, 
          isLandscape && styles.contentBoxLandscape,
          isTablet && styles.contentBoxTablet
        ]}>
          <Animated.Image
            source={TROFEU}
            style={[
              styles.logo,
              {
                width: getResponsiveSize(180, 200, 220, 280),
                height: getResponsiveSize(150, 165, 180, 230),
                marginBottom: getSpacing(60, 80, 108),
                marginTop: getSpacing(8, 10, 12),
              },
              isLandscape && styles.logoLandscape,
              isTablet && styles.logoTablet,
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
          <View style={[
            styles.buttonsBox,
            isTablet && styles.buttonsBoxTablet,
            isLandscape && styles.buttonsBoxLandscape
          ]}>
            <AnimatedButton
              onPress={() => navigation.navigate('Comanda', { nova: true })}
              color={styles.button}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Nova comanda
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('EditarComanda')}
              color={styles.buttonEdit}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Editar Comanda
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('AdicionarSabor')}
              color={styles.buttonAdd}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Gerenciar Cardápio
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('Relatorio')}
              color={styles.buttonSecondary}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Relatório
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('CozinhaMonitor')}
              color={styles.buttonCozinha}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Monitor da Cozinha
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('ClienteMonitor')}
              color={styles.buttonCliente}
              style={{
                paddingVertical: getResponsiveSize(16, 18, 20, 24),
                paddingHorizontal: getResponsiveSize(28, 32, 36, 40),
                marginBottom: getSpacing(14, 16, 18),
                maxWidth: getResponsiveSize(300, 340, 380, 450),
                width: getWidthPercentage(),
              }}
            >
              Monitor de Clientes
            </AnimatedButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  containerLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  containerTablet: {
    paddingHorizontal: 24,
  },
  contentBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBoxLandscape: {
    maxWidth: 500,
    width: '90%',
  },
  contentBoxTablet: {
    maxWidth: 600,
    width: '85%',
  },
  logo: {
    alignSelf: 'center',
  },
  logoLandscape: {
    marginBottom: 10,
    marginTop: 0,
  },
  logoTablet: {
    marginBottom: 40,
    marginTop: 20,
  },
  buttonsBox: {
    alignItems: 'center',
    width: '100%',
  },
  buttonsBoxTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  buttonsBoxLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#ffb300',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonSecondary: {
    backgroundColor: '#4caf50',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonAdd: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonEdit: {
    backgroundColor: '#9c27b0',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonCozinha: {
    backgroundColor: '#ff6b35',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonCliente: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
