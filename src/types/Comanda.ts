export interface Item {
  nome: string;
  quantidade: number;
}

export interface Comanda {
  id?: string; // ID do documento no Firestore
  numero: number;
  nomeCliente?: string; // Nome do cliente
  itens: Item[];
  status: 'aberta' | 'preparando' | 'entregue';
  timestamp: Date;
  horaAtendimento?: Date; // Hora que foi atendida (quando mudou para 'preparando')
  totalSementes?: number;
}

export interface ComandaFechada {
  numero: number;
  nomeCliente?: string;
  itens: Item[];
  data: string;
  totalSementes?: number;
}
