// victory-native v41 — Skia-based CartesianChart API
declare module 'victory-native' {
  import { FC, ReactNode } from 'react'

  export interface ChartPoint {
    x: number
    y: number
  }

  export interface ChartBounds {
    left: number
    right: number
    top: number
    bottom: number
  }

  export interface CartesianChartChildrenProps<TData extends Record<string, number>> {
    points: Record<keyof TData, ChartPoint[]>
    chartBounds: ChartBounds
  }

  export interface CartesianChartProps<TData extends Record<string, unknown>> {
    data: TData[]
    xKey: keyof TData
    yKeys: (keyof TData)[]
    axisOptions?: {
      tickCount?: { x?: number; y?: number } | number
      labelStyle?: object
      lineColor?: string
      lineWidth?: number
    }
    style?: object
    children: (props: CartesianChartChildrenProps<any>) => ReactNode
  }

  export function CartesianChart<TData extends Record<string, unknown>>(
    props: CartesianChartProps<TData>
  ): JSX.Element

  export interface LineProps {
    points: ChartPoint[]
    color?: string
    strokeWidth?: number
    animate?: { type: 'timing' | 'spring'; duration?: number }
    curveType?: 'linear' | 'cardinal' | 'natural' | 'step'
    connectMissingData?: boolean
  }

  export function Line(props: LineProps): JSX.Element

  export interface BarProps {
    points: ChartPoint[]
    chartBounds: ChartBounds
    color?: string
    innerPadding?: number
    animate?: { type: 'timing' | 'spring'; duration?: number }
    roundedCorners?: {
      topLeft?: number
      topRight?: number
      bottomLeft?: number
      bottomRight?: number
    }
  }

  export function Bar(props: BarProps): JSX.Element

  export interface AreaProps extends LineProps {
    chartBounds: ChartBounds
    startY?: number
  }

  export function Area(props: AreaProps): JSX.Element

  // Chart hooks
  export function useChartPressState<T extends Record<string, number>>(
    initialState: T
  ): { state: T; isActive: boolean }
}
