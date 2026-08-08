import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native'
import {
  LogOut,
  ChevronRight,
  Wallet,
  Bell,
  Lock,
  Mail,
  Phone,
  School,
  UserCircle,
  Award,
  Shield,
  Share2,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { apiFetch } from '../../lib/api'
import { StudentHeader } from '../../components/student/StudentHeader'

interface WalletInfo {
  credits: number
  completedExams: number
  avgScore: number
}

export default function StudentProfile() {
  const { user, logout } = useIdentity()
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifEnabled, setNotifEnabled] = useState(true)

  useEffect(() => {
    apiFetch('/api/student/dashboard-summary')
      .then(data => setWallet({ credits: data?.credits || 0, completedExams: data?.completedExams || 0, avgScore: data?.avgScore || 0 }))
      .catch(() => setWallet({ credits: 0, completedExams: 0, avgScore: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'S'
  const firstName   = user?.fullName?.split(' ')[0] || 'Student'
  const lastName    = user?.fullName?.split(' ').slice(1).join(' ') || ''

  // Badge logic
  const avg = wallet?.avgScore || 0
  let badgeName = 'Merit'
  let badgeColor = '#F59E0B'
  if (avg >= 90) { badgeName = 'Distinction'; badgeColor = '#059669' }
  else if (avg >= 80) { badgeName = 'Excellence'; badgeColor = '#7C3AED' }
  else if (avg < 60) { badgeName = 'Rising'; badgeColor = '#94A3B8' }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your BeBrilliant account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO PROFILE CARD ─────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroOrbTR} />
          <View style={styles.heroOrbBL} />

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: badgeColor }]}>
              <Award size={10} color="#FFF" />
              <Text style={styles.badgePillText}>{badgeName}</Text>
            </View>
          </View>

          {/* Name & role */}
          <Text style={styles.heroName}>{user?.fullName || 'Student'}</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>
          <View style={styles.heroRolePill}>
            <Shield size={11} color="#4ADE80" />
            <Text style={styles.heroRoleText}>Student · BeBrilliant ID</Text>
          </View>

          {/* 3 stat pills */}
          <View style={styles.heroStats}>
            {[
              { label: 'Exams Done', value: wallet?.completedExams ?? '—', icon: BookOpen },
              { label: 'Avg Score',  value: `${wallet?.avgScore ?? 0}%`,    icon: Award   },
              { label: 'Credits',    value: `₹${(wallet?.credits ?? 0).toFixed(0)}`, icon: Wallet },
            ].map(({ label, value, icon: Icon }) => (
              <View key={label} style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{loading ? '…' : value}</Text>
                <Text style={styles.heroStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── WALLET BALANCE ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WALLET & CREDITS</Text>
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <View style={styles.walletIcon}>
                <Wallet size={22} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletAmount}>
                  {loading ? '…' : `₹${(wallet?.credits ?? 0).toFixed(2)}`}
                </Text>
                <Text style={styles.walletSub}>1 Credit = ₹1.00 · For premium exams</Text>
              </View>
            </View>
            <View style={styles.walletRefill}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.walletRefillText}>Earn Credits</Text>
            </View>
          </View>

          {/* Refer & Earn prompt */}
          <View style={styles.referCard}>
            <Share2 size={16} color="#7C3AED" />
            <View style={{ flex: 1 }}>
              <Text style={styles.referTitle}>Refer a Friend · Earn 100 Credits</Text>
              <Text style={styles.referDesc}>Share your invite link and get rewarded!</Text>
            </View>
            <ChevronRight size={16} color="#7C3AED" />
          </View>
        </View>

        {/* ── STUDENT INFO ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STUDENT INFORMATION</Text>
          <View style={styles.infoCard}>
            {[
              { icon: UserCircle, label: 'Full Name',    value: user?.fullName || '—' },
              { icon: Mail,       label: 'Email',        value: user?.email || '—' },
              { icon: School,     label: 'Institution',  value: user?.tenant?.name || '—' },
              { icon: Shield,     label: 'Account Role', value: 'Student' },
            ].map(({ icon: Icon, label, value }, idx, arr) => (
              <View
                key={label}
                style={[styles.infoRow, idx < arr.length - 1 && styles.infoRowBorder]}
              >
                <View style={styles.infoIconWrap}>
                  <Icon size={15} color="#004B93" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── SETTINGS ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.settingsCard}>
            {/* Notifications toggle */}
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={[styles.settingIcon, { backgroundColor: '#EBF3FC' }]}>
                <Bell size={16} color="#004B93" />
              </View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#E2E8F0', true: '#004B9350' }}
                thumbColor={notifEnabled ? '#004B93' : '#CBD5E1'}
              />
            </View>

            {/* Change password */}
            <TouchableOpacity
              style={[styles.settingRow, styles.settingRowBorder]}
              activeOpacity={0.75}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#F5F3FF' }]}>
                <Lock size={16} color="#7C3AED" />
              </View>
              <Text style={styles.settingLabel}>Change Password</Text>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Help */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
              <View style={[styles.settingIcon, { backgroundColor: '#ECFDF5' }]}>
                <HelpCircle size={16} color="#059669" />
              </View>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── APP INFO ─────────────────────────────────────── */}
        <View style={[styles.section, { alignItems: 'center' }]}>
          <Text style={styles.appVersion}>BeBrilliant · Enterprise Edition v1.0</Text>
          <Text style={styles.appTagline}>Made in India 🇮🇳 · India's First AI-based Smart Education Platform</Text>
        </View>

        {/* ── SIGN OUT ─────────────────────────────────────── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FF' },

  // Hero card
  heroCard: {
    backgroundColor: '#003E7E',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrbTR: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#005EB8', opacity: 0.5 },
  heroOrbBL: { position: 'absolute', bottom: -30, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#059669', opacity: 0.22 },
  avatarWrap: { alignItems: 'center', marginBottom: 14, zIndex: 2 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#005EB8', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginTop: -8, zIndex: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 4 },
  badgePillText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, zIndex: 2 },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.60)', fontWeight: '600', marginTop: 4, zIndex: 2 },
  heroRolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', zIndex: 2 },
  heroRoleText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },
  heroStats: { flexDirection: 'row', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', width: '100%', zIndex: 2 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },

  // Wallet
  walletCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
    borderWidth: 1, borderColor: '#FEF3C7', marginBottom: 10,
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  walletIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  walletLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  walletAmount: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  walletSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  walletRefill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFBEB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#FDE68A' },
  walletRefillText: { fontSize: 11, fontWeight: '800', color: '#D97706' },

  referCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F3FF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  referTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  referDesc: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Info
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF3FC', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  // Settings
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // App info
  appVersion: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  appTagline: { fontSize: 10, color: '#CBD5E1', fontWeight: '500', marginTop: 4, textAlign: 'center', lineHeight: 16 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF1F2', borderRadius: 18, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '900', color: '#EF4444' },
})
