import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Item {
  nome: string;
  quantidade: number;
}
interface ComandaFechada {
  numero: number;
  itens: Item[];
  data: string;
}

export default function EditarComandaScreen() {
  const [comandas, setComandas] = useState<ComandaFechada[]>([]);
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    carregarComandas();
  }, []);

  async function carregarComandas() {
    let historico = await AsyncStorage.getItem('comandas_fechadas');
    setComandas(historico ? JSON.parse(historico) : []);
  }

  // Adicionar função para excluir comanda, atualizar relatório e comandas atendidas
  async function excluirComanda(comanda: ComandaFechada) {
    Alert.alert(
      'Excluir Comanda',
      'Tem certeza que deseja excluir esta comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          // Remover do histórico
          const novoHistorico = comandas.filter(c => c.numero !== comanda.numero);
          await AsyncStorage.setItem('comandas_fechadas', JSON.stringify(novoHistorico));
          setComandas(novoHistorico);
          // Atualizar relatório de vendas
          let vendasRaw = await AsyncStorage.getItem('relatorio_vendas');
          let vendas = vendasRaw ? JSON.parse(vendasRaw) : {};
          comanda.itens.forEach(item => {
            if (vendas[item.nome]) {
              vendas[item.nome] -= item.quantidade;
              if (vendas[item.nome] < 0) vendas[item.nome] = 0;
            }
          });
          await AsyncStorage.setItem('relatorio_vendas', JSON.stringify(vendas));
          // Atualizar comandas atendidas
          let atendidasRaw = await AsyncStorage.getItem('comandas_atendidas');
          let atendidas = atendidasRaw ? parseInt(atendidasRaw, 10) : 0;
          if (atendidas > 0) atendidas--;
          await AsyncStorage.setItem('comandas_atendidas', atendidas.toString());
        }}
      ]
    );
  }

  function editarComanda(comanda: ComandaFechada) {
    navigation.navigate('Comanda', { comandaParaEditar: comanda });
  }

  function zerarTudo() {
    Alert.alert('Zerar Tudo', 'Tem certeza que deseja apagar todas as comandas, relatório e contador?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Zerar', style: 'destructive', onPress: async () => {
        await AsyncStorage.setItem('comandas_fechadas', JSON.stringify([]));
        await AsyncStorage.setItem('relatorio_vendas', JSON.stringify({}));
        await AsyncStorage.setItem('comandas_atendidas', '0');
        await AsyncStorage.setItem('comanda_numero_atual', '1');
        setComandas([]);
      }}
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#9c27b0" barStyle="light-content" />
        
        <FlatList
          data={comandas}
          keyExtractor={(item, index) => `comanda-${item.numero}-${item.data}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.comandaItem}>
              <TouchableOpacity onPress={() => editarComanda(item)} style={{ flex: 1 }}>
                <View style={styles.comandaHeader}>
                  <Text style={styles.comandaNumero}>Comanda Nº {item.numero}</Text>
                  <Text style={styles.comandaData}>{item.data && item.data.substring(0, 10)}</Text>
                </View>
                <View style={styles.saboresLista}>
                  {item.itens.map((i, idx) => (
                    <View key={idx} style={styles.saborLinha}>
                      <Text style={styles.saborNome}>{i.nome}</Text>
                      <Text style={styles.saborQtd}>x {i.quantidade}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonExcluir} onPress={() => excluirComanda(item)}>
                <Text style={styles.buttonExcluirText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
          numColumns={2}
          columnWrapperStyle={styles.comandaRow}
        />
        <TouchableOpacity style={styles.buttonZerar} onPress={zerarTudo}>
          <Text style={styles.buttonZerarText}>Zerar Todas as Comandas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', padding: 16 },
  comandaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbe7',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0c97f',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flex: 1,
    maxWidth: '48%',
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  comandaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b8860b',
    letterSpacing: 1.2,
  },
  comandaData: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  saboresLista: { marginTop: 10, marginBottom: 2 },
  saborLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  saborNome: { fontSize: 15, color: '#333', fontFamily: 'monospace' },
  saborQtd: { fontSize: 15, color: '#b8860b', fontWeight: 'bold', fontFamily: 'monospace' },
  buttonExcluir: {
    backgroundColor: '#e53935',
    paddingVertical: 80,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 16,
    alignSelf: 'center',
    shadowColor: '#e53935',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  buttonExcluirText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  buttonZerar: { backgroundColor: '#e53935', padding: 22, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  buttonZerarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  comandaRow: { justifyContent: 'space-between', marginBottom: 8 },
}); 