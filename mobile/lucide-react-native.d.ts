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
}
