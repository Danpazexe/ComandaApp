import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { PedidoMonitor } from '../../types/Comanda';

const ClienteMonitorScreen: React.FC = () => {
  const [pedidosPreparando, setPedidosPreparando] = useState<PedidoMonitor[]>([]);
  const [pedidosProntos, setPedidosProntos] = useState<PedidoMonitor[]>([]);

  // Calcular pedidos que vão para direita (não cabem no centro)
  const pedidosParaDireita = pedidosProntos.length > 4 ? pedidosProntos.slice(0, -4).reverse() : [];

  useEffect(() => {
    const unsubPrep = firestore()
      .collection('comandas')
      .where('status', '==', 'preparando')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snap) => {
        const arr: PedidoMonitor[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          arr.push({
            id: doc.id,
            numero: d.numero,
            nomeCliente: (d.nomeCliente || `Cliente ${d.numero}`)?.toUpperCase(),
            status: 'preparando',
            timestamp: d.timestamp?.toDate() || new Date(),
            horaAtendimento: d.horaAtendimento?.toDate(),
          });
        });
        setPedidosPreparando(arr);
      });

    const unsubPronto = firestore()
      .collection('comandas')
      .where('status', '==', 'pronto')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snap) => {
        const arr: PedidoMonitor[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          arr.push({
            id: doc.id,
            numero: d.numero,
            nomeCliente: (d.nomeCliente || `Cliente ${d.numero}`)?.toUpperCase(),
            status: 'pronto',
            timestamp: d.timestamp?.toDate() || new Date(),
            horaAtendimento: d.horaAtendimento?.toDate(),
          });
        });
        setPedidosProntos(arr);
      });

    return () => {
      unsubPrep();
      unsubPronto();
    };
  }, []);

  const renderLista = (lista: PedidoMonitor[]) => {
    console.log('Renderizando lista:', lista.length, 'itens:', lista.map(p => p.nomeCliente));
    return lista.length === 0 ? (
      <Text style={styles.placeholder}>—</Text>
    ) : (
      lista.map((p) => (
        <Text key={p.id} style={styles.nomeLateral}>{p.nomeCliente}</Text>
      ))
    );
  };

  
  const renderCentro = () => {
    if (pedidosProntos.length === 0) {
      return (
        <View style={[styles.boxBranco, styles.boxCentro]}>
          <View style={styles.centroTopo}>
            <Text style={styles.placeholder}>—</Text>
          </View>
          <View style={styles.centroBase}>
            <View style={styles.centroQuad} />
            <View style={styles.centroQuad} />
            <View style={styles.centroQuad} />
          </View>
        </View>
      );
    }

    // LÓGICA: Máximo 4 pedidos no centro (1 gigante + 3 baixo), resto vai para direita
    const pedidosCentro = pedidosProntos.slice(-4); // Últimos 4
    const pedidosDireita = pedidosProntos.slice(0, -4).reverse(); // Todos os outros (mais recente primeiro)

    // Atualizar estado dos pedidos que vão para direita
    if (pedidosDireita.length > 0) {
      console.log('📤 Movendo para direita:', pedidosDireita.map(p => p.nomeCliente));
    }

    const ultimoChamado = pedidosCentro[pedidosCentro.length - 1]; // Último da lista (PEDIDO 6)
    const anteriores = pedidosCentro.slice(0, -1); // 3 anteriores (PEDIDO 3, 4, 5)

    return (
      <View style={[styles.boxBranco, styles.boxCentro]}>
        {/* Nome principal gigante, bem no meio - SEMPRE o último chamado */}
        <View style={styles.centroTopo}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.nomeGigante}>
            {ultimoChamado.nomeCliente}
          </Text>
        </View>

        {/* Três quadrados embaixo - pedidos anteriores chamados */}
        <View style={styles.centroBase}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.centroQuad}>
              {anteriores[i] && (
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.nomeSecundario}>
                  {anteriores[i].nomeCliente}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.telaAzul}>
      <StatusBar translucent={false} backgroundColor="#F5F5F5" barStyle="dark-content" />

      <View style={styles.linha}>
        {/* ESQUERDA */}
        <View style={styles.colWrap}>
          <Text style={styles.tituloEsq}>EM PREPARAÇÃO</Text>
          <View style={[styles.boxBranco, styles.boxLateral]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderLista(pedidosPreparando)}
            </ScrollView>
          </View>
        </View>

        {/* CENTRO */}
        <View style={[styles.colWrap, styles.colCentro]}>
          <Text style={styles.tituloCentro}>SEU PEDIDO ESTÁ PRONTO</Text>
          {renderCentro()}
        </View>

        {/* DIREITA */}
        <View style={styles.colWrap}>
          <Text style={styles.tituloDir}>JÁ CHAMADOS ({pedidosParaDireita.length})</Text>
          <View style={[styles.boxBranco, styles.boxLateral]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderLista(pedidosParaDireita)}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

const AZUL = '#1663D6';      // fundo azul da tela
const BRANCO = '#FFFFFF';    // fundo branco dos boxes
const VERMELHO = '#D22F2F';  // números/nomes em vermelho
const CIANO = '#B6E2FF';     // título da esquerda (igualzinho ao tom claro da foto)
const ROSA = '#F390FF';      // título da direita (magenta/rosa da foto)

const styles = StyleSheet.create({
  // FUNDO DA TELA
  telaAzul: {
    flex: 1,
    backgroundColor: AZUL,
    padding: 12,
  },

  // LINHA COM AS 3 COLUNAS
  linha: {
    flex: 1,
    flexDirection: 'row',
  },

  // WRAP DE CADA COLUNA 
  colWrap: {
    flex: 1,
    paddingHorizontal: 6,
    borderRightWidth: 4, 
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#1663D6',
  },
  colCentro: {
    flex: 1.35, 
  },

  // TÍTULOS 
  tituloEsq: {
    color: CIANO,
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    textAlign: 'left',
    marginBottom: 6,
  },
  tituloCentro: {
    color: BRANCO,
    fontWeight: 'bold',
    fontSize: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 6,
  },
  tituloDir: {
    color: ROSA,
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginBottom: 6,
  },

  // BOXES BRANCOS (as colunas propriamente ditas)
  boxBranco: {
    backgroundColor: BRANCO,
    borderWidth: 0,        
    borderRadius: 0,       
    flex: 1,
  },
  boxLateral: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // LISTAS LATERAIS (nomes vermelhos alinhados à esquerda)
  nomeLateral: {
    color: VERMELHO,
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'left',
    
  },
  placeholder: {
    color: '#9AA7C7',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // COLUNA DO MEIO
  boxCentro: {
    padding: 0,
  },
  centroTopo: {
    flex: 1.3,                   
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 4, 
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#1663D6',
    borderStyle: 'solid',
  },
  nomeGigante: {
    color: VERMELHO,
    fontWeight: 'bold',
    fontSize: 64,                // bem grande
    textTransform: 'uppercase',
    textAlign: 'center',
    includeFontPadding: false,
    
  },
  centroBase: {
    flexDirection: 'row',
    height: 180,
     
  },
  centroQuad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 4, 
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#1663D6',
    borderStyle: 'solid',
    
    
  },
  nomeSecundario: {
    color: VERMELHO,
    fontWeight: 'bold',
    fontSize: 22,
    textTransform: 'uppercase',
    textAlign: 'center',
    
  },
});

export default ClienteMonitorScreen;
