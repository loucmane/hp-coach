import type { Question } from '@/data/questions'
import { formatPass, formatSitting } from '@/lib/examNames'
import { isP5Qid } from '@/lib/provenance'
import { parsePassage } from './drillCore'
import type { DrillQuestion } from './types'

/** Copy of the prototype adapter, with provenance taken from the product qid. */
export function toDrillQuestion(
  q: Question,
  pages: Record<string, { width: number; height: number }> = {},
): DrillQuestion {
  const authentic = !isP5Qid(q.qid)
  const page = pages[q.qid]
  const kind = q.figure?.kind ?? 'svg'
  return {
    qid: q.qid,
    section: q.section,
    number: q.number,
    prompt: q.prompt,
    answer: q.answer,
    options:
      q.options?.map((o) => ({
        letter: o.letter,
        text: o.text,
        figure: o.figure
          ? {
              src: o.figure.src,
              alt: o.text,
              width: Math.round(1000 * o.figure.aspect_ratio),
              height: 1000,
            }
          : null,
      })) ?? null,
    passage: q.context
      ? {
          ...parsePassage(q.context),
          lang: q.section === 'ELF' ? 'en' : 'sv',
          synthetic: !authentic,
        }
      : null,
    figure: q.figure
      ? {
          src: q.figure.src,
          alt: `${kind === 'raster' ? 'Underlag' : 'Figur'} till uppgift ${q.number}`,
          width: page?.width ?? Math.round(1000 * q.figure.aspect_ratio),
          height: page?.height ?? 1000,
          kind,
        }
      : null,
    math:
      !!q.prompt?.includes('\uE000') || (q.options ?? []).some((o) => o.text.includes('\uE000')),
    source: {
      examId: q.exam_id,
      provpass: q.provpass,
      authentic,
      label: authentic ? `${formatSitting(q.exam_id)} · ${formatPass(q.provpass)}` : 'Övningsfråga',
    },
  }
}
