import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SaborModal from '../components/SaborModal';
import ConfirmModal from '../components/ConfirmModal';

const CARDAPIO_KEY = 'cardapio_dinamico';

const SABORES_INICIAIS = [
  { nome: 'CARNE DE SOL+QUEIJO', valor: '2' },
  { nome: '2 QUEIJOS', valor: '2' },
  { nome: 'FRANGO', valor: '2' },
  { nome: 'FRANGO+QUEIJO', valor: '2' },
  { nome: 'CHOCOLATE', valor: '2' },
  { nome: 'CARNE MOIDA', valor: '2' },
];

export default function AdicionarSaborScreen() {
  const [sabores, setSabores] = useState<{ nome: string; valor: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<{ nome: string; valor: string } | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [saborParaExcluir, setSaborParaExcluir] = useState<{ nome: string; index: number } | null>(null);

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
    if (data) {
      setSabores(JSON.parse(data));
    } else {
      setSabores([]);
    }
  }

  async function handleSaveSabor(nome: string, valor: string) {
    const novoSabor = { nome, valor };
    let cardapio = [...sabores];

    if (editData) {
      // Editando sabor existente
      const index = cardapio.findIndex(s => s.nome === editData.nome);
      if (index !== -1) {
        cardapio[index] = novoSabor;
      }
    } else {
      // Adicionando novo sabor
      cardapio.push(novoSabor);
    }

    await AsyncStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapio));
    carregarSabores();
  }

  function handleEditSabor(sabor: { nome: string; valor: string }) {
    setEditData(sabor);
    setModalVisible(true);
  }

  function handleAddSabor() {
    setEditData(null);
    setModalVisible(true);
  }

  function solicitarExclusao(sabor: { nome: string; valor: string }, index: number) {
    setSaborParaExcluir({ nome: sabor.nome, index });
    setConfirmModalVisible(true);
  }

  async function confirmarExclusao() {
    if (!saborParaExcluir) return;
    
    let cardapio = [...sabores];
    cardapio.splice(saborParaExcluir.index, 1);
    await AsyncStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapio));
    carregarSabores();
    
    setSaborParaExcluir(null);
    setConfirmModalVisible(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar backgroundColor="#1976d2" barStyle="light-content" />


      {/* Botão Adicionar */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSabor}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar Novo Sabor</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={sabores}
        keyExtractor={(_, idx) => `sabor-${idx}`}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saborNome}>{item.nome}</Text>
              <Text style={styles.saborValor}>{item.valor} Sementes</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
              onPress={() => handleEditSabor(item)}
            >
              <Icon name="edit" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#f44336' }]}
              onPress={() => solicitarExclusao(item, index)}
            >
              <Icon name="delete" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal de Sabor */}
      <SaborModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSabor}
        editData={editData}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmarExclusao}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o sabor "${saborParaExcluir?.nome}"?\n\nEsta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  saborNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  saborValor: {
    fontSize: 14,
    color: '#666'
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8
  }
});
