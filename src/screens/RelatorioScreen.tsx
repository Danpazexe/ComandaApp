import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARDAPIO_KEY = 'cardapio_dinamico';
const STORAGE_KEY = 'relatorio_vendas';
const COMANDAS_ATENDIDAS_KEY = 'comandas_atendidas';
const COMANDA_NUM_KEY = 'comanda_numero_atual';

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
  const [comandasAtendidas, setComandasAtendidas] = useState<number>(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function sync() {
      await carregarVendas();
      const data = await AsyncStorage.getItem(CARDAPIO_KEY);
      setCardapio(data ? JSON.parse(data) : []);
      setVendas({ ...vendasGlobais });
      // Buscar total de comandas atendidas
      const atendidas = await AsyncStorage.getItem(COMANDAS_ATENDIDAS_KEY);
      setComandasAtendidas(atendidas ? parseInt(atendidas, 10) : 0);
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

  async function limparComandasAtendidas() {
    Alert.alert('Limpar Comandas', 'Tem certeza que deseja zerar o contador de comandas atendidas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => {
        await AsyncStorage.setItem(COMANDAS_ATENDIDAS_KEY, '0');
        await AsyncStorage.setItem(COMANDA_NUM_KEY, '1');
        setComandasAtendidas(0);
      }}
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#4caf50" barStyle="light-content" />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 12 }}>Comandas atendidas: {comandasAtendidas}</Text>
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
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <TouchableOpacity style={[styles.clearButton, { flex: 1, marginRight: 8 }]} onPress={limparRelatorio}>
            <Text style={styles.clearButtonText}>Limpar Relatório</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.clearButton, { flex: 1, marginLeft: 8 }]} onPress={limparComandasAtendidas}>
            <Text style={styles.clearButtonText}>Limpar Comandas</Text>
          </TouchableOpacity>
        </View>
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