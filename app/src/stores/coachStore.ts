// Coach-voice store.
//
// PRD § 3.3 / § 4: voice is selected once at onboarding and rarely
// changed. Three options: kompis (warm, "vi"-form), professor (calm
// pedagog), taktiker (direct, default). All UI strings flow through
// the VOICE table in lib/voice.ts using whatever's selected here.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { CoachKey } from '@/lib/voice'

type CoachState = {
  coach: CoachKey
  setCoach: (coach: CoachKey) => void
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      coach: 'taktiker',
      setCoach: (coach) => set({ coach }),
    }),
    { name: 'hpc-coach' },
  ),
)
