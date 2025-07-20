import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <Image
          source={require('../assets/PASTELSEMFUNDO.png')}
          style={[styles.logo, isLandscape && styles.logoLandscape]}
          resizeMode="contain"
        />
        <View style={[styles.buttonsBox, isLandscape && styles.buttonsBoxLandscape]}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Comanda', { nova: true })}>
            <Text style={styles.buttonText}>Abrir nova comanda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('Relatorio')}>
            <Text style={styles.buttonText}>Relatório de Saída</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonAdd} onPress={() => navigation.navigate('AdicionarSabor')}>
            <Text style={styles.buttonText}>Novo/Editar Sabor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  containerLandscape: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  logo: { width: 300, height: 230, marginBottom: 82, marginTop: 12 },
  logoLandscape: { width: 250, height: 200, marginBottom: 0, marginTop: 0 },
  buttonsBox: { alignItems: 'center' },
  buttonsBoxLandscape: { alignItems: 'flex-start', justifyContent: 'center' },
  button: { backgroundColor: '#ffb300', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, marginBottom: 20, width: 250, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#4caf50', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, width: 250, alignItems: 'center', marginBottom: 20 },
  buttonAdd: { backgroundColor: '#1976d2', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, width: 250, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
}); 