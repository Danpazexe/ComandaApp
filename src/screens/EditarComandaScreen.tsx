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
                <Text style={styles.comandaText}>Comanda Nº {item.numero} - {item.data && item.data.substring(0, 10)}</Text>
                <Text style={styles.comandaTextItens}>{item.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonExcluir} onPress={() => excluirComanda(item)}>
                <Text style={styles.buttonExcluirText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
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
  
  comandaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ccc' },
  comandaText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  comandaTextItens: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonExcluir: { backgroundColor: '#e53935', padding: 8, borderRadius: 6, alignItems: 'center', marginLeft: 12 },
  buttonExcluirText: { color: '#fff', fontWeight: 'bold' },
  buttonZerar: { backgroundColor: '#e53935', padding: 22, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  buttonZerarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 