import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SaborModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (nome: string, valor: string) => void;
  editData?: { nome: string; valor: string } | null;
}

export default function SaborModal({ visible, onClose, onSave, editData }: SaborModalProps) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setValor(editData.valor);
    } else {
      setNome('');
      setValor('');
    }
  }, [editData, visible]);

  async function handleSave() {
    if (!nome.trim() || !valor.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos antes de continuar.');
      return;
    }
    
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Valor Inválido', 'A quantidade deve ser um número maior que zero.');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave(nome.trim().toUpperCase(), valorNumerico.toString());
      // Sucesso - modal será fechado pela função onSave
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o sabor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    if (isLoading) return; // Não permite fechar durante o salvamento
    
    setNome('');
    setValor('');
    onClose();
  }

  const isEditing = !!editData;
  const canSave = nome.trim() && valor.trim() && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          onPress={handleClose}
          activeOpacity={1}
        />
        <View style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={[styles.modalHeader, { backgroundColor: isEditing ? '#ff9800' : '#4caf50' }]}>
            <View style={styles.headerContent}>
              <Icon 
                name={isEditing ? 'edit' : 'add-circle'} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Sabor' : 'Novo Sabor'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeButton}
              disabled={isLoading}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Sabor</Text>
              <TextInput
                style={[styles.input, nome.trim() && styles.inputFilled]}
                placeholder="Ex: CARNE DE SOL+QUEIJO"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="characters"
                editable={!isLoading}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade de Sementes</Text>
              <TextInput
                style={[styles.input, valor.trim() && styles.inputFilled]}
                placeholder="Ex: 2"
                value={valor}
                onChangeText={setValor}
                keyboardType="numeric"
                editable={!isLoading}
                maxLength={3}
              />
            </View>
            
            {/* Botões */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.cancelButton, isLoading && styles.buttonDisabled]} 
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  isEditing && styles.editButton,
                  !canSave && styles.buttonDisabled
                ]}
                onPress={handleSave}
                disabled={!canSave || isLoading}
              >
                                {isLoading ? (
                  <Text style={styles.saveButtonText}>Salvando...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Salvar' : 'Adicionar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
    
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputFilled: {
    borderColor: '#4caf50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ff9800',
    
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  buttonDisabled: {
    opacity: 0.7,
  },
});
