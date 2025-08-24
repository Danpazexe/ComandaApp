import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SaborModal from './components/SaborModal';
import ConfirmModal from './components/ConfirmModal';
import { FirestoreService } from '../../services/firestoreService';

export default function GerenciarScreen() {
  const [sabores, setSabores] = useState<{ nome: string; valor: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<{ nome: string; valor: string } | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [saborParaExcluir, setSaborParaExcluir] = useState<{ nome: string; index: number } | null>(null);

  useEffect(() => {
    async function inicializarSabores() {
      try {
        // Inicializar cardápio se necessário
        await FirestoreService.inicializarCardapio();
        
        // Carregar sabores do Firebase
        await carregarSabores();
      } catch (error) {
        console.error('Erro ao inicializar sabores:', error);
        setSabores([]);
      }
    }
    inicializarSabores();
  }, []);

  async function carregarSabores() {
    try {
      const saboresFirebase = await FirestoreService.buscarCardapio();
      setSabores(saboresFirebase);
    } catch (error) {
      console.error('Erro ao carregar sabores:', error);
      setSabores([]);
    }
  }

  async function handleSaveSabor(nome: string, valor: string) {
    try {
      // Salvar no Firebase
      await FirestoreService.salvarItemCardapio(nome, valor);
      
      // Recarregar sabores
      await carregarSabores();
      
      setModalVisible(false);
      setEditData(null);
    } catch (error) {
      console.error('Erro ao salvar sabor:', error);
      // Você pode adicionar um Alert aqui se quiser notificar o usuário
    }
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
    
    try {
      // Excluir do Firebase
      await FirestoreService.excluirItemCardapio(saborParaExcluir.nome);
      
      // Recarregar sabores
      await carregarSabores();
      
      setSaborParaExcluir(null);
      setConfirmModalVisible(false);
    } catch (error) {
      console.error('Erro ao excluir sabor:', error);
      // Você pode adicionar um Alert aqui se quiser notificar o usuário
    }
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
