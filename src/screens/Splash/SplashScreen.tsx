import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  Easing,
} from "react-native";

const { width, height } = Dimensions.get("window");

// 🎨 Constantes de estilo e tempo
const COLORS = {
  background: "#4d2c19",
  white: "#fff",
};

const TIMING = {
  logoFadeIn: 800,
  logoScale: 600,
  delayBetween: 400,
  backgroundFade: 300,
  backgroundScale: 700,
  logoSwitch: 300,
  logoFadeOut: 600,
  total: 4000,
};

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // 🎯 Valores animados
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacityMR = useRef(new Animated.Value(0)).current;
  const logoOpacityBR = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  const runAnimations = () => {
    Animated.sequence([
      // Etapa 1: Logo MR aparece
      Animated.parallel([
        Animated.timing(logoOpacityMR, {
          toValue: 1,
          duration: TIMING.logoFadeIn,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(TIMING.delayBetween),

      // Etapa 2: Fundo expande e troca para logo BR
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: TIMING.backgroundFade,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 1,
          duration: TIMING.backgroundScale,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(logoOpacityMR, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacityBR, {
            toValue: 1,
            duration: TIMING.logoSwitch,
            delay: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),

      Animated.delay(1500),

      // Etapa 3: Logo BR desaparece
      Animated.timing(logoOpacityBR, {
        toValue: 0,
        duration: TIMING.logoFadeOut,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    StatusBar.setHidden(true, "fade");
    runAnimations();

    const timeout = setTimeout(onFinish, TIMING.total);

    return () => {
      clearTimeout(timeout);
      StatusBar.setHidden(false, "fade");
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Logo MR */}
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

      {/* Fundo expansivo */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            transform: [{ scale: backgroundScale }],
            opacity: backgroundOpacity,
          },
        ]}
      />

      {/* Logo BR */}
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

// 🎯 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  backgroundCircle: {
    position: "absolute",
    width: width * 2,
    height: height * 2,
    backgroundColor: COLORS.background,
    borderRadius: (width + height),
    top: -height / 2,
    left: -width / 2,
    zIndex: 2,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
  },
  logoWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SplashScreen;
