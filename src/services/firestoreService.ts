import firestore from '@react-native-firebase/firestore';
import { Comanda, Item } from '../types/Comanda';

const COMANDA_COLLECTION = 'comandas';
const CARDAPIO_COLLECTION = 'cardapio';
const RELATORIO_COLLECTION = 'relatorio';
const CONFIG_COLLECTION = 'config';

export class FirestoreService {
  // Buscar a última comanda para garantir numeração sequencial
  static async buscarUltimaComanda(): Promise<Comanda | null> {
    try {
      const querySnapshot = await firestore()
        .collection(COMANDA_COLLECTION)
        .orderBy('numero', 'desc')
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data?.timestamp?.toDate() || new Date(),
          horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
        } as Comanda;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar última comanda:', error);
      throw error;
    }
  }

  // Gerar próximo número de comanda
  static async gerarProximoNumero(): Promise<number> {
    try {
      const ultimaComanda = await this.buscarUltimaComanda();
      return ultimaComanda ? ultimaComanda.numero + 1 : 1;
    } catch (error) {
      console.error('Erro ao gerar próximo número:', error);
      throw error;
    }
  }

  // Criar nova comanda
  static async criarComanda(numero: number, itens: Item[], totalSementes: number, nomeCliente?: string): Promise<string> {
    try {
      const comanda: Omit<Comanda, 'id'> = {
        numero,
        nomeCliente,
        itens,
        status: 'aberta',
        timestamp: new Date(),
        totalSementes,
      };

      const docRef = await firestore()
        .collection(COMANDA_COLLECTION)
        .add(comanda);

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      throw error;
    }
  }

  // Atualizar status da comanda
  static async atualizarStatus(comandaId: string, status: 'aberta' | 'preparando' | 'pronto' | 'chamado' | 'entregue'): Promise<void> {
    try {
      const updateData: any = {
        status,
        timestamp: new Date(),
      };

      // Se está mudando para 'preparando', registrar a hora de atendimento
      if (status === 'preparando') {
        updateData.horaAtendimento = new Date();
      }

      await firestore()
        .collection(COMANDA_COLLECTION)
        .doc(comandaId)
        .update(updateData);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Atualizar comanda existente
  static async atualizarComanda(comandaId: string, itens: Item[], totalSementes: number, nomeCliente?: string): Promise<void> {
    try {
      await firestore()
        .collection(COMANDA_COLLECTION)
        .doc(comandaId)
        .update({
          itens,
          totalSementes,
          nomeCliente,
          timestamp: new Date(),
        });
    } catch (error) {
      console.error('Erro ao atualizar comanda:', error);
      throw error;
    }
  }

  // Buscar comanda por ID
  static async buscarComandaPorId(comandaId: string): Promise<Comanda | null> {
    try {
      const doc = await firestore()
        .collection(COMANDA_COLLECTION)
        .doc(comandaId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data?.timestamp?.toDate() || new Date(),
          horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
        } as Comanda;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar comanda:', error);
      throw error;
    }
  }

  // Buscar comanda por número
  static async buscarComandaPorNumero(numero: number): Promise<Comanda | null> {
    try {
      const querySnapshot = await firestore()
        .collection(COMANDA_COLLECTION)
        .where('numero', '==', numero)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data?.timestamp?.toDate() || new Date(),
          horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
        } as Comanda;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar comanda por número:', error);
      throw error;
    }
  }

  // Listener para comandas em tempo real (para cozinha) - ordenadas por chegada
  static onComandasAtivas(callback: (comandas: Comanda[]) => void) {
    return firestore()
      .collection(COMANDA_COLLECTION)
      .where('status', 'in', ['aberta', 'preparando'])
      .orderBy('timestamp', 'asc') // Ordenar por chegada (mais antiga primeiro)
      .onSnapshot(
        (querySnapshot) => {
          const comandas: Comanda[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            comandas.push({
              id: doc.id,
              ...data,
              timestamp: data?.timestamp?.toDate() || new Date(),
              horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
            } as Comanda);
          });
          callback(comandas);
        },
        (error) => {
          console.error('Erro no listener de comandas:', error);
        }
      );
  }

  // Listener para comandas por status específico
  static onComandasPorStatus(status: 'aberta' | 'preparando' | 'pronto' | 'chamado' | 'entregue', callback: (comandas: Comanda[]) => void) {
    return firestore()
      .collection(COMANDA_COLLECTION)
      .where('status', '==', status)
      .orderBy('timestamp', 'asc') // Ordenar por chegada
      .onSnapshot(
        (querySnapshot) => {
          const comandas: Comanda[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            comandas.push({
              id: doc.id,
              ...data,
              timestamp: data?.timestamp?.toDate() || new Date(),
              horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
            } as Comanda);
          });
          callback(comandas);
        },
        (error) => {
          console.error('Erro no listener de comandas por status:', error);
        }
      );
  }

  // Deletar comanda
  static async deletarComanda(comandaId: string): Promise<void> {
    try {
      await firestore()
        .collection(COMANDA_COLLECTION)
        .doc(comandaId)
        .delete();
    } catch (error) {
      console.error('Erro ao deletar comanda:', error);
      throw error;
    }
  }

  // Zerar todas as comandas (deletar em massa)
  static async zerarTodasComandas(): Promise<void> {
    try {
      console.log('🚀 Iniciando processo de zerar todas as comandas...');
      
      // Buscar todas as comandas
      console.log('📋 Buscando comandas na coleção:', COMANDA_COLLECTION);
      
      const querySnapshot = await firestore()
        .collection(COMANDA_COLLECTION)
        .get();

      console.log(`📊 Encontradas ${querySnapshot.docs.length} comandas para deletar`);

      if (querySnapshot.docs.length === 0) {
        console.log('✅ Nenhuma comanda encontrada para deletar');
        return;
      }

      // Mostrar detalhes das comandas encontradas
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📝 Comanda ${index + 1}: ID=${doc.id}, Número=${data.numero}, Status=${data.status}`);
      });

      // Deletar usando batch (mais eficiente)
      console.log('🗑️ Iniciando deleção em lote...');
      
      const batch = firestore().batch();
      querySnapshot.docs.forEach((doc) => {
        console.log(`🗑️ Adicionando comanda ${doc.id} ao batch`);
        batch.delete(doc.ref);
      });

      console.log('⚡ Executando batch...');
      await batch.commit();
      
      console.log('✅ Todas as comandas foram deletadas com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao zerar todas as comandas:', error);
      
      // Se o batch falhar, tentar deletar uma por uma
      if (error instanceof Error && error.message.includes('batch')) {
        console.log('🔄 Tentando deleção individual...');
        try {
          const querySnapshot = await firestore()
            .collection(COMANDA_COLLECTION)
            .get();

          for (const doc of querySnapshot.docs) {
            try {
              await doc.ref.delete();
              console.log(`✅ Comanda ${doc.id} deletada individualmente`);
            } catch (docError) {
              console.error(`❌ Erro ao deletar comanda ${doc.id}:`, docError);
            }
          }
          console.log('✅ Deleção individual concluída');
          return;
        } catch (individualError) {
          console.error('❌ Erro na deleção individual também:', individualError);
        }
      }
      
      throw error;
    }
  }

  // Buscar todas as comandas (para histórico)
  static async buscarTodasComandas(): Promise<Comanda[]> {
    try {
      const querySnapshot = await firestore()
        .collection(COMANDA_COLLECTION)
        .orderBy('timestamp', 'desc')
        .get();

      const comandas: Comanda[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comandas.push({
          id: doc.id,
          ...data,
          timestamp: data?.timestamp?.toDate() || new Date(),
          horaAtendimento: data?.horaAtendimento?.toDate() || undefined,
        } as Comanda);
      });

      return comandas;
    } catch (error) {
      console.error('Erro ao buscar todas as comandas:', error);
      throw error;
    }
  }

  // ============ CARDÁPIO ============
  
  // Buscar cardápio
  static async buscarCardapio(): Promise<{nome: string, valor: string}[]> {
    try {
      const querySnapshot = await firestore()
        .collection(CARDAPIO_COLLECTION)
        .orderBy('nome', 'asc')
        .get();

      const cardapio: {nome: string, valor: string}[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cardapio.push({
          nome: data.nome,
          valor: data.valor
        });
      });

      return cardapio;
    } catch (error) {
      console.error('Erro ao buscar cardápio:', error);
      throw error;
    }
  }

  // Salvar item do cardápio
  static async salvarItemCardapio(nome: string, valor: string): Promise<void> {
    try {
      // Verificar se já existe um item com mesmo nome
      const existingQuery = await firestore()
        .collection(CARDAPIO_COLLECTION)
        .where('nome', '==', nome)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        // Atualizar item existente
        const docId = existingQuery.docs[0].id;
        await firestore()
          .collection(CARDAPIO_COLLECTION)
          .doc(docId)
          .update({ valor });
      } else {
        // Criar novo item
        await firestore()
          .collection(CARDAPIO_COLLECTION)
          .add({ nome, valor });
      }
    } catch (error) {
      console.error('Erro ao salvar item do cardápio:', error);
      throw error;
    }
  }

  // Excluir item do cardápio
  static async excluirItemCardapio(nome: string): Promise<void> {
    try {
      const querySnapshot = await firestore()
        .collection(CARDAPIO_COLLECTION)
        .where('nome', '==', nome)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.delete();
      }
    } catch (error) {
      console.error('Erro ao excluir item do cardápio:', error);
      throw error;
    }
  }

  // Inicializar cardápio com itens padrão
  static async inicializarCardapio(): Promise<void> {
    try {
      const cardapioExistente = await this.buscarCardapio();
      
      if (cardapioExistente.length === 0) {
        const saboresIniciais = [
          { nome: 'CARNE DE SOL+QUEIJO', valor: '2' },
          { nome: '2 QUEIJOS', valor: '2' },
          { nome: 'FRANGO', valor: '2' },
          { nome: 'FRANGO+QUEIJO', valor: '2' },
          { nome: 'CHOCOLATE', valor: '2' },
          { nome: 'CARNE MOIDA', valor: '2' },
        ];

        const batch = firestore().batch();
        saboresIniciais.forEach(sabor => {
          const docRef = firestore().collection(CARDAPIO_COLLECTION).doc();
          batch.set(docRef, sabor);
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Erro ao inicializar cardápio:', error);
      throw error;
    }
  }

  // ============ RELATÓRIO ============
  
  // Buscar relatório de vendas
  static async buscarRelatorioVendas(): Promise<Record<string, number>> {
    try {
      const doc = await firestore()
        .collection(RELATORIO_COLLECTION)
        .doc('vendas')
        .get();

      if (doc.exists) {
        const data = doc.data();
        return data?.vendas || {};
      }
      return {};
    } catch (error) {
      console.error('Erro ao buscar relatório de vendas:', error);
      throw error;
    }
  }

  // Registrar vendas no relatório
  static async registrarVendas(itens: string[]): Promise<void> {
    try {
      const relatorioRef = firestore()
        .collection(RELATORIO_COLLECTION)
        .doc('vendas');

      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(relatorioRef);
        const vendas = doc.exists ? doc.data()?.vendas || {} : {};

        // Contar os itens vendidos
        itens.forEach(item => {
          vendas[item] = (vendas[item] || 0) + 1;
        });

        transaction.set(relatorioRef, { vendas }, { merge: true });
      });
    } catch (error) {
      console.error('Erro ao registrar vendas:', error);
      throw error;
    }
  }

  // Limpar relatório de vendas
  static async limparRelatorioVendas(): Promise<void> {
    try {
      await firestore()
        .collection(RELATORIO_COLLECTION)
        .doc('vendas')
        .set({ vendas: {} });
    } catch (error) {
      console.error('Erro ao limpar relatório:', error);
      throw error;
    }
  }

  // ============ CONFIGURAÇÕES ============
  
  // Buscar número de comandas atendidas
  static async buscarComandasAtendidas(): Promise<number> {
    try {
      const doc = await firestore()
        .collection(CONFIG_COLLECTION)
        .doc('contadores')
        .get();

      if (doc.exists) {
        const data = doc.data();
        return data?.comandasAtendidas || 0;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao buscar comandas atendidas:', error);
      throw error;
    }
  }

  // Incrementar contador de comandas atendidas
  static async incrementarComandasAtendidas(): Promise<void> {
    try {
      const configRef = firestore()
        .collection(CONFIG_COLLECTION)
        .doc('contadores');

      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(configRef);
        const comandasAtendidas = doc.exists ? doc.data()?.comandasAtendidas || 0 : 0;
        
        transaction.set(configRef, { 
          comandasAtendidas: comandasAtendidas + 1 
        }, { merge: true });
      });
    } catch (error) {
      console.error('Erro ao incrementar comandas atendidas:', error);
      throw error;
    }
  }

  // Decrementar contador de comandas atendidas
  static async decrementarComandasAtendidas(): Promise<void> {
    try {
      const configRef = firestore()
        .collection(CONFIG_COLLECTION)
        .doc('contadores');

      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(configRef);
        const comandasAtendidas = doc.exists ? doc.data()?.comandasAtendidas || 0 : 0;
        
        transaction.set(configRef, { 
          comandasAtendidas: Math.max(0, comandasAtendidas - 1) 
        }, { merge: true });
      });
    } catch (error) {
      console.error('Erro ao decrementar comandas atendidas:', error);
      throw error;
    }
  }

  // Zerar contadores
  static async zerarContadores(): Promise<void> {
    try {
      await firestore()
        .collection(CONFIG_COLLECTION)
        .doc('contadores')
        .set({ comandasAtendidas: 0 });
    } catch (error) {
      console.error('Erro ao zerar contadores:', error);
      throw error;
    }
  }

  // ============ FUNÇÕES GLOBAIS ============
  
  // Zerar tudo (comandas, relatório e contadores)
  static async zerarTudo(): Promise<void> {
    try {
      console.log('🚀 Iniciando processo de zerar tudo...');
      
      // Executar operações em paralelo para melhor performance
      await Promise.all([
        this.zerarTodasComandas(),
        this.limparRelatorioVendas(),
        this.zerarContadores()
      ]);
      
      console.log('✅ Processo de zerar tudo concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao zerar tudo:', error);
      throw error;
    }
  }

  // Função auxiliar para calcular vendas baseado nas comandas
  static async calcularVendasDasComandas(): Promise<Record<string, number>> {
    try {
      const comandas = await this.buscarTodasComandas();
      const vendas: Record<string, number> = {};
      
      comandas.forEach(comanda => {
        comanda.itens.forEach(item => {
          vendas[item.nome] = (vendas[item.nome] || 0) + item.quantidade;
        });
      });
      
      return vendas;
    } catch (error) {
      console.error('Erro ao calcular vendas das comandas:', error);
      return {};
    }
  }
}
