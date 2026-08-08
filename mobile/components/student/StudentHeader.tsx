import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native'
import { Bell, Search, X } from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'

interface StudentHeaderProps {
  /** Pass notifications count to show badge */
  notificationCount?: number
  /** Override placeholder text */
  searchPlaceholder?: string
  /** Called when user types in search box */
  onSearch?: (text: string) => void
}

export function StudentHeader({
  notificationCount = 0,
  searchPlaceholder = 'Search exams, subjects…',
  onSearch,
}: StudentHeaderProps) {
  const { user } = useIdentity()
  const [searchText, setSearchText] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'S'

  const handleChange = (text: string) => {
    setSearchText(text)
    onSearch?.(text)
  }

  const clearSearch = () => {
    setSearchText('')
    onSearch?.('')
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#003E7E" />
      <View style={styles.container}>
        {/* Left — Logo */}
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Center — Search Bar */}
        <View style={[styles.searchWrap, searchFocused && styles.searchFocused]}>
          <Search size={14} color={searchFocused ? '#004B93' : '#94A3B8'} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#94A3B8"
            value={searchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChangeText={handleChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={12} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Right — Bell + Avatar */}
        <View style={styles.rightRow}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Bell size={18} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003E7E',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 10,
    paddingBottom: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  logo: {
    width: 96,
    height: 28,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  searchFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#004B93',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
    margin: 0,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#003E7E',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
})
