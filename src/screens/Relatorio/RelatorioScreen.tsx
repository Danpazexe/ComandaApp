import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirestoreService } from '../../services/firestoreService';

export default function RelatorioScreen() {
  const [vendas, setVendas] = useState<Record<string, number>>({});
  const [cardapio, setCardapio] = useState<{ nome: string, valor: string }[]>([]);
  const [comandasAtendidas, setComandasAtendidas] = useState<number>(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function carregarDados() {
      try {
        // Carregar dados do Firebase
        const [relatorioVendas, cardapioFirebase, totalComandas] = await Promise.all([
          FirestoreService.buscarRelatorioVendas(),
          FirestoreService.buscarCardapio(),
          FirestoreService.buscarComandasAtendidas()
        ]);

        setVendas(relatorioVendas);
        setCardapio(cardapioFirebase);
        setComandasAtendidas(totalComandas);
      } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error);
        setVendas({});
        setCardapio([]);
        setComandasAtendidas(0);
      }
    }
    
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  async function limparRelatorio() {
    Alert.alert(
      'Limpar Relatório', 
      'Tem certeza que deseja zerar o relatório?', 
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await FirestoreService.limparRelatorioVendas();
              setVendas({});
            } catch (error) {
              console.error('Erro ao limpar relatório:', error);
              Alert.alert('Erro', 'Não foi possível limpar o relatório.');
            }
          }
        }
      ]
    );
  }

  // Combinar vendas com dados do cardápio
  const dados = Object.entries(vendas).map(([item, quantidade]) => {
    const sabor = cardapio.find(s => s.nome === item);
    const valorUnitario = sabor ? parseInt(sabor.valor) : 0;
    const valorTotal = quantidade * valorUnitario;
    
    return {
      nome: item,
      quantidade,
      valorUnitario,
      valorTotal,
    };
  }).filter(item => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade); // Ordenar por quantidade (maior primeiro)

  const totalSementes = dados.reduce((acc, item) => acc + item.valorTotal, 0);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#4caf50" barStyle="light-content" />

        {/* Cabeçalho com Resumo */}
        <View style={styles.header}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Comandas Atendidas</Text>
            <Text style={styles.statValue}>{comandasAtendidas}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total de Sementes</Text>
            <Text style={styles.statValue}>{totalSementes}</Text>
          </View>
        </View>

        {/* Lista de Vendas */}
        <FlatList
          data={dados}
          keyExtractor={item => item.nome}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <View style={styles.quantidadeBadge}>
                  <Text style={styles.quantidadeText}>{item.quantidade}x</Text>
                </View>
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.valorUnitario}>
                  {item.valorUnitario} sementes cada
                </Text>
                <Text style={styles.valorTotal}>
                  Total: {item.valorTotal} sementes
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📊</Text>
              <Text style={styles.emptyTitle}>Nenhuma venda registrada</Text>
              <Text style={styles.emptySubtitle}>
                As vendas aparecerão aqui quando você fechar comandas
              </Text>
            </View>
          }
        />

        {/* Botão Limpar */}
        {dados.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={limparRelatorio}>
            <Text style={styles.clearButtonText}>🗑️ Limpar Relatório</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  quantidadeBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  quantidadeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valorUnitario: {
    fontSize: 12,
    color: '#666',
  },
  valorTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    backgroundColor: '#f44336',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});