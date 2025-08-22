import firestore from '@react-native-firebase/firestore';

// Configuração do Firebase
// Nota: Para React Native, a configuração é feita automaticamente através dos arquivos
// google-services.json (Android) e GoogleService-Info.plist (iOS)
// que devem estar nas pastas android/app/ e ios/ respectivamente

// Para React Native, o Firebase é inicializado automaticamente
// quando os arquivos google-services.json e GoogleService-Info.plist estão presentes

// Exportar a instância do Firestore
export const db = firestore();

// Exportar a instância do app (opcional, já que é inicializado automaticamente)
export default firestore().app;
