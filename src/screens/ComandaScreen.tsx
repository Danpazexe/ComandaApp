import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ToastAndroid,
  StatusBar,
  useWindowDimensions,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { registrarVenda } from './RelatorioScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FirestoreService } from '../services/firestoreService';
import { Item } from '../types/Comanda';

const CARDAPIO_KEY = 'cardapio_dinamico';
const COMANDA_NUM_KEY = 'comanda_numero_atual';
const COMANDAS_ATENDIDAS_KEY = 'comandas_atendidas';

type Props = NativeStackScreenProps<any, 'Comanda'>;

export default function ComandaScreen({ route }: Props) {
  const [itens, setItens] = useState<Item[]>([]);
  const [cardapio, setCardapio] = useState<{ nome: string; valor: string }[]>(
    [],
  );
  const [fadeAnims, setFadeAnims] = useState<Animated.Value[]>([]);
  const [numeroComanda, setNumeroComanda] = useState<number | null>(null);
  const [totalSementes, setTotalSementes] = useState(0);
  const [nomeCliente, setNomeCliente] = useState<string>('');
  const [isEnviando, setIsEnviando] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height && width > 700;
  const isFocused = useIsFocused();

  useEffect(() => {
    async function carregarCardapio() {
      const data = await AsyncStorage.getItem(CARDAPIO_KEY);
      if (data) setCardapio(JSON.parse(data));
      else setCardapio([]);
    }
    carregarCardapio();
  }, []);

  useEffect(() => {
    if (route?.params?.comandaParaEditar) {
      setItens(route.params.comandaParaEditar.itens);
      setNumeroComanda(route.params.comandaParaEditar.numero);
      setNomeCliente(route.params.comandaParaEditar.nomeCliente || '');
    } else {
      async function buscarNumeroComanda() {
        try {
          // Usar numeração sequencial do Firestore
          const proximoNumero = await FirestoreService.gerarProximoNumero();
          setNumeroComanda(proximoNumero);
        } catch (error) {
          console.error('Erro ao buscar próximo número:', error);
          // Fallback para AsyncStorage
          let numAtual = await AsyncStorage.getItem(COMANDA_NUM_KEY);
          let numero = numAtual ? parseInt(numAtual, 10) : 1;
          setNumeroComanda(numero);
        }
      }
      if (isFocused) buscarNumeroComanda();
    }
  }, [isFocused, route?.params]);

  // Calcular total de sementes
  useEffect(() => {
    let total = 0;
    itens.forEach(item => {
      const cardapioItem = cardapio.find(c => c.nome === item.nome);
      if (cardapioItem) {
        total += parseInt(cardapioItem.valor) * item.quantidade;
      }
    });
    setTotalSementes(total);
  }, [itens, cardapio]);

  React.useEffect(() => {
    setFadeAnims(itens.map(() => new Animated.Value(1)));
  }, [itens]);

  function adicionarItem(itemNome: string) {
    setItens(prevItens => {
      const idx = prevItens.findIndex(i => i.nome === itemNome);
      if (idx !== -1) {
        // Já existe, soma quantidade
        const novos = [...prevItens];
        novos[idx] = { ...novos[idx], quantidade: novos[idx].quantidade + 1 };
        return novos;
      } else {
        // Novo item
        return [...prevItens, { nome: itemNome, quantidade: 1 }];
      }
    });
  }

  function removerItem(index: number) {
    setItens(prevItens => {
      const novos = [...prevItens];
      if (novos[index].quantidade > 1) {
        novos[index] = {
          ...novos[index],
          quantidade: novos[index].quantidade - 1,
        };
        return novos;
      } else {
        novos.splice(index, 1);
        return novos;
      }
    });
  }

  function limparComanda() {
    if (itens.length === 0) return;
    
    Alert.alert(
      'Limpar Comanda',
      'Tem certeza que deseja limpar todos os itens da comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: () => {
            setItens([]);
            ToastAndroid.show('Comanda limpa!', ToastAndroid.SHORT);
          }
        }
      ]
    );
  }

  async function fecharComanda() {
    if (itens.length === 0) {
      ToastAndroid.show('Adicione itens à comanda primeiro!', ToastAndroid.SHORT);
      return;
    }
    
    setIsEnviando(true);
    console.log('🚀 Iniciando processo de fechar comanda...');
    
    const itensParaRegistrar: string[] = [];
    itens.forEach(i => {
      for (let j = 0; j < i.quantidade; j++) itensParaRegistrar.push(i.nome);
    });

    try {
      if (route?.params?.comandaParaEditar) {
        console.log('📝 Editando comanda existente...');
        // EDIÇÃO: Atualizar comanda existente no Firestore
        if (route.params.comandaParaEditar.id) {
          await FirestoreService.atualizarComanda(
            route.params.comandaParaEditar.id,
            itens,
            totalSementes,
            nomeCliente
          );
        }
        
        // Atualizar relatório de vendas
        let vendasRaw = await AsyncStorage.getItem('relatorio_vendas');
        let vendas = vendasRaw ? JSON.parse(vendasRaw) : {};
        // Subtrai antigos
        route.params.comandaParaEditar.itens.forEach(
          (item: { nome: string; quantidade: number }) => {
            if (vendas[item.nome]) {
              vendas[item.nome] -= item.quantidade;
              if (vendas[item.nome] < 0) vendas[item.nome] = 0;
            }
          },
        );
        // Soma novos
        itens.forEach(i => {
          vendas[i.nome] = (vendas[i.nome] || 0) + i.quantidade;
        });
        await AsyncStorage.setItem('relatorio_vendas', JSON.stringify(vendas));
      } else {
        console.log('🆕 Criando nova comanda...');
        // NOVA: Criar comanda no Firestore
        if (numeroComanda !== null) {
          await FirestoreService.criarComanda(numeroComanda, itens, totalSementes, nomeCliente);
        }
        
        // Registrar vendas
        registrarVenda(itensParaRegistrar);
      }

      console.log('✅ Comanda salva com sucesso!');
      ToastAndroid.show('Comanda enviada para a cozinha!', ToastAndroid.SHORT);
      
      // Salvar no histórico local também
      if (numeroComanda !== null) {
        const comandaFechada = {
          numero: numeroComanda,
          nomeCliente,
          itens: [...itens],
          data: new Date().toISOString(),
          totalSementes: totalSementes,
        };
        let historico = await AsyncStorage.getItem('comandas_fechadas');
        let lista = historico ? JSON.parse(historico) : [];
        const idx = lista.findIndex((c: any) => c.numero === numeroComanda);
        if (route?.params?.comandaParaEditar && idx !== -1) {
          // Atualiza a comanda existente
          lista[idx] = comandaFechada;
        } else {
          // Adiciona nova comanda
          lista.push(comandaFechada);
        }
        await AsyncStorage.setItem('comandas_fechadas', JSON.stringify(lista));
      }
      
      if (!route?.params?.comandaParaEditar && numeroComanda !== null) {
        // Só incrementa o total se for nova comanda
        let atendidas = await AsyncStorage.getItem(COMANDAS_ATENDIDAS_KEY);
        let total = atendidas ? parseInt(atendidas, 10) + 1 : 1;
        await AsyncStorage.setItem(COMANDAS_ATENDIDAS_KEY, total.toString());
      }
      
      console.log('✅ Comanda enviada com sucesso!');
      
      // Limpar dados e preparar para nova comanda
      setItens([]);
      setNomeCliente('');
      
      // Buscar próximo número para nova comanda
      try {
        const proximoNumero = await FirestoreService.gerarProximoNumero();
        setNumeroComanda(proximoNumero);
      } catch (error) {
        console.error('Erro ao buscar próximo número:', error);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar comanda:', error);
      Alert.alert('Erro', 'Não foi possível salvar a comanda. Tente novamente.');
    } finally {
      setIsEnviando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={[styles.container, isLandscape && styles.containerLandscape]}
      >
        <StatusBar backgroundColor="#ffb300" barStyle="light-content" />
        
        {/* Coluna esquerda: Cardápio */}
        <View style={[styles.col, isLandscape && styles.colLeft]}>
          <FlatList
            data={cardapio}
            keyExtractor={item => item.nome}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => adicionarItem(item.nome)}
                activeOpacity={0.8}
              >
                <View style={styles.menuButtonContent}>
                  <Text style={styles.menuButtonTitle}>{item.nome}</Text>
                  <View style={styles.menuButtonFooter}>
                    <Icon name="attach-money" size={16} color="#fffde7" />
                    <Text style={styles.menuButtonValor}>{item.valor} Sementes</Text>
                  </View>
                </View>
                <Icon name="add-circle" size={24} color="#fff" style={styles.addIcon} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Coluna direita: Selecionados */}
        <View style={[styles.col, styles.colRight]}>
          {/* Número da Comanda, Título e Total na mesma linha */}
          <View style={styles.headerSection}>
            {numeroComanda !== null && (
              <View style={styles.comandaInfo}>
                <Icon name="confirmation-number" size={18} color="#e53935" />
                <Text style={styles.comandaNumero}>Comanda Nº {numeroComanda}</Text>
              </View>
            )}
            
            {itens.length > 0 && (
              <View style={styles.totalContainer}>
                <Icon name="account-balance-wallet" size={18} color="#4caf50" />
                <Text style={styles.totalText}>Total: {totalSementes} Sementes</Text>
              </View>
            )}
          </View>

          {/* Campo Nome do Cliente */}
          <View style={styles.clienteSection}>
            <View style={styles.clienteInputContainer}>
              <Icon name="person" size={20} color="#666" style={styles.clienteIcon} />
              <TextInput
                style={styles.clienteInput}
                placeholder="Nome do cliente (opcional)"
                value={nomeCliente}
                onChangeText={setNomeCliente}
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <FlatList
            data={itens}
            keyExtractor={(_, index) => `item-${index}`}
            renderItem={({ item, index }) => (
              <Animated.View
                style={[styles.itemRow, { opacity: fadeAnims[index] || 1 }]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.selectedItem}>{item.nome}</Text>
                  <View style={styles.itemDetails}>
                    <Icon name="shopping-cart" size={16} color="#666" />
                    <Text style={styles.itemQuantidade}>x{item.quantidade}</Text>
                    <Text style={styles.itemValor}>
                      {(() => {
                        const cardapioItem = cardapio.find(c => c.nome === item.nome);
                        return cardapioItem ? `${parseInt(cardapioItem.valor) * item.quantidade} Sementes` : '';
                      })()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removerItem(index)}
                  activeOpacity={0.8}
                >
                  <Icon name="remove" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="receipt-long" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum item selecionado</Text>
                <Text style={styles.emptySubtext}>Toque nos itens do cardápio para adicionar</Text>
              </View>
            }
          />

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            {itens.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={limparComanda}
                activeOpacity={0.8}
              >
                <Icon name="clear-all" size={20} color="#fff" />
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.finishButton, (itens.length === 0 || isEnviando) && styles.finishButtonDisabled]} 
              onPress={fecharComanda}
              disabled={itens.length === 0 || isEnviando}
              activeOpacity={0.8}
            >
              {isEnviando ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.finishButtonText}>Enviando...</Text>
                </>
              ) : (
                <>
                  <Icon name="restaurant" size={20} color="#fff" />
                  <Text style={styles.finishButtonText}>Enviar Comanda</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerLandscape: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    padding: 12,
  },
  colLeft: {
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    maxWidth: 400,
  },
  colRight: {
    flex: 1,
    paddingLeft: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffb300',
    borderStyle: 'dashed',
    
    margin: 10,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
    justifyContent: 'space-between',
  },
  comandaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: '#fed7d7',
    shadowColor: '#fed7d7',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  comandaNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53935',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  clienteSection: {
    marginBottom: 16,
  },
  clienteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clienteIcon: {
    marginRight: 8,
  },
  clienteInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  menuButton: {
    backgroundColor: '#ffb300',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#ffb300',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff8f00',
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  menuButtonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  menuButtonValor: {
    color: '#fffde7',
    fontSize: 13,
    fontWeight: '600',
  },
  addIcon: {
    marginLeft: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ffb300',
    
  },
  itemInfo: {
    flex: 1,
  },
  selectedItem: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQuantidade: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  itemValor: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 12,
    marginLeft: 12,
    
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  finishButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  finishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

});
