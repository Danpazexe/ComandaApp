import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const COMANDAS_FECHADAS_KEY = 'comandas_fechadas';
const STORAGE_KEY = 'relatorio_vendas';

export interface Comanda {
  numero: number;
  data: string;
  itens: { nome: string; quantidade: number }[];
}

type Props = NativeStackScreenProps<any, 'ComandasFechadas'>;

export default function ComandasFechadasScreen({ navigation }: Props) {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    carregarComandas();
  }, [isFocused]);

  async function carregarComandas() {
    const data = await AsyncStorage.getItem(COMANDAS_FECHADAS_KEY);
    if (data) {
      setComandas(JSON.parse(data));
    }
  }

  function editarComanda(comanda: Comanda) {
    navigation.navigate('Comanda', { comanda });
  }

  async function excluirComanda(index: number) {
    Alert.alert(
      'Excluir Comanda',
      'Tem certeza que deseja excluir esta comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // Remove os itens da comanda do relatório
            const comanda = comandas[index];
            const itensRemover: string[] = [];
            comanda.itens.forEach(i => {
              for (let j = 0; j < i.quantidade; j++) {
                itensRemover.push(i.nome);
              }
            });

            // Atualiza o relatório
            const relatorioData = await AsyncStorage.getItem(STORAGE_KEY);
            let relatorio = relatorioData ? JSON.parse(relatorioData) : {};
            itensRemover.forEach(item => {
              if (relatorio[item] > 0) {
                relatorio[item]--;
              }
            });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(relatorio));

            // Remove a comanda
            const novasComandas = [...comandas];
            novasComandas.splice(index, 1);
            await AsyncStorage.setItem(COMANDAS_FECHADAS_KEY, JSON.stringify(novasComandas));
            setComandas(novasComandas);
          },
        },
      ]
    );
  }

  async function limparTodasComandas() {
    Alert.alert(
      'Limpar Todas as Comandas',
      'Tem certeza que deseja excluir todas as comandas?\nEsta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            // Atualiza o relatório removendo todos os itens
            const relatorioData = await AsyncStorage.getItem(STORAGE_KEY);
            let relatorio = relatorioData ? JSON.parse(relatorioData) : {};

            // Remove todos os itens de todas as comandas do relatório
            comandas.forEach(comanda => {
              comanda.itens.forEach(item => {
                for (let j = 0; j < item.quantidade; j++) {
                  if (relatorio[item.nome] > 0) {
                    relatorio[item.nome]--;
                  }
                }
              });
            });

            // Salva o relatório atualizado
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(relatorio));
            
            // Limpa as comandas
            await AsyncStorage.setItem(COMANDAS_FECHADAS_KEY, JSON.stringify([]));
            setComandas([]);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Comandas Fechadas</Text>
        <FlatList
          data={comandas}
          keyExtractor={(item) => item.numero.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.comandaCard}>
              <View style={styles.comandaHeader}>
                <Text style={styles.comandaNumero}>Comanda Nº {item.numero}</Text>
                <Text style={styles.comandaData}>{item.data}</Text>
              </View>
              <View style={styles.itensList}>
                {item.itens.map((item, idx) => (
                  <Text key={idx} style={styles.itemText}>
                    {item.nome} x {item.quantidade}
                  </Text>
                ))}
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => editarComanda(item)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => excluirComanda(index)}
                >
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.list}
        />
        {comandas.length > 0 && (
          <TouchableOpacity
            style={styles.limparButton}
            onPress={limparTodasComandas}
          >
            <Text style={styles.limparButtonText}>Limpar Todas as Comandas</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  limparButton: {
    backgroundColor: '#e53935',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  limparButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  comandaCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  comandaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53935',
  },
  comandaData: {
    fontSize: 14,
    color: '#666',
  },
  itensList: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#2196f3',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
