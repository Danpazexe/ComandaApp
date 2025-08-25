import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, onSnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, appConfig, StatusComanda } from '../config/api';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Exportar configurações e tipos
export { firebaseConfig, appConfig, StatusComanda };

// Função para converter Firebase Timestamp para Date
export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Função para escutar mudanças nas comandas
export const listenToComandas = (
  status: StatusComanda,
  callback: (pedidos: any[]) => void
) => {
  const q = query(
    collection(db, appConfig.colecaoComandas),
    where('status', '==', status),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const pedidos: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      pedidos.push({
        id: doc.id,
        numero: data.numero,
        nomeCliente: data.nomeCliente || `Cliente ${data.numero}`,
        status: data.status,
        timestamp: convertTimestamp(data.timestamp),
        horaAtendimento: data.horaAtendimento ? convertTimestamp(data.horaAtendimento) : undefined,
      });
    });
    callback(pedidos);
  });
};

// Função para adicionar nova comanda
export const addComanda = async (comandaData: {
  numero: number;
  nomeCliente?: string;
  itens?: any[];
  total?: number;
}) => {
  try {
    const docRef = await addDoc(collection(db, appConfig.colecaoComandas), {
      ...comandaData,
      status: StatusComanda.PREPARANDO,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar comanda:', error);
    throw error;
  }
};

// Função para atualizar status da comanda
export const updateComandaStatus = async (comandaId: string, status: StatusComanda) => {
  try {
    const comandaRef = doc(db, appConfig.colecaoComandas, comandaId);
    const updateData: any = { status };
    
    if (status === StatusComanda.PRONTO) {
      updateData.horaAtendimento = Timestamp.now();
    }
    
    await updateDoc(comandaRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar status da comanda:', error);
    throw error;
  }
};

// Função para deletar comanda
export const deleteComanda = async (comandaId: string) => {
  try {
    await deleteDoc(doc(db, appConfig.colecaoComandas, comandaId));
  } catch (error) {
    console.error('Erro ao deletar comanda:', error);
    throw error;
  }
};

// Função para buscar todas as comandas
export const getAllComandas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, appConfig.colecaoComandas));
    const comandas: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comandas.push({
        id: doc.id,
        ...data,
        timestamp: convertTimestamp(data.timestamp),
        horaAtendimento: data.horaAtendimento ? convertTimestamp(data.horaAtendimento) : undefined,
      });
    });
    return comandas;
  } catch (error) {
    console.error('Erro ao buscar comandas:', error);
    throw error;
  }
};

// Função para buscar comanda por número
export const getComandaByNumber = async (numero: number) => {
  try {
    const q = query(collection(db, appConfig.colecaoComandas), where('numero', '==', numero));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: convertTimestamp(data.timestamp),
        horaAtendimento: data.horaAtendimento ? convertTimestamp(data.horaAtendimento) : undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar comanda por número:', error);
    throw error;
  }
};
