import { FileText, Landmark } from 'lucide-react'
import { Badge } from '@/shared/ui'
import type { RequiredDocument } from '../model/documents'

/** Документы заявки глазами андеррайтера. В макете список строится из требований продукта */
export function DocumentList({ documents }: { documents: RequiredDocument[] }) {
  return (
    <ul className="divide-y divide-line">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-muted">
            {doc.status === 'BANK_HAS' ? <Landmark size={16} /> : <FileText size={16} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">{doc.name}</div>
            <div className="text-xs text-ink-muted">{doc.hint}</div>
          </div>
          {doc.status === 'BANK_HAS' ? (
            <Badge tone="success">из данных банка</Badge>
          ) : doc.status === 'REQUIRED' ? (
            <Badge tone="progress">загружен клиентом</Badge>
          ) : (
            <Badge>не приложен</Badge>
          )}
        </li>
      ))}
    </ul>
  )
}
