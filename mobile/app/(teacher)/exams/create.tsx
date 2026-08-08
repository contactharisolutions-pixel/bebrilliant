import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet, Switch, Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  ArrowLeft, ChevronRight, ChevronLeft, Sparkles, Plus, Trash2,
  Check, Globe, Clock, X, Shield, BookOpen,
} from 'lucide-react-native'
import { apiFetch } from '../../../lib/api'
import { TeacherHeader } from '../../../components/teacher/TeacherHeader'

// ─── Types ───────────────────────────────────────────────────────────────────
interface SyllabusNode { id: string; name: string; type: string }
interface SectionRule { id: string; name: string; qCount: number; mark: number; negMark: number }
interface Template { id: string; name: string; category: string; duration_minutes: number; total_marks: number; sections: any[] }
interface AIQuestion { text: string; options: string[]; correctIndex: number; subject?: string }

type Step = 1 | 2 | 3

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  const steps = ['Parameters', 'Blueprint', 'AI Validate']
  return (
    <View style={s.stepBar}>
      {steps.map((label, i) => {
        const n = i + 1
        const done    = step > n
        const active  = step === n
        return (
          <React.Fragment key={label}>
            <View style={s.stepItem}>
              <View style={[s.stepCircle, active && s.stepCircleActive, done && s.stepCircleDone]}>
                {done
                  ? <Check size={12} color="#FFFFFF" />
                  : <Text style={[s.stepNum, (active || done) && { color: '#FFFFFF' }]}>{n}</Text>
                }
              </View>
              <Text style={[s.stepLabel, active && { color: '#7C3AED', fontWeight: '800' }]}>{label}</Text>
            </View>
            {i < 2 && <View style={[s.stepLine, done && s.stepLineDone]} />}
          </React.Fragment>
        )
      })}
    </View>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CreateExam() {
  const router = useRouter()
  const [step, setStep]       = useState<Step>(1)
  const [saving, setSaving]   = useState(false)
  const [generating, setGenerating] = useState(false)

  // Step 1 state
  const [name, setName]             = useState('')
  const [duration, setDuration]     = useState('60')
  const [isPaid, setIsPaid]         = useState(false)
  const [price, setPrice]           = useState('0')

  // Step 2 state
  const [syllabuses, setSyllabuses]     = useState<SyllabusNode[]>([])
  const [syllabusId, setSyllabusId]     = useState('')
  const [sections, setSections]         = useState<SectionRule[]>([
    { id: '1', name: 'Section A', qCount: 30, mark: 4, negMark: 1 },
  ])
  const [showBlueprintLib, setShowBlueprintLib] = useState(false)
  const [templates, setTemplates]       = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Step 3 state
  const [aiQuestions, setAiQuestions]   = useState<AIQuestion[]>([])
  const [approved, setApproved]         = useState<Set<number>>(new Set())

  // Load syllabuses
  useEffect(() => {
    apiFetch('/api/dashboard/syllabus')
      .then(data => setSyllabuses((data?.nodes || []).filter((n: SyllabusNode) => n.type === 'board')))
      .catch(() => {})
  }, [])

  // Blueprint Library load
  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await apiFetch('/api/dashboard/exams/online?action=GET_TEMPLATES')
      setTemplates(Array.isArray(data) ? data : [])
      setShowBlueprintLib(true)
    } catch { Alert.alert('Error', 'Could not load templates') }
    finally { setLoadingTemplates(false) }
  }

  const applyTemplate = (tmpl: Template) => {
    setName(`${tmpl.name} (Blueprint)`)
    setDuration(String(tmpl.duration_minutes))
    const newSections: SectionRule[] = tmpl.sections?.flatMap((sec: any) =>
      (sec.rules || []).map((r: any, i: number) => ({
        id: `${sec.section_name}-${i}`,
        name: `${sec.section_name} · ${r.question_type || 'MCQ'}`,
        qCount: r.num_questions || 10,
        mark: r.marks_per_question || 4,
        negMark: r.negative_marks || 1,
      }))
    ) || []
    if (newSections.length > 0) setSections(newSections)
    setShowBlueprintLib(false)
    setStep(1)
    Alert.alert('Template Applied!', 'Review the parameters and blueprint.')
  }

  const addSection = () => {
    setSections(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'New Section', qCount: 10, mark: 4, negMark: 1 },
    ])
  }

  const updateSection = (id: string, field: keyof SectionRule, value: any) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, [field]: value } : sec))
  }

  const removeSection = (id: string) => {
    if (sections.length === 1) return Alert.alert('', 'At least one section is required.')
    setSections(prev => prev.filter(s => s.id !== id))
  }

  const totalQs    = sections.reduce((s, c) => s + Number(c.qCount || 0), 0)
  const totalMarks = sections.reduce((s, c) => s + Number(c.qCount || 0) * Number(c.mark || 0), 0)

  // Step 1 → 2
  const goStep2 = () => {
    if (!name.trim()) return Alert.alert('Required', 'Please enter an exam title.')
    setStep(2)
  }

  // Step 2 → generate AI questions
  const generateQuestions = async () => {
    if (!syllabusId) return Alert.alert('Required', 'Please select a reference syllabus.')
    if (totalQs === 0) return Alert.alert('Required', 'Add at least one question in your blueprint.')
    setGenerating(true)
    try {
      const sylName = syllabuses.find(s => s.id === syllabusId)?.name || 'General'
      const data = await apiFetch('/api/dashboard/ai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'GENERATE_QUESTIONS',
          payload: { total_nodes: totalQs, syllabus_name: sylName, subjects: sections, language: 'English', format: 'OBJECTIVE_ONLY' },
        }),
      })
      const qs: AIQuestion[] = data?.questions || []
      setAiQuestions(qs)
      setApproved(new Set(qs.map((_, i) => i)))
      setStep(3)
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Question generation failed. Try again.')
    } finally { setGenerating(false) }
  }

  // Finalize publish
  const publishExam = async () => {
    setSaving(true)
    try {
      const payload = {
        title: name, status: 'publish',
        total_marks: totalMarks, duration: parseInt(duration),
        pricing_type: isPaid ? 'paid' : 'free', price: isPaid ? parseInt(price) : 0,
        blueprint: { syllabusId, sections, questions: aiQuestions.filter((_, i) => approved.has(i)) },
      }
      await apiFetch('/api/dashboard/exams/online', {
        method: 'POST',
        body: JSON.stringify({ action: 'CREATE_EXAM', payload }),
      })
      Alert.alert('✅ Published!', `"${name}" is now live.`, [{ text: 'OK', onPress: () => router.back() }])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not publish exam.')
    } finally { setSaving(false) }
  }

  return (
    <View style={s.container}>
      <TeacherHeader showSearch={false} />

      {/* Header row */}
      <View style={s.topRow}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(s => (s - 1) as Step)} style={s.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.pageTitle}>Create Exam</Text>
          <Text style={s.pageSub}>Step {step} of 3</Text>
        </View>
        <TouchableOpacity onPress={loadTemplates} style={s.libBtn} disabled={loadingTemplates}>
          {loadingTemplates
            ? <ActivityIndicator size="small" color="#7C3AED" />
            : <><Globe size={14} color="#7C3AED" /><Text style={s.libBtnText}>Blueprint Library</Text></>}
        </TouchableOpacity>
      </View>

      <StepBar step={step} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: Parameters ───────────────────────────── */}
        {step === 1 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Core Parameters</Text>
            <Text style={s.cardSub}>Define the exam title, duration, and pricing.</Text>

            <Text style={s.fieldLabel}>Exam Title *</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="e.g. NEET Physics Mock — Set A"
              style={s.input} placeholderTextColor="#94A3B8"
            />

            <Text style={s.fieldLabel}>Duration (minutes)</Text>
            <TextInput
              value={duration} onChangeText={setDuration}
              keyboardType="numeric" style={s.input} placeholderTextColor="#94A3B8"
            />

            <View style={s.toggleRow}>
              <View>
                <Text style={s.fieldLabel}>Paid Exam</Text>
                <Text style={s.toggleSub}>Enable to charge students for this exam</Text>
              </View>
              <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: '#E2E8F0', true: '#DDD6FE' }} thumbColor={isPaid ? '#7C3AED' : '#CBD5E1'} />
            </View>

            {isPaid && (
              <View style={{ marginTop: 12 }}>
                <Text style={s.fieldLabel}>Price (₹)</Text>
                <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={[s.input, s.inputAccent]} placeholderTextColor="#94A3B8" />
              </View>
            )}

            <TouchableOpacity style={s.nextBtn} onPress={goStep2}>
              <Text style={s.nextBtnText}>Next: Blueprint</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Blueprint ─────────────────────────────── */}
        {step === 2 && (
          <View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Question Blueprint</Text>
              <Text style={s.cardSub}>Define sections, question counts, marks, and negative marking.</Text>

              <Text style={s.fieldLabel}>Reference Syllabus</Text>
              {syllabuses.length > 0 ? (
                <View style={s.syllabusGrid}>
                  {syllabuses.map(syl => (
                    <TouchableOpacity
                      key={syl.id}
                      style={[s.syllabusChip, syllabusId === syl.id && s.syllabusChipActive]}
                      onPress={() => setSyllabusId(syl.id)}
                    >
                      <BookOpen size={12} color={syllabusId === syl.id ? '#7C3AED' : '#94A3B8'} />
                      <Text style={[s.syllabusChipText, syllabusId === syl.id && { color: '#7C3AED' }]}>
                        {syl.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={s.noSyllabus}>No syllabus found. Select a general board.</Text>
              )}
            </View>

            {/* Section cards */}
            {sections.map((sec, idx) => (
              <View key={sec.id} style={[s.card, { marginTop: 12 }]}>
                <View style={s.secHeader}>
                  <TextInput
                    value={sec.name}
                    onChangeText={v => updateSection(sec.id, 'name', v)}
                    style={s.secNameInput}
                  />
                  <TouchableOpacity onPress={() => removeSection(sec.id)} style={s.secDeleteBtn}>
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View style={s.secFields}>
                  {[
                    { label: 'Questions', field: 'qCount' as keyof SectionRule },
                    { label: 'Marks',     field: 'mark'   as keyof SectionRule },
                    { label: 'Negative',  field: 'negMark' as keyof SectionRule },
                  ].map(({ label, field }) => (
                    <View key={field} style={s.secField}>
                      <Text style={s.secFieldLabel}>{label}</Text>
                      <TextInput
                        value={String(sec[field])}
                        onChangeText={v => updateSection(sec.id, field, parseFloat(v) || 0)}
                        keyboardType="numeric"
                        style={s.secFieldInput}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={s.addSecBtn} onPress={addSection}>
              <Plus size={16} color="#7C3AED" />
              <Text style={s.addSecText}>Add Section</Text>
            </TouchableOpacity>

            {/* Summary */}
            <View style={s.summaryCard}>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{totalQs}</Text>
                <Text style={s.summaryLabel}>Total Questions</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{totalMarks}</Text>
                <Text style={s.summaryLabel}>Total Marks</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryVal}>{duration}m</Text>
                <Text style={s.summaryLabel}>Duration</Text>
              </View>
            </View>

            <TouchableOpacity style={[s.nextBtn, { marginTop: 12 }]} onPress={generateQuestions} disabled={generating}>
              {generating
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <><Sparkles size={16} color="#FFFFFF" /><Text style={s.nextBtnText}>Generate AI Questions</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: Validate ─────────────────────────────── */}
        {step === 3 && (
          <View>
            <View style={[s.card, s.successBanner]}>
              <Check size={24} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={s.successTitle}>AI Generation Complete</Text>
                <Text style={s.successSub}>{aiQuestions.length} questions generated. Review and approve below.</Text>
              </View>
            </View>

            {aiQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[s.qCard, approved.has(i) && s.qCardApproved]}
                onPress={() => {
                  const n = new Set(approved)
                  n.has(i) ? n.delete(i) : n.add(i)
                  setApproved(n)
                }}
                activeOpacity={0.8}
              >
                <View style={[s.qCheck, approved.has(i) && s.qCheckActive]}>
                  {approved.has(i) && <Check size={12} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.qText}>{q.text}</Text>
                  <View style={s.qOptions}>
                    {q.options?.map((o, oi) => (
                      <View key={oi} style={[s.qOption, oi === q.correctIndex && s.qOptionCorrect]}>
                        <Text style={[s.qOptionText, oi === q.correctIndex && { color: '#059669', fontWeight: '700' }]}>
                          {String.fromCharCode(65 + oi)}. {o}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <View style={s.approvedCount}>
              <Shield size={14} color="#7C3AED" />
              <Text style={s.approvedCountText}>{approved.size} / {aiQuestions.length} questions approved</Text>
            </View>

            <TouchableOpacity style={[s.nextBtn, { backgroundColor: '#059669' }]} onPress={publishExam} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <><Shield size={16} color="#FFFFFF" /><Text style={s.nextBtnText}>Publish Exam</Text></>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Blueprint Library Modal */}
      <Modal visible={showBlueprintLib} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBlueprintLib(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Blueprint Library</Text>
            <TouchableOpacity onPress={() => setShowBlueprintLib(false)} style={s.modalClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={s.modalSub}>Standardized exam patterns from global education boards.</Text>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }}>
            {templates.length === 0
              ? <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>No templates available</Text>
              : templates.map(t => (
                <View key={t.id} style={s.tmplCard}>
                  <View style={s.tmplBadge}>
                    <Text style={s.tmplBadgeText}>{t.category?.toUpperCase()}</Text>
                  </View>
                  <Text style={s.tmplName}>{t.name}</Text>
                  <View style={s.tmplMeta}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={s.tmplMetaText}>{t.duration_minutes} min</Text>
                    <Shield size={12} color="#94A3B8" />
                    <Text style={s.tmplMetaText}>{t.total_marks} marks</Text>
                  </View>
                  <TouchableOpacity style={s.tmplBtn} onPress={() => applyTemplate(t)}>
                    <Text style={s.tmplBtnText}>Apply Template</Text>
                    <ChevronRight size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))
            }
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  pageSub: { fontSize: 11, color: '#7C3AED', fontWeight: '600', marginTop: 2 },
  libBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F3FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#DDD6FE' },
  libBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  stepCircleActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  stepCircleDone: { backgroundColor: '#059669', borderColor: '#059669' },
  stepNum: { fontSize: 12, fontWeight: '900', color: '#94A3B8' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#E2E8F0', marginBottom: 12, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#059669' },

  // Card
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 18, lineHeight: 17 },

  // Fields
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: '600', color: '#0F172A', backgroundColor: '#F8FAFC' },
  inputAccent: { borderColor: '#7C3AED' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  toggleSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  // Syllabus
  syllabusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  syllabusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: '#E2E8F0' },
  syllabusChipActive: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  syllabusChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  noSyllabus: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },

  // Section
  secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  secNameInput: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A', borderBottomWidth: 1.5, borderBottomColor: '#E2E8F0', paddingVertical: 6 },
  secDeleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  secFields: { flexDirection: 'row', gap: 10 },
  secField: { flex: 1, alignItems: 'center' },
  secFieldLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  secFieldInput: { width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#0F172A' },
  addSecBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 14, borderWidth: 1.5, borderColor: '#DDD6FE', borderRadius: 16, borderStyle: 'dashed', backgroundColor: '#FAFAFF' },
  addSecText: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },

  // Summary
  summaryCard: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F5F3FF', borderRadius: 16, padding: 14 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '900', color: '#7C3AED' },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  // Step 3
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, marginBottom: 12 },
  successTitle: { fontSize: 14, fontWeight: '900', color: '#065F46' },
  successSub: { fontSize: 12, color: '#059669', fontWeight: '500', marginTop: 2 },
  qCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1.5, borderColor: '#E2E8F0' },
  qCardApproved: { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
  qCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  qCheckActive: { backgroundColor: '#059669', borderColor: '#059669' },
  qText: { fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 19, marginBottom: 8 },
  qOptions: { gap: 4 },
  qOption: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F8FAFC' },
  qOptionCorrect: { backgroundColor: '#ECFDF5' },
  qOptionText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  approvedCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12, marginBottom: 12 },
  approvedCountText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },

  // Next button
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#7C3AED', borderRadius: 16, paddingVertical: 16, marginTop: 20, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 12, elevation: 8 },
  nextBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },

  // Blueprint Modal
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEF2F8' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalSub: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, fontSize: 13, color: '#64748B', fontWeight: '500' },
  tmplCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EEF2F8' },
  tmplBadge: { backgroundColor: '#EBF3FC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  tmplBadgeText: { fontSize: 9, fontWeight: '900', color: '#004B93', letterSpacing: 1 },
  tmplName: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  tmplMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tmplMetaText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tmplBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 12 },
  tmplBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
})
