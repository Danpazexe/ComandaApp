export interface Item {
  nome: string;
  quantidade: number;
}

export interface Comanda {
  id?: string; 
  numero: number;
  nomeCliente?: string; 
  itens: Item[];
  status: 'aberta' | 'preparando' | 'pronto' | 'entregue';
  timestamp: Date;
  horaAtendimento?: Date; 
  horaPronto?: Date; 
  totalSementes?: number;
}

export interface ComandaFechada {
  numero: number;
  nomeCliente?: string;
  itens: Item[];
  data: string;
  totalSementes?: number;
}

// Interface para o monitor de clientes
export interface PedidoMonitor {
  id: string;
  numero: number;
  nomeCliente: string;
  status: 'preparando' | 'pronto' | 'chamado';
  timestamp: Date;
  horaAtendimento?: Date;
}
