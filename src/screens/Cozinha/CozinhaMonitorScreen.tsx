import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Comanda } from '../../types/Comanda';
import { FirestoreService } from '../../services/firestoreService';

type Props = NativeStackScreenProps<any, 'CozinhaMonitor'>;
type TabType = 'preparar' | 'preparando' | 'pronto' | 'entregue';

export default function CozinhaMonitorScreen({}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('preparar');
  const [comandasPreparar, setComandasPreparar] = useState<Comanda[]>([]);
  const [comandasPreparando, setComandasPreparando] = useState<Comanda[]>([]);
  const [comandasProntas, setComandasProntas] = useState<Comanda[]>([]);
  const [comandasEntregues, setComandasEntregues] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  useEffect(() => {
    const unsubscribePreparar = FirestoreService.onComandasPorStatus('aberta', (comandas) => {
      setComandasPreparar(comandas);
      setLoading(false);
    });
    const unsubscribePreparando = FirestoreService.onComandasPorStatus('preparando', (comandas) => {
      setComandasPreparando(comandas);
    });
    const unsubscribeProntas = FirestoreService.onComandasPorStatus('pronto', (comandas) => {
      setComandasProntas(comandas);
    });
    const unsubscribeEntregues = FirestoreService.onComandasPorStatus('entregue', (comandas) => {
      setComandasEntregues(comandas);
    });
    return () => {
      unsubscribePreparar();
      unsubscribePreparando();
      unsubscribeProntas();
      unsubscribeEntregues();
    };
  }, []);

  const handleStatusChange = async (comandaId: string, novoStatus: 'preparando' | 'pronto' | 'entregue') => {
    try {
      await FirestoreService.atualizarStatus(comandaId, novoStatus);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status da comanda');
    }
  };

  const formatarTimestamp = (timestamp: Date) =>
    timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const renderComanda = ({ item }: { item: Comanda }) => {
    let cardColor = '#fff';
    let chipColor = '#999';
    let statusText = '';

    if (item.status === 'aberta') {
      cardColor = '#fff4f0';
      chipColor = '#ff6b35';
      statusText = '🆕 Em Espera';
    } else if (item.status === 'preparando') {
      cardColor = '#fff7ed';
      chipColor = '#ff6b35';
      statusText = '👨‍🍳 Preparando';
    } else if (item.status === 'pronto') {
      cardColor = '#e8fce8';
      chipColor = '#4caf50';
      statusText = '✅ Pronto';
    } else {
      cardColor = '#f0f0f0';
      chipColor = '#666';
      statusText = '📦 Entregue';
    }

    return (
      <View style={[styles.comandaCard, { backgroundColor: cardColor }]}>
        <View style={styles.comandaHeader}>
          <Text style={styles.numeroComanda}>#{item.numero}</Text>
          <View style={[styles.statusChip, { backgroundColor: chipColor }]}>
            <Text style={styles.statusChipText}>{statusText}</Text>
          </View>
        </View>

        {item.nomeCliente && <Text style={styles.nomeCliente}>{item.nomeCliente}</Text>}
        <Text style={styles.timestamp}>
          Criada: {formatarTimestamp(item.timestamp)}
        </Text>

        {item.horaAtendimento && (
          <Text style={styles.horaAtendimento}>
            Atendida: {formatarTimestamp(item.horaAtendimento)}
          </Text>
        )}

        <View style={styles.itensContainer}>
          {item.itens.map((i, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemNome}>{i.nome}</Text>
              <View style={styles.quantidadeContainer}>
                <Text style={styles.quantidadeText}>x{i.quantidade}</Text>
              </View>
            </View>
          ))}
        </View>

        {item.totalSementes && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: {item.totalSementes} sementes</Text>
          </View>
        )}

        <View style={styles.botoesContainer}>
          {item.status === 'aberta' && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoPreparar]}
              onPress={() => handleStatusChange(item.id!, 'preparando')}
            >
              <Icon name="restaurant" size={22} color="#fff" />
              <Text style={styles.botaoText}>Preparar</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparando' && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoPronto]}
              onPress={() => handleStatusChange(item.id!, 'pronto')}
            >
              <Icon name="check" size={22} color="#fff" />
              <Text style={styles.botaoText}>Pronto</Text>
            </TouchableOpacity>
          )}
          {item.status === 'pronto' && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoEntregue]}
              onPress={() => handleStatusChange(item.id!, 'entregue')}
            >
              <Icon name="local-shipping" size={22} color="#fff" />
              <Text style={styles.botaoText}>Entregue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTab = () => {
    const tabsMap = {
      preparar: comandasPreparar,
      preparando: comandasPreparando,
      pronto: comandasProntas,
      entregue: comandasEntregues,
    } as const;

    const emptyMessages = {
      preparar: ['Nenhum pedido em espera', 'Aguardando novos pedidos...'],
      preparando: ['Nenhum pedido em preparo', 'Aguardando cozinha...'],
      pronto: ['Nenhum pedido pronto', 'Eles aparecerão aqui'],
      entregue: ['Nenhum pedido entregue', 'Histórico de entregas'],
    } as const;

    const comandas = tabsMap[activeTab];
    const [emptyText, emptySubtext] = emptyMessages[activeTab];

    if (!comandas.length) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            name={activeTab === 'preparar' ? 'add-circle-outline' : activeTab === 'preparando' ? 'restaurant-menu' : activeTab === 'pronto' ? 'check-circle-outline' : 'local-shipping'}
            size={80}
            color="#ccc"
          />
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Text style={styles.emptySubtext}>{emptySubtext}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={comandas}
        renderItem={renderComanda}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        horizontal
        snapToInterval={isTablet ? 420 : 340}
        decelerationRate="fast"
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Carregando comandas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ff6b35" barStyle="light-content" />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['preparar', 'preparando', 'pronto', 'entregue'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Icon
              name={tab === 'preparar' ? 'add-circle' : tab === 'preparando' ? 'restaurant' : tab === 'pronto' ? 'check-circle' : 'local-shipping'}
              size={20}
              color={activeTab === tab ? '#fff' : '#666'}
            />
                         <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
               {tab === 'preparar'
                 ? `Em Espera (${comandasPreparar.length})`
                 : tab === 'preparando'
                 ? `Preparando (${comandasPreparando.length})`
                 : tab === 'pronto'
                 ? `Pronto (${comandasProntas.length})`
                 : `Entregue (${comandasEntregues.length})`}
             </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 8, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, marginHorizontal: 4, gap: 6 },
  activeTab: { backgroundColor: '#ff6b35' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#fff' },

  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 6 },

  comandaCard: { borderRadius: 20, padding: 18, marginRight: 16, width: 340, minHeight: 380, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  comandaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numeroComanda: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusChipText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  nomeCliente: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 6 },
  timestamp: { fontSize: 14, color: '#666', marginTop: 4 },
  horaAtendimento: { fontSize: 13, color: '#ff6b35', marginTop: 2, fontWeight: '600' },
  itensContainer: { marginVertical: 14, flex: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemNome: { fontSize: 16, color: '#333', flex: 1 },
  quantidadeContainer: { backgroundColor: '#ff6b35', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  quantidadeText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  totalContainer: { backgroundColor: '#fafafa', padding: 10, borderRadius: 8, marginBottom: 14 },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  botoesContainer: { marginTop: 10 },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  botaoPreparar: { backgroundColor: '#ff6b35' },
  botaoPronto: { backgroundColor: '#4caf50' },
  botaoEntregue: { backgroundColor: '#666' },
  botaoText: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginLeft: 6 },
});
