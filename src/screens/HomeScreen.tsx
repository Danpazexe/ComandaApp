import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

const TROFEU = require('../assets/PASTELSEMFUNDO.png');

type AnimatedButtonProps = {
  onPress: () => void;
  color: object;
  children: ReactNode;
};

function AnimatedButton({ onPress, color, children }: AnimatedButtonProps) {
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
      <Animated.View style={[styles.button, color, { transform: [{ scale: pressAnim }] }]}>        
        <Text style={styles.buttonText}>{children}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function HomeScreen({ navigation }: NativeStackScreenProps<any, 'Home'>) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [animValue] = useState(new Animated.Value(0));

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
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        <View style={[styles.contentBox, isLandscape && styles.contentBoxLandscape]}>
          <Animated.Image
            source={TROFEU}
            style={[
              styles.logo,
              isLandscape && styles.logoLandscape,
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
          <View style={styles.buttonsBox}>
            <AnimatedButton
              onPress={() => navigation.navigate('Comanda', { nova: true })}
              color={styles.button}
            >
              Nova comanda
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('EditarComanda')}
              color={styles.buttonEdit}
            >
              Editar Comanda Fechada
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('Relatorio')}
              color={styles.buttonSecondary}
            >
              Relatório de Saída
            </AnimatedButton>
            <AnimatedButton
              onPress={() => navigation.navigate('AdicionarSabor')}
              color={styles.buttonAdd}
            >
              Novo/Editar Sabor
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
  logo: {
    width: 220,
    height: 180,
    marginBottom: 108,
    marginTop: 12,
    alignSelf: 'center',
  },
  logoLandscape: {
    width: 150,
    height: 120,
    marginBottom: 10,
    marginTop: 0,
  },
  buttonsBox: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#ffb300',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 18,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#4caf50',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonAdd: {
    backgroundColor: '#1976d2',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonEdit: {
    backgroundColor: '#9c27b0',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
