import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, StatusBar,
} from 'react-native'
import { Search, Bell, X } from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { C, SHADOW, RADIUS, GRADIENT } from '../../lib/theme'
import { LinearGradient } from 'expo-linear-gradient'

interface TeacherHeaderProps {
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
}

export function TeacherHeader({
  onSearch,
  searchPlaceholder = 'Search…',
  showSearch = true,
}: TeacherHeaderProps) {
  const { user } = useIdentity()
  const initial = user?.fullName?.charAt(0).toUpperCase() || 'T'
  const [searchVisible, setSearchVisible] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (text: string) => {
    setQuery(text)
    onSearch?.(text)
  }

  const handleClearSearch = () => {
    setQuery('')
    onSearch?.('')
    setSearchVisible(false)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {/* Brand */}
        <View style={styles.brand}>
          {/* Gradient logo square — official brand gradient */}
          <LinearGradient
            colors={[...GRADIENT.colors]}
            start={GRADIENT.start}
            end={GRADIENT.end}
            style={styles.logoSquare}
          >
            <Text style={styles.logoText}>Be</Text>
          </LinearGradient>
          <View>
            <Text style={styles.brandName}>BeBrilliant</Text>
            <Text style={styles.brandSub}>Teacher Hub</Text>
          </View>
        </View>

        {/* Right controls */}
        <View style={styles.rightRow}>
          {showSearch && !searchVisible && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setSearchVisible(true)}
              activeOpacity={0.75}
            >
              <Search size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.75}>
            <Bell size={18} color={C.textSecondary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <LinearGradient
            colors={[...GRADIENT.colors]}
            start={GRADIENT.start}
            end={GRADIENT.end}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Inline search bar */}
      {searchVisible && showSearch && (
        <View style={styles.searchRow}>
          <Search size={16} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={handleSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
            autoFocus
          />
          <TouchableOpacity onPress={handleClearSearch} style={{ padding: 4 }}>
            <X size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const PT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 52

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.bgCard,
    paddingTop:      PT,
    paddingHorizontal: 16,
    paddingBottom:   12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,        // official: #E5E7EB
    ...SHADOW.card,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSquare: {
    width:          36,
    height:         36,
    borderRadius:   RADIUS.sm,          // 12px
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  brandName: {
    fontSize:    16,
    fontWeight:  '900',
    color:       C.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize:      9,
    fontWeight:    '700',
    color:         C.primaryBlueMid,    // #2563EB
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width:          36,
    height:         36,
    borderRadius:   RADIUS.sm,
    backgroundColor: '#F7F8FA',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    C.border,
    position:       'relative',
  },
  bellDot: {
    position:    'absolute',
    top:         7,
    right:       7,
    width:       6,
    height:      6,
    borderRadius: 3,
    backgroundColor: C.error,           // #DC2626
    borderWidth:  1,
    borderColor:  '#FFFFFF',
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  searchRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      10,
    backgroundColor: '#F7F8FA',
    borderRadius:   RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderWidth:    1,
    borderColor:    C.border,
  },
  searchInput: {
    flex:       1,
    fontSize:   14,
    fontWeight: '500',
    color:      C.textPrimary,
    padding:    0,
  },
})
