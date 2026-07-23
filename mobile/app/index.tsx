import { Redirect } from 'expo-router'
import { useIdentity } from '../contexts/IdentityContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { user, loading } = useIdentity()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#004B93', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
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
