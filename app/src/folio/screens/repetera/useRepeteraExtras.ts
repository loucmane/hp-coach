import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { usePileMistakes } from '@/api/hooks/useMistakes'
import { useStats } from '@/api/hooks/useStats'
import { loadBank, type Section } from '@/data/questions'
import { useFirstContentSignal } from '@/lib/motion'
import { useSitting } from '@/stores/examStore'

/** These reads mount only with the lazy overview, never the classic route. */
export function useRepeteraExtras(section?: Section) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  const pile = usePileMistakes(section)
  const stats = useStats()
  const bank = useQuery({
    queryKey: ['folio-repetera-bank'],
    queryFn: loadBank,
    staleTime: Infinity,
  })
  const sitting = useSitting(now)
  useFirstContentSignal()
  return {
    now,
    examDate: sitting.date,
    pileMistakes: pile.data,
    pileError: pile.isError,
    stats: stats.data,
    bank: bank.data,
  }
}
