import firestore from '@react-native-firebase/firestore';
import { Comanda, Item } from '../types/Comanda';

const COMANDA_COLLECTION = 'comandas';

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
  static async atualizarStatus(comandaId: string, status: 'aberta' | 'preparando' | 'entregue'): Promise<void> {
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
        .where('status', '!=', 'entregue')
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
  static onComandasPorStatus(status: 'aberta' | 'preparando' | 'entregue', callback: (comandas: Comanda[]) => void) {
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

  // Método de teste para verificar se o Firebase está funcionando
  static async testarConexao(): Promise<boolean> {
    try {
      console.log('🔍 Testando conexão com Firebase...');
      
      // Tentar acessar uma coleção que não existe (só para testar conexão)
      const testDoc = await firestore().collection('test_connection').doc('test').get();
      console.log('✅ Conexão com Firebase OK');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com Firebase:', error);
      return false;
    }
  }
}
