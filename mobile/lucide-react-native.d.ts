declare module 'lucide-react-native' {
  import { FC } from 'react'
  import { SvgProps } from 'react-native-svg'

  export interface LucideProps extends SvgProps {
    size?: number | string
    color?: any
    stroke?: string
    strokeWidth?: number | string
  }

  export type Icon = FC<LucideProps>

  // ── Core Navigation & UI ────────────────────────────────────────────────
  export const Mail: Icon
  export const Lock: Icon
  export const Eye: Icon
  export const EyeOff: Icon
  export const ArrowRight: Icon
  export const ArrowLeft: Icon
  export const ArrowUpRight: Icon
  export const ChevronRight: Icon
  export const ChevronLeft: Icon
  export const ChevronDown: Icon
  export const ChevronUp: Icon
  export const LayoutDashboard: Icon
  export const LogOut: Icon
  export const Search: Icon
  export const Plus: Icon
  export const X: Icon
  export const Check: Icon
  export const Clock: Icon
  export const Calendar: Icon
  export const Play: Icon
  export const Radio: Icon
  export const Link: Icon
  export const Copy: Icon
  export const Share2: Icon

  // ── User / People ────────────────────────────────────────────────────────
  export const User: Icon
  export const Users: Icon
  export const UserCircle: Icon
  export const UserCircle2: Icon
  export const PlusCircle: Icon

  // ── Files & Storage ──────────────────────────────────────────────────────
  export const File: Icon
  export const FileText: Icon
  export const FolderOpen: Icon
  export const Folder: Icon
  export const Book: Icon
  export const BookOpen: Icon
  export const HardDrive: Icon
  export const Server: Icon
  export const Download: Icon
  export const DownloadCloud: Icon
  export const UploadCloud: Icon
  export const Upload: Icon
  export const ExternalLink: Icon
  export const Filter: Icon
  export const Trash: Icon
  export const Trash2: Icon

  // ── Finance ──────────────────────────────────────────────────────────────
  export const CreditCard: Icon
  export const Wallet: Icon
  export const DollarSign: Icon

  // ── Charts & Analytics ───────────────────────────────────────────────────
  export const BarChart: Icon
  export const BarChart2: Icon
  export const BarChart3: Icon
  export const TrendingUp: Icon

  // ── Education ────────────────────────────────────────────────────────────
  export const GraduationCap: Icon
  export const Award: Icon
  export const Sparkles: Icon
  export const Target: Icon
  export const Zap: Icon
  export const Brain: Icon
  export const BrainCircuit: Icon
  export const Lightbulb: Icon
  export const Calculator: Icon
  export const Microscope: Icon
  export const PenTool: Icon
  export const Globe: Icon
  export const Star: Icon
  export const School: Icon
  export const Video: Icon

  // ── Status & Alerts ──────────────────────────────────────────────────────
  export const Bell: Icon
  export const CheckCircle: Icon
  export const CheckCircle2: Icon
  export const XCircle: Icon
  export const AlertCircle: Icon
  export const AlertTriangle: Icon
  export const HelpCircle: Icon
  export const Shield: Icon
  export const ShieldCheck: Icon
  export const Key: Icon

  // ── Communication ────────────────────────────────────────────────────────
  export const Phone: Icon
  export const PhoneCall: Icon

  // ── Business ─────────────────────────────────────────────────────────────
  export const Building: Icon
  export const Building2: Icon
}
