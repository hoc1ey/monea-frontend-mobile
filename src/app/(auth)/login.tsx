import { StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Button } from '@/components/ui';
import { palette, typography, useThemeColors } from '@/theme';

export default function LoginScreen() {
  const colors = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.brand}>
        <LinearGradient
          colors={[palette.cerise[500], palette.cerise[900]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Text style={styles.logoLetter}>M</Text>
        </LinearGradient>
        <Text style={[styles.title, { color: colors.text }]}>MONEA</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Tus finanzas, en orden</Text>
      </View>
      <Button title="Iniciar sesión" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 18,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: 4,
  },
});
