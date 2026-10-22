import type { ShellInput } from '../contract/viewModel'
import { fmtScore, inWords, roundMinutes } from '../lib/format'
import type { Destination } from '../nav'

export function shellSubtitles(input: ShellInput): Record<Destination, string> {
  const { plan, resume, dueNow, dueToday, repetition, provpass, lesson, prognosis } = input
  const done = plan?.filter((item) => item.completed).length ?? 0
  const first = plan?.find((item) => !item.completed)
  return {
    idag: resume
      ? `Fortsätt ${resume.subject}, ${resume.progress}`
      : first
        ? done > 0
          ? `${done} av ${plan?.length} steg klara`
          : `Först: ${first.title}`
        : plan?.length
          ? 'Allt i dagens plan är gjort'
          : 'Dagens plan',
    ova:
      dueNow > 0
        ? `${dueNow} redo · ${roundMinutes(dueNow, repetition)} min`
        : dueToday > 0
          ? 'Missar blir redo senare idag'
          : 'Alla delprov och Repetera',
    provpass: !provpass
      ? 'Ett helt pass, 55 minuter'
      : provpass.due || provpass.daysUntilNext <= 0
        ? `Dags för ett pass: ${provpass.half}`
        : `Nästa: ${provpass.half}, om ${inWords(provpass.daysUntilNext)} ${provpass.daysUntilNext === 1 ? 'dag' : 'dagar'}`,
    uppslag: lesson?.title ? `${lesson.section} · ${lesson.title}` : 'Lektioner och ramverk',
    framsteg: prognosis != null ? `Prognos ${fmtScore(prognosis)} av 2,0` : 'Prognos och historik',
  }
}
