import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  Alert, Modal, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  User, Mail, Building, ShieldCheck, Users,
  Bell, Lock, LogOut, ChevronRight, CheckCircle, Sparkles,
} from 'lucide-react-native'
import { useIdentity } from '../../contexts/IdentityContext'
import { useParentChildren } from '../../hooks/useParentChildren'
import { ParentHeader } from '../../components/parent/ParentHeader'

export default function ParentProfile() {
  const router = useRouter()
  const { user, logout } = useIdentity()
  const { data: children } = useParentChildren()
  const [notifications, setNotifications] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const initial = user?.fullName?.charAt(0).toUpperCase() || 'P'
  const name = user?.fullName || 'Parent Guardian'
  const email = user?.email || 'parent@bebrilliant.in'
  const tenantName = user?.tenant?.name || 'BeBrilliant Education'
  const childrenCount = children?.length || 0

  const handleLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  return (
    <View style={s.container}>
      <ParentHeader showSearch={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        {/* Emerald Guardian Hero Card */}
        <View style={s.heroCard}>
          <View style={s.heroBadge}>
            <ShieldCheck size={12} color="#A7F3D0" />
            <Text style={s.heroBadgeText}>VERIFIED GUARDIAN</Text>
          </View>

          <View style={s.avatarWrap}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>

          <Text style={s.userName}>{name}</Text>
          <Text style={s.userEmail}>{email}</Text>
          <Text style={s.tenantName}>🏫 {tenantName}</Text>

          {/* Stats Bar */}
          <View style={s.statsBar}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{childrenCount}</Text>
              <Text style={s.statLbl}>Linked Students</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statVal}>Active</Text>
              <Text style={s.statLbl}>Status</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {/* Linked Children Roster Card */}
          <Text style={s.sectionHeader}>LINKED STUDENTS ROSTER</Text>
          <View style={s.navCard}>
            {children && children.length > 0 ? (
              children.map((child, idx) => (
                <TouchableOpacity
                  key={child.id}
                  style={[s.navItem, idx > 0 && s.navBorder]}
                  onPress={() => router.push('/(parent)/children')}
                >
                  <View style={s.childAvatar}>
                    <Text style={s.childAvatarText}>{child.first_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.navText}>{child.first_name} {child.last_name || ''}</Text>
                    <Text style={s.childSubText}>
                      Class {(child.metadata as any)?.school_class || 'Standard 10'} · Section {(child.metadata as any)?.division || 'A'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Users size={24} color="#94A3B8" />
                <Text style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>No linked students</Text>
              </View>
            )}
          </View>

          {/* Quick Hub Navigation */}
          <Text style={s.sectionHeader}>PARENT PORTAL MODULES</Text>
          <View style={s.navCard}>
            <TouchableOpacity style={s.navItem} onPress={() => router.push('/(parent)/children')}>
              <View style={[s.navIconBox, { backgroundColor: '#EBF3FC' }]}>
                <Users size={18} color="#004B93" />
              </View>
              <Text style={s.navText}>Academic & Attendance Summary</Text>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={[s.navItem, s.navBorder]} onPress={() => router.push('/(parent)/fees')}>
              <View style={[s.navIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Building size={18} color="#D97706" />
              </View>
              <Text style={s.navText}>Institutional Fee Ledger</Text>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <Text style={s.sectionHeader}>PREFERENCES & SECURITY</Text>
          <View style={s.navCard}>
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <Bell size={18} color="#059669" />
                <Text style={s.settingText}>Attendance & Result Alerts</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
                thumbColor={notifications ? '#059669' : '#CBD5E1'}
              />
            </View>

            <TouchableOpacity
              style={[s.navItem, s.navBorder]}
              onPress={() => Alert.alert('Security', 'Password change email sent.')}
            >
              <View style={[s.navIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Lock size={18} color="#64748B" />
              </View>
              <Text style={s.navText}>Change Password</Text>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.85}
          >
            <LogOut size={18} color="#EF4444" />
            <Text style={s.logoutText}>Log Out from Parent Portal</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerBrand}>BeBrilliant Parent Hub</Text>
            <Text style={s.footerSub}>India's First AI based Smart Education Platform</Text>
            <Text style={s.footerVer}>v1.0.4 · Build 2026</Text>
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalIconBox}>
              <LogOut size={24} color="#EF4444" />
            </View>
            <Text style={s.modalTitle}>Log Out?</Text>
            <Text style={s.modalDesc}>Are you sure you want to end your active parent portal session?</Text>

            <View style={s.modalActionRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowLogoutModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleLogout}>
                <Text style={s.confirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  heroCard: { backgroundColor: '#047857', padding: 24, alignItems: 'center', position: 'relative' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#A7F3D0', letterSpacing: 1 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#A7F3D0', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  tenantName: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 6 },
  statsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, marginTop: 20, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  statLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },
  sectionHeader: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
  navCard: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  navBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  navIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  childAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  navText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },
  childSubText: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, marginTop: 24, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 14, fontWeight: '900', color: '#EF4444' },
  footer: { alignItems: 'center', marginTop: 32, gap: 4 },
  footerBrand: { fontSize: 12, fontWeight: '900', color: '#64748B' },
  footerSub: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  footerVer: { fontSize: 9, fontWeight: '500', color: '#CBD5E1', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  modalIconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalDesc: { fontSize: 13, color: '#64748B', fontWeight: '500', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  modalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '800', color: '#475569' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
})
