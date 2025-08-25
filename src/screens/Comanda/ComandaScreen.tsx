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
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FirestoreService } from '../../services/firestoreService';
import { FONTS } from '../../config/fonts';
import { Item } from '../../types/Comanda';

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
  const isFocused = useIsFocused();

  // Responsive breakpoints
  const isLandscape = width > height && width > 700;
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
  const getSpacing = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Dynamic padding based on screen size
  const getPadding = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Dynamic font size based on screen size
  const getFontSize = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  useEffect(() => {
    async function carregarCardapio() {
      try {
        // Inicializar cardápio se necessário
        await FirestoreService.inicializarCardapio();
        
        // Carregar cardápio do Firebase
        const cardapioFirebase = await FirestoreService.buscarCardapio();
        setCardapio(cardapioFirebase);
      } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
        setCardapio([]);
      }
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
          // Fallback para número 1
          setNumeroComanda(1);
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
        
        // Não precisa mais atualizar relatório manualmente para edição
        // O relatório será baseado nas comandas do Firebase
      } else {
        console.log('🆕 Criando nova comanda...');
        // NOVA: Criar comanda no Firestore
        if (numeroComanda !== null) {
          await FirestoreService.criarComanda(numeroComanda, itens, totalSementes, nomeCliente);
        }
        
        // Registrar vendas no Firebase
        await FirestoreService.registrarVendas(itensParaRegistrar);
      }

      console.log('✅ Comanda salva com sucesso!');
      ToastAndroid.show('Comanda enviada para a cozinha!', ToastAndroid.SHORT);
      
      // Incrementar contador de comandas atendidas se for nova comanda
      if (!route?.params?.comandaParaEditar && numeroComanda !== null) {
        await FirestoreService.incrementarComandasAtendidas();
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
        style={[
          styles.container, 
          isLandscape && styles.containerLandscape,
          isTablet && styles.containerTablet
        ]}
      >
        <StatusBar backgroundColor="#ffb300" barStyle="light-content" />
        
        {/* Coluna esquerda: Cardápio */}
        <View style={[
          styles.col, 
          styles.colLeft,
          isLandscape && styles.colLeftLandscape,
          isTablet && styles.colLeftTablet
        ]}>
          <FlatList
            data={cardapio}
            keyExtractor={item => item.nome}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.menuButton,
                  {
                    padding: getPadding(14, 16, 18, 20),
                    marginBottom: getSpacing(10, 12, 14, 16),
                    borderRadius: getResponsiveSize(16, 18, 20, 22),
                  }
                ]}
                onPress={() => adicionarItem(item.nome)}
                activeOpacity={0.8}
              >
                <View style={styles.menuButtonContent}>
                  <Text style={[
                    styles.menuButtonTitle,
                    { fontSize: getFontSize(14, 15, 16, 17) }
                  ]}>
                    {item.nome}
                  </Text>
                  <View style={styles.menuButtonFooter}>
                    <Icon 
                      name="attach-money" 
                      size={getResponsiveSize(14, 16, 18, 20)} 
                      color="#fffde7" 
                    />
                    <Text style={[
                      styles.menuButtonValor,
                      { fontSize: getFontSize(12, 13, 14, 15) }
                    ]}>
                      {item.valor} Sementes
                    </Text>
                  </View>
                </View>
                <Icon 
                  name="add-circle" 
                  size={getResponsiveSize(20, 24, 26, 28)} 
                  color="#fff" 
                  style={styles.addIcon} 
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ 
              paddingBottom: getSpacing(12, 16, 18, 20), 
              paddingTop: getSpacing(6, 8, 10, 12) 
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Coluna direita: Selecionados */}
        <View style={[
          styles.col, 
          styles.colRight,
          isLandscape && styles.colRightLandscape,
          isTablet && styles.colRightTablet
        ]}>
          {/* Número da Comanda, Título e Total na mesma linha */}
          <View style={[
            styles.headerSection,
            isTablet && styles.headerSectionTablet
          ]}>
            {numeroComanda !== null && (
              <View style={[
                styles.comandaInfo,
                {
                  padding: getPadding(8, 10, 12, 14),
                  borderRadius: getResponsiveSize(10, 12, 14, 16),
                }
              ]}>
                <Icon 
                  name="confirmation-number" 
                  size={getResponsiveSize(16, 18, 20, 22)} 
                  color="#e53935" 
                />
                <Text style={[
                  styles.comandaNumero,
                  { fontSize: getFontSize(14, 16, 18, 20) }
                ]}>
                  Comanda Nº {numeroComanda}
                </Text>
              </View>
            )}
            
            {itens.length > 0 && (
              <View style={[
                styles.totalContainer,
                {
                  padding: getPadding(8, 10, 12, 14), 
                  borderRadius: getResponsiveSize(10, 12, 14, 16),
                }
              ]}>
                <Icon 
                  name="account-balance-wallet" 
                  size={getResponsiveSize(16, 18, 20, 22)} 
                  color="#4caf50" 
                />
                <Text style={[
                  styles.totalText,
                  { fontSize: getFontSize(14, 16, 18, 20) }
                ]}>
                  Total: {totalSementes} Sementes
                </Text>
              </View>
            )}
          </View>

          {/* Campo Nome do Cliente */}
          <View style={[
            styles.clienteSection,
            { marginBottom: getSpacing(12, 16, 18, 20) }
          ]}>
            <View style={[
              styles.clienteInputContainer,
              {
                paddingHorizontal: getPadding(10, 12, 14, 16),
                paddingVertical: getPadding(6, 8, 10, 12),
                borderRadius: getResponsiveSize(10, 12, 14, 16),
              }
            ]}>
              <Icon 
                name="person" 
                size={getResponsiveSize(18, 20, 22, 24)} 
                color="#666" 
                style={styles.clienteIcon} 
              />
              <TextInput
                style={[
                  styles.clienteInput,
                  { 
                    fontSize: getFontSize(14, 16, 18, 20),
                    paddingVertical: getPadding(6, 8, 10, 12),
                    fontFamily: FONTS.EATING_PASTA,
                  }
                ]}
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
                style={[
                  styles.itemRow,
                  {
                    padding: getPadding(12, 16, 18, 20),
                    borderRadius: getResponsiveSize(14, 16, 18, 20),
                    marginBottom: getSpacing(6, 8, 10, 12),
                  },
                  { opacity: fadeAnims[index] || 1 }
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[
                    styles.selectedItem,
                    { 
                      fontSize: getFontSize(13, 15, 16, 17),
                      marginBottom: getSpacing(2, 3, 4, 5),
                    }
                  ]}>
                    {item.nome}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Icon 
                      name="shopping-cart" 
                      size={getResponsiveSize(14, 16, 18, 20)} 
                      color="#666" 
                    />
                    <Text style={[
                      styles.itemQuantidade,
                      { fontSize: getFontSize(11, 13, 14, 15) }
                    ]}>
                      x{item.quantidade}
                    </Text>
                    <Text style={[
                      styles.itemValor,
                      { fontSize: getFontSize(11, 13, 14, 15) }
                    ]}>
                      {(() => {
                        const cardapioItem = cardapio.find(c => c.nome === item.nome);
                        return cardapioItem ? `${parseInt(cardapioItem.valor) * item.quantidade} Sementes` : '';
                      })()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    {
                      padding: getPadding(10, 12, 14, 16),
                      borderRadius: getResponsiveSize(10, 12, 14, 16),
                      marginLeft: getSpacing(10, 12, 14, 16),
                    }
                  ]}
                  onPress={() => removerItem(index)}
                  activeOpacity={0.8}
                >
                  <Icon 
                    name="remove" 
                    size={getResponsiveSize(18, 20, 22, 24)} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: getSpacing(6, 8, 10, 12) }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[
                styles.emptyState,
                { paddingVertical: getSpacing(20, 30, 35, 40) }
              ]}>
                <Icon 
                  name="receipt-long" 
                  size={getResponsiveSize(30, 40, 45, 50)} 
                  color="#ccc" 
                />
                <Text style={[
                  styles.emptyText,
                  { fontSize: getFontSize(14, 16, 18, 20) }
                ]}>
                  Nenhum item selecionado
                </Text>
                <Text style={[
                  styles.emptySubtext,
                  { fontSize: getFontSize(11, 13, 14, 15) }
                ]}>
                  Toque nos itens do cardápio para adicionar
                </Text>
              </View>
            }
          />

          {/* Botões de Ação */}
          <View style={[
            styles.actionButtons,
            { 
              marginTop: getSpacing(8, 10, 12, 14),
              gap: getSpacing(8, 10, 12, 14),
            }
          ]}>
            {itens.length > 0 && (
              <TouchableOpacity 
                style={[
                  styles.clearButton,
                  {
                    padding: getPadding(14, 16, 18, 20),
                    borderRadius: getResponsiveSize(12, 14, 16, 18),
                  }
                ]} 
                onPress={limparComanda}
                activeOpacity={0.8}
              >
                <Icon 
                  name="clear-all" 
                  size={getResponsiveSize(18, 20, 22, 24)} 
                  color="#fff" 
                />
                <Text style={[
                  styles.clearButtonText,
                  { fontSize: getFontSize(13, 15, 16, 17) }
                ]}>
                  Limpar
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.finishButton,
                {
                  padding: getPadding(14, 16, 18, 20),
                  borderRadius: getResponsiveSize(12, 14, 16, 18),
                },
                (itens.length === 0 || isEnviando) && styles.finishButtonDisabled
              ]} 
              onPress={fecharComanda}
              disabled={itens.length === 0 || isEnviando}
              activeOpacity={0.8}
            >
              {isEnviando ? (
                <>
                  <ActivityIndicator 
                    size="small" 
                    color="#ffffff" 
                    style={{ marginRight: getSpacing(6, 8, 10, 12) }} 
                  />
                  <Text style={[
                    styles.finishButtonText,
                    { fontSize: getFontSize(13, 15, 16, 17) }
                  ]}>
                    Enviando...
                  </Text>
                </>
              ) : (
                <>
                  <Icon 
                    name="restaurant" 
                    size={getResponsiveSize(18, 20, 22, 24)} 
                    color="#fff" 
                  />
                  <Text style={[
                    styles.finishButtonText,
                    { fontSize: getFontSize(13, 15, 16, 17) }
                  ]}>
                    Enviar Comanda
                  </Text>
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
  containerTablet: {
    paddingHorizontal: 16,
  },
  col: {
    flex: 1,
    padding: 12,
  },
  colLeft: {
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    maxWidth: 500,
  },
  colLeftLandscape: {
    maxWidth: 450,
  },
  colLeftTablet: {
    maxWidth: 1000,
    padding: 10,
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
    minWidth: 280,
  },
  colRightLandscape: {
    flex: 0.8,
    paddingLeft: 24,
    margin: 12,
  },
  colRightTablet: {
    paddingLeft: 28,
    margin: 16,
    borderRadius: 28,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
    justifyContent: 'space-between',
  },
  headerSectionTablet: {
    marginBottom: 16,
    gap: 16,
  },
  comandaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    gap: 6,
    borderWidth: 2,
    borderColor: '#fed7d7',
    shadowColor: '#fed7d7',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#fed7d7',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  comandaNumero: {
    fontWeight: 'bold',
    color: '#e53935',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    gap: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#4caf50',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  totalText: {
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
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clienteIcon: {
    marginRight: 8,
  },
  clienteInput: {
    flex: 1,
    color: '#333',
  },
  menuButton: {
    backgroundColor: '#ffb300',
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
    ...Platform.select({
      ios: {
        shadowColor: '#ffb300',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonTitle: {
    color: '#fff',
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
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ffb300',
  },
  itemInfo: {
    flex: 1,
  },
  selectedItem: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQuantidade: {
    color: '#666',
    fontWeight: '600',
  },
  itemValor: {
    color: '#4caf50',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#e53935',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#666',
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  finishButton: {
    flex: 2,
    backgroundColor: '#4caf50',
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
    fontWeight: 'bold',
  },
});
