import { Redirect } from 'expo-router'
import { useIdentity } from '../contexts/IdentityContext'
import { View, ActivityIndicator, Image, Text, StyleSheet } from 'react-native'

export default function Index() {
  const { user, loading } = useIdentity()

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Background gradient layers */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />

        {/* Decorative glow orbs */}
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomLeft} />

        {/* Center Content */}
        <View style={styles.content}>
          {/* Logo container with subtle glow card */}
          <View style={styles.logoCard}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>— Prepare for the Next Level —</Text>

          {/* Loading indicator */}
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#4ADE80" />
            <Text style={styles.loaderText}>Signing you in…</Text>
          </View>
        </View>

        {/* Bottom branding */}
        <Text style={styles.version}>Enterprise Edition · v1.0</Text>
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/onboarding" />
  }

  if (user.role === 'student') {
    return <Redirect href="/(student)/dashboard" />
  } else if (user.role === 'parent') {
    return <Redirect href="/(parent)/dashboard" />
  } else {
    return <Redirect href="/(teacher)/dashboard" />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#00193D',
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: '#011529',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#004B93',
    opacity: 0.22,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1A6B3A',
    opacity: 0.18,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    paddingHorizontal: 36,
    paddingVertical: 28,
    shadowColor: '#004B93',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 20,
    marginBottom: 28,
  },
  logo: {
    width: 240,
    height: 80,
  },
  tagline: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.2,
    marginBottom: 36,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 36,
    color: 'rgba(255,255,255,0.20)',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
})
