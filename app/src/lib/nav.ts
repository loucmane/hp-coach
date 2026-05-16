// Bottom-tab → route mapping. One place so it can't drift between screens.

import type { TabKey } from '@/components/MobileFrame'

export const TAB_ROUTE: Record<TabKey, '/' | '/drill' | '/lektion' | '/coach' | '/progress'> = {
  home: '/',
  drill: '/drill',
  lektion: '/lektion',
  coach: '/coach',
  progress: '/progress',
}
