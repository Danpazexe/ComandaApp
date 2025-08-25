// Configurações do Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyA0XBfncPULp3uSwuANbivzWdx05LJZQEs",
  authDomain: "comandaapp-797db.firebaseapp.com",
  projectId: "comandaapp-797db",
  storageBucket: "comandaapp-797db.firebasestorage.app",
  messagingSenderId: "778181898191",
  appId: "1:778181898191:web:734596a699f59886de2cba",
  measurementId: "G-2CQWQ9WEX3"
};

// Configurações da aplicação
export const appConfig = {
  colecaoComandas: 'comandas'
};

// Status das comandas
export enum StatusComanda {
  PREPARANDO = 'preparando',
  PRONTO = 'pronto',
  ENTREGUE = 'entregue'
}
