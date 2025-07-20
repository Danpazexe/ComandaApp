import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, ToastAndroid, StatusBar, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { registrarVenda } from './RelatorioScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

const CARDAPIO_KEY = 'cardapio_dinamico';
const COMANDA_NUM_KEY = 'comanda_numero_atual';
const COMANDAS_ATENDIDAS_KEY = 'comandas_atendidas';

type Props = NativeStackScreenProps<any, 'Comanda'>;

export default function ComandaScreen({ navigation }: Props) {
  // Trocar de string[] para array de objetos com nome e quantidade
  const [itens, setItens] = useState<{ nome: string, quantidade: number }[]>([]);
  const [cardapio, setCardapio] = useState<{ nome: string, valor: string }[]>([]);
  const [fadeAnims, setFadeAnims] = useState<Animated.Value[]>([]);
  const [numeroComanda, setNumeroComanda] = useState<number | null>(null);
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
    async function buscarNumeroComanda() {
      let numAtual = await AsyncStorage.getItem(COMANDA_NUM_KEY);
      let numero = numAtual ? parseInt(numAtual, 10) : 1;
      setNumeroComanda(numero);
    }
    if (isFocused) buscarNumeroComanda();
  }, [isFocused]);

  React.useEffect(() => {
    setFadeAnims(itens.map(() => new Animated.Value(1)));
  }, [itens.length]);

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
        novos[index] = { ...novos[index], quantidade: novos[index].quantidade - 1 };
        return novos;
      } else {
        novos.splice(index, 1);
        return novos;
      }
    });
  }

  async function fecharComanda() {
    if (itens.length === 0) return;
    // Adaptar para enviar array de nomes repetidos conforme quantidade
    const itensParaRegistrar: string[] = [];
    itens.forEach(i => {
      for (let j = 0; j < i.quantidade; j++) itensParaRegistrar.push(i.nome);
    });
    registrarVenda(itensParaRegistrar);
    ToastAndroid.show('Comanda finalizada!', ToastAndroid.SHORT);
    setItens([]);
    // Incrementa e salva o número da comanda somente ao finalizar
    if (numeroComanda !== null) {
      const proximoNumero = numeroComanda + 1;
      await AsyncStorage.setItem(COMANDA_NUM_KEY, proximoNumero.toString());
    }
    // Incrementa o contador de comandas atendidas
    let atendidas = await AsyncStorage.getItem(COMANDAS_ATENDIDAS_KEY);
    let total = atendidas ? parseInt(atendidas, 10) + 1 : 1;
    await AsyncStorage.setItem(COMANDAS_ATENDIDAS_KEY, total.toString());
    navigation.popToTop();
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        <StatusBar backgroundColor="#ffb300" barStyle="light-content" />
        {/* Coluna esquerda: Cardápio */}
        <View style={[styles.col, isLandscape && styles.colLeft]}>
          <Text style={styles.title}>Cardápio</Text>
          <FlatList
            data={cardapio}
            keyExtractor={(item) => item.nome}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.menuButton} onPress={() => adicionarItem(item.nome)}>
                <Text style={styles.menuButtonTitle}>{item.nome}</Text>
                <Text style={styles.menuButtonValor}>{item.valor}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </View>
        {/* Coluna direita: Selecionados */}
        <View style={[styles.col, isLandscape && styles.colRight]}>
          <Text style={styles.title}>Selecionados</Text>
          {numeroComanda !== null && (
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#e53935', marginBottom: 8 }}>Comanda Nº {numeroComanda}</Text>
          )}
          <FlatList
            data={itens}
            keyExtractor={(_, index) => `item-${index}`}
            renderItem={({ item, index }) => (
              <Animated.View style={[styles.itemRow, { opacity: fadeAnims[index] || 1 }]}>
                <Text style={styles.selectedItem}>{item.nome}  x {item.quantidade}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removerItem(index)}>
                  <Text style={styles.removeButtonText}>Remover</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
          <TouchableOpacity style={styles.finishButton} onPress={fecharComanda}>
            <Text style={styles.finishButtonText}>Fechar Comanda</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  containerLandscape: { flexDirection: 'row' },
  col: { flex: 1, padding: 16 },
  colLeft: { borderRightWidth: 1, borderRightColor: '#eee', maxWidth: 400 },
  colRight: { flex: 2, paddingLeft: 32 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  menuButton: { backgroundColor: '#ffb300', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  menuButtonTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  menuButtonValor: { color: '#fffde7', fontSize: 13, marginTop: 2, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: '#fff', borderRadius: 7, elevation: 1, marginBottom: 2 },
  selectedItem: { fontSize: 15,fontWeight: 'bold', color: '#444' },
  removeButton: { backgroundColor: '#e53935', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 6 },
  removeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  finishButton: { backgroundColor: '#e53935', padding: 22, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 