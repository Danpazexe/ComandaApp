import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARDAPIO_KEY = 'cardapio_dinamico';

const SABORES_INICIAIS = [
  { nome: 'CARNE DE SOL+QUEIJO', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
  { nome: '2 QUEIJOS', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
  { nome: 'FRANGO', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
  { nome: 'FRANGO+QUEIJO', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
  { nome: 'CHOCOLATE', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
  { nome: 'CARNE MOIDA', valor: '2 SEMENTES OU 4 SEMENTINHAS' },
];

export default function AdicionarSaborScreen() {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [sabores, setSabores] = useState<{ nome: string; valor: string }[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    async function inicializarSabores() {
      const data = await AsyncStorage.getItem(CARDAPIO_KEY);
      if (!data) {
        await AsyncStorage.setItem(CARDAPIO_KEY, JSON.stringify(SABORES_INICIAIS));
      }
      carregarSabores();
    }
    inicializarSabores();
  }, []);

  async function carregarSabores() {
    const data = await AsyncStorage.getItem(CARDAPIO_KEY);
    setSabores(data ? JSON.parse(data) : []);
  }

  async function adicionarOuEditarSabor() {
    if (!nome.trim() || !valor.trim()) {
      Alert.alert('Preencha todos os campos!');
      return;
    }
    const novoSabor = { nome: nome.trim().toUpperCase(), valor: valor.trim() };
    let cardapio = [...sabores];
    if (editIndex !== null) {
      cardapio[editIndex] = novoSabor;
    } else {
      cardapio.push(novoSabor);
    }
    await AsyncStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapio));
    setNome('');
    setValor('');
    setEditIndex(null);
    carregarSabores();
    Alert.alert(editIndex !== null ? 'Sabor editado!' : 'Sabor adicionado!');
  }

  function preencherParaEditar(index: number) {
    setNome(sabores[index].nome);
    setValor(sabores[index].valor);
    setEditIndex(index);
  }

  async function excluirSabor(index: number) {
    let cardapio = [...sabores];
    cardapio.splice(index, 1);
    await AsyncStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapio));
    carregarSabores();
    setEditIndex(null);
    setNome('');
    setValor('');
    Alert.alert('Sabor excluído!');
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#1976d2" barStyle="light-content" />
        <TextInput
          style={styles.input}
          placeholder="Nome do sabor"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (ex: 2 sementes)"
          value={valor}
          onChangeText={setValor}
        />
        <TouchableOpacity style={styles.button} onPress={adicionarOuEditarSabor}>
          <Text style={styles.buttonText}>{editIndex !== null ? 'Salvar Edição' : 'Adicionar'}</Text>
        </TouchableOpacity>
        <FlatList
          data={sabores}
          keyExtractor={(_, idx) => `sabor-${idx}`}
          style={{ width: '100%', marginTop: 24 }}
          renderItem={({ item, index }) => (
            <View style={styles.saborItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.saborNome}>{item.nome}</Text>
                <Text style={styles.saborValor}>{item.valor}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => preencherParaEditar(index)}>
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => excluirSabor(index)}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7', padding: 16 },
  input: { width: '78%', backgroundColor: '#fff', borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  button: { backgroundColor: '#4caf50', padding: 16, borderRadius: 8, alignItems: 'center', width: '45%' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  saborItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, marginHorizontal: 8, borderWidth: 1, borderColor: '#ccc' },
  saborNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  saborValor: { fontSize: 14, color: '#666' },
  editButton: { backgroundColor: '#2196f3', padding: 8, borderRadius: 6, marginLeft: 8 },
  editButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#f44336', padding: 8, borderRadius: 6, marginLeft: 8 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
}); 