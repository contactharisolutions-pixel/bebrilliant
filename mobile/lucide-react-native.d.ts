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

  export const Mail: Icon
  export const Lock: Icon
  export const Eye: Icon
  export const EyeOff: Icon
  export const ArrowRight: Icon
  export const ArrowLeft: Icon
  export const BookOpen: Icon
  export const Award: Icon
  export const Users: Icon
  export const ChevronRight: Icon
  export const LayoutDashboard: Icon
  export const CreditCard: Icon
  export const LogOut: Icon
  export const Wallet: Icon
  export const Video: Icon
  export const PlusCircle: Icon
  export const Search: Icon
  export const User: Icon
  export const Check: Icon
  export const X: Icon
  export const Clock: Icon
  export const FileText: Icon
  export const Plus: Icon
  export const File: Icon
  export const Trash: Icon
  export const Calendar: Icon
  export const Radio: Icon
  export const Sparkles: Icon
  export const CheckCircle2: Icon
  export const AlertCircle: Icon
  export const CheckCircle: Icon
  export const AlertTriangle: Icon
  export const TrendingUp: Icon
  export const DollarSign: Icon
  export const HelpCircle: Icon
  export const Phone: Icon
  export const Link: Icon
  export const Copy: Icon
  export const Share2: Icon
  export const Play: Icon
}
