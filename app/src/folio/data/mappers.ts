import type { ShellInput } from '../contract/viewModel'
import { fmtScore, inWords, roundMinutes } from '../lib/format'
import type { RailDestination } from '../nav'

export function shellSubtitles(
  input: ShellInput,
  prognosisBand: number | null = null,
): Record<RailDestination, string> {
  const { plan, resume, dueNow, dueToday, repetition, provpass, lesson, prognosis } = input
  const done = plan?.filter((item) => item.completed).length ?? 0
  const first = plan?.find((item) => !item.completed)
  // Match Framsteg's displayed precision and the 0–2 score scale.
  const range =
    prognosis != null && prognosisBand != null
      ? `${fmtScore(Math.max(0, prognosis - Math.max(0.1, prognosisBand)))}–${fmtScore(Math.min(2, prognosis + Math.max(0.1, prognosisBand)))}`
      : null
  const resumeLine = resume
    ? resume.progress === 'pågående lektion'
      ? `Fortsätt ${resume.subject}`
      : `Fortsätt ${resume.subject}, ${resume.progress}`
    : null
  const estimate =
    repetition &&
    repetition.count > 0 &&
    repetition.minutes > 0 &&
    Number.isFinite(repetition.count) &&
    Number.isFinite(repetition.minutes)
      ? ` · ca ${roundMinutes(dueNow, repetition)} min`
      : ''
  return {
    idag: resumeLine
      ? resumeLine
      : first
        ? done > 0
          ? `${done} av ${plan?.length} steg klara`
          : `Först: ${first.title}`
        : plan?.length
          ? 'Allt i dagens plan är gjort'
          : 'Dagens plan',
    ova:
      resume?.href && /^\/(drill|ova|diagnostik)([/?#]|$)/.test(resume.href) && resumeLine
        ? resumeLine
        : 'Alla delprov',
    repetera:
      dueNow > 0
        ? `${dueNow} redo${estimate}`
        : dueToday > 0
          ? 'Kommer tillbaka senare'
          : 'Frågor som kommer tillbaka',
    provpass: !provpass
      ? 'Ett helt pass, 55 minuter'
      : provpass.due || provpass.daysUntilNext <= 0
        ? `Dags för ett pass: ${provpass.half}`
        : `Nästa: ${provpass.half}, om ${inWords(provpass.daysUntilNext)} ${provpass.daysUntilNext === 1 ? 'dag' : 'dagar'}`,
    uppslag: lesson?.title ? `${lesson.section} · ${lesson.title}` : 'Lektioner och ramverk',
    framsteg: range ? `Prognos ${range}` : 'Prognos och historik',
    historik: resume
      ? `Pågår: ${resume.subject}${resume.progress === 'pågående lektion' ? '' : ` · ${resume.progress}`}`
      : input.practicePasses != null
        ? `${input.practicePasses} övningspass`
        : 'Dina pass och svar',
  }
}
