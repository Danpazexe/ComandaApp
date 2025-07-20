import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARDAPIO_KEY = 'cardapio_dinamico';
const STORAGE_KEY = 'relatorio_vendas';

let vendasGlobais: Record<string, number> = {};

async function salvarVendas() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vendasGlobais));
}

async function carregarVendas() {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data) {
    const obj = JSON.parse(data);
    vendasGlobais = obj;
  }
}

export async function registrarVenda(itens: string[]) {
  itens.forEach(item => {
    vendasGlobais[item] = (vendasGlobais[item] || 0) + 1;
  });
  await salvarVendas();
}

export default function RelatorioScreen() {
  const [vendas, setVendas] = useState<Record<string, number>>({ ...vendasGlobais });
  const [cardapio, setCardapio] = useState<{ nome: string, valor: string }[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function sync() {
      await carregarVendas();
      const data = await AsyncStorage.getItem(CARDAPIO_KEY);
      setCardapio(data ? JSON.parse(data) : []);
      setVendas({ ...vendasGlobais });
    }
    if (isFocused) sync();
  }, [isFocused]);

  async function limparRelatorio() {
    Alert.alert('Limpar Relatório', 'Tem certeza que deseja zerar o relatório?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => {
        Object.keys(vendasGlobais).forEach(k => vendasGlobais[k] = 0);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vendasGlobais));
        setVendas({ ...vendasGlobais });
      }}
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#4caf50" barStyle="light-content" />
        <View style={styles.headerRow}>
          <Text style={styles.headerItem}>Sabores</Text>
          <Text style={styles.headerItem}>Quantidade</Text>
        </View>
        <FlatList
          data={cardapio}
          keyExtractor={item => item.nome}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.item}>{item.nome}</Text>
              <Text style={styles.count}>{vendas[item.nome] || 0}</Text>
            </View>
          )}
        />
        <TouchableOpacity style={styles.clearButton} onPress={limparRelatorio}>
          <Text style={styles.clearButtonText}>Limpar Relatório</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4 },
  headerItem: { fontSize: 16, fontWeight: 'bold', color: '#333', width: '50%', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, backgroundColor: '#fff', borderRadius: 6, padding: 8, elevation: 1 },
  item: { fontSize: 16, color: '#333', width: '50%', textAlign: 'center' },
  count: { fontSize: 16, fontWeight: 'bold', color: '#333', width: '50%', textAlign: 'center' },
  clearButton: { backgroundColor: '#e53935', padding: 22, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  clearButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 