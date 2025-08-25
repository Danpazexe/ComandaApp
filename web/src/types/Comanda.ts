import { StatusComanda } from '../services/firebase';

export interface PedidoMonitor {
  id: string;
  numero: number;
  nomeCliente: string;
  status: StatusComanda;
  timestamp: Date;
  horaAtendimento?: Date;
}

export interface Comanda {
  id: string;
  numero: number;
  nomeCliente?: string;
  status: StatusComanda;
  timestamp: any; // Firebase Timestamp
  horaAtendimento?: any; // Firebase Timestamp
  itens?: ComandaItem[];
  total?: number;
}

export interface ComandaItem {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
  observacoes?: string;
}
