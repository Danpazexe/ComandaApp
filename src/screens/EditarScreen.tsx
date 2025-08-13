import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
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

export default function EditarScreen() {
  const [comandas, setComandas] = useState<ComandaFechada[]>([]);
  const [comandasFiltradas, setComandasFiltradas] = useState<ComandaFechada[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [ordenacaoNumero, setOrdenacaoNumero] = useState<'crescente' | 'decrescente'>('crescente');
  const navigation = useNavigation<NavigationProp<any>>();

  const filtrarEOrdenarComandas = useCallback(() => {
    let comandasProcessadas = [...comandas];

    // Filtrar por número da comanda
    if (pesquisa.trim()) {
      const numeroPesquisa = parseInt(pesquisa.trim());
      if (!isNaN(numeroPesquisa)) {
        comandasProcessadas = comandasProcessadas.filter(
          comanda => comanda.numero === numeroPesquisa
        );
      }
    }

    // Ordenar por número da comanda
    if (ordenacaoNumero === 'crescente') {
      comandasProcessadas.sort((a, b) => a.numero - b.numero);
    } else {
      comandasProcessadas.sort((a, b) => b.numero - a.numero);
    }

    setComandasFiltradas(comandasProcessadas);
  }, [comandas, pesquisa, ordenacaoNumero]);

  useEffect(() => {
    carregarComandas();
  }, []);

  // Escutar mudanças nos parâmetros da navegação (quando o botão zerar é pressionado)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarComandas();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filtrarEOrdenarComandas();
  }, [filtrarEOrdenarComandas]);

  async function carregarComandas() {
    let historico = await AsyncStorage.getItem('comandas_fechadas');
    const comandasCarregadas = historico ? JSON.parse(historico) : [];
    setComandas(comandasCarregadas);
  }

  function formatarDataHora(dataStr: string) {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr;
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Adicionar função para excluir comanda, atualizar relatório e comandas atendidas
  async function excluirComanda(comanda: ComandaFechada) {
    Alert.alert(
      'Excluir Comanda',
      'Tem certeza que deseja excluir esta comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // Remover do histórico
            const novoHistorico = comandas.filter(
              c => c.numero !== comanda.numero,
            );
            await AsyncStorage.setItem(
              'comandas_fechadas',
              JSON.stringify(novoHistorico),
            );
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
            await AsyncStorage.setItem(
              'relatorio_vendas',
              JSON.stringify(vendas),
            );
            // Atualizar comandas atendidas
            let atendidasRaw = await AsyncStorage.getItem('comandas_atendidas');
            let atendidas = atendidasRaw ? parseInt(atendidasRaw, 10) : 0;
            if (atendidas > 0) atendidas--;
            await AsyncStorage.setItem(
              'comandas_atendidas',
              atendidas.toString(),
            );
          },
        },
      ],
    );
  }

  function editarComanda(comanda: ComandaFechada) {
    navigation.navigate('Comanda', { comandaParaEditar: comanda });
  }





  function limparPesquisa() {
    setPesquisa('');
  }

  function alternarOrdenacao() {
    // Alterna entre ordenação crescente e decrescente por número
    setOrdenacaoNumero(ordenacaoNumero === 'crescente' ? 'decrescente' : 'crescente');
  }

  function zerarTudo() {
    Alert.alert(
      'Zerar Tudo',
      'Tem certeza que deseja apagar todas as comandas, relatório e contador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('comandas_fechadas', JSON.stringify([]));
            await AsyncStorage.setItem('relatorio_vendas', JSON.stringify({}));
            await AsyncStorage.setItem('comandas_atendidas', '0');
            await AsyncStorage.setItem('comanda_numero_atual', '1');
            setComandas([]);
            setPesquisa('');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#9c27b0" barStyle="light-content" />

        {/* Campo de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por número da comanda..."
              placeholderTextColor="#9ca3af"
              value={pesquisa}
              onChangeText={setPesquisa}
              keyboardType="numeric"
              maxLength={10}
            />
            {pesquisa.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={limparPesquisa}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.sortButton, ordenacaoNumero === 'decrescente' && styles.sortButtonActive]}
            onPress={alternarOrdenacao}
          >
            <Text style={[styles.sortButtonText, ordenacaoNumero === 'decrescente' && styles.sortButtonTextActive]}>
              {ordenacaoNumero === 'crescente' ? 'Número ↑' : 'Número ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contador de resultados */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {comandasFiltradas.length} comanda{comandasFiltradas.length !== 1 ? 's' : ''} encontrada{comandasFiltradas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={comandasFiltradas}
          keyExtractor={(item, index) =>
            `comanda-${item.numero}-${item.data}-${index}`
          }
          renderItem={({ item }) => (
            <View style={styles.comandaItem}>
              <View style={styles.comandaHeader}>
                <View style={styles.comandaNumeroContainer}>
                  <Text style={styles.comandaNumero}>
                    #{item.numero}
                  </Text>
                </View>
                <Text style={styles.comandaData}>
                  {item.data && formatarDataHora(item.data)}
                </Text>
              </View>
              
              <View style={styles.comandaContent}>
                <View style={styles.saboresLista}>
                  {item.itens.map((i, idx) => (
                    <View key={idx} style={styles.saborLinha}>
                      <Text style={styles.saborNome} numberOfLines={1}>
                        {i.nome}
                      </Text>
                      <View style={styles.quantidadeContainer}>
                        <Text style={styles.saborQtd}>
                          {i.quantidade}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.buttonEditar}
                  onPress={() => editarComanda(item)}
                >
                  <Text style={styles.buttonEditarText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonExcluir}
                  onPress={() => excluirComanda(item)}
                >
                  <Text style={styles.buttonExcluirText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {pesquisa ? 'Nenhuma comanda encontrada com este número' : 'Nenhuma comanda encontrada'}
              </Text>
            </View>
          }
        />
        
        <TouchableOpacity style={styles.buttonZerar} onPress={zerarTudo}>
          <Text style={styles.buttonZerarText}>Zerar Todas as Comandas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#374151',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#9ca3af',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sortButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sortButtonActive: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
    shadowColor: '#9c27b0',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sortButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  comandaItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  comandaNumeroContainer: {
    backgroundColor: '#9c27b0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  comandaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  comandaData: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  comandaContent: {
    flex: 1,
  },
  saboresLista: {
    marginBottom: 16,
  },
  saborLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  saborNome: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  quantidadeContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  saborQtd: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  buttonEditar: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#2196f3',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonEditarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonExcluir: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#f44336',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonExcluirText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonZerar: {
    backgroundColor: '#dc3545',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#dc3545',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonZerarText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

});
