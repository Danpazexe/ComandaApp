import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacityMR = useRef(new Animated.Value(0)).current;
  const logoOpacityBR = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ocultar a StatusBar completamente
    StatusBar.setHidden(true);
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacityMR, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(400),

      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(logoOpacityMR, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacityBR, {
            toValue: 1,
            duration: 300,
            delay: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),

      Animated.delay(1500),

      Animated.timing(logoOpacityBR, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      clearTimeout(timeout);
      // Restaurar a StatusBar quando o componente for desmontado
      StatusBar.setHidden(false);
    };
  }, [onFinish, logoScale, logoOpacityMR, logoOpacityBR, backgroundScale, backgroundOpacity]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} translucent={true} />
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacityMR, transform: [{ scale: logoScale }], zIndex: 1 },
        ]}
      >
        <Image
          source={require("../../assets/LOGOSEMFUNDOMR.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.background,
          { transform: [{ scale: backgroundScale }], opacity: backgroundOpacity },
        ]}
      />

      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacityBR, transform: [{ scale: logoScale }], zIndex: 3 },
        ]}
      >
        <Image
          source={require("../../assets/LOGOSEMFUNDOBR.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  background: {
    position: "absolute",
    width: width * 2,
    height: height * 2,
    backgroundColor: "#4d2c19",
    borderRadius: (width + height) / 2,
    top: -height / 2,
    left: -width / 2,
    zIndex: 2,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
    alignSelf: "center",
  },
  logoWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SplashScreen;