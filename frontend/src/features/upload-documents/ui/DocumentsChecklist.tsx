import { useRef, useState } from 'react'
import { CheckCircle2, FileText, Landmark, Loader2, Upload } from 'lucide-react'
import { Badge, Button } from '@/shared/ui'
import { requiredDocuments } from '@/entities/document'

type UploadState = { fileName: string; status: 'uploading' | 'done' }

/**
 * Чек-лист документов с загрузкой. МАКЕТ: файл выбирается, но никуда не отправляется —
 * загрузку на сервер делает бэкенд (задача documents в карте задач).
 */
export function DocumentsChecklist({ productCode, isBankClient }: { productCode: string; isBankClient: boolean }) {
  const docs = requiredDocuments(productCode, isBankClient)
  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef<string | null>(null)

  const onFile = (fileName: string) => {
    const id = pending.current
    if (!id) return
    setUploads((u) => ({ ...u, [id]: { fileName, status: 'uploading' } }))
    setTimeout(() => setUploads((u) => ({ ...u, [id]: { fileName, status: 'done' } })), 1200)
  }

  const bankHas = docs.filter((d) => d.status === 'BANK_HAS').length

  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">
        {bankHas} из {docs.length} документов банк уже знает — загружать их не нужно.
      </p>
      <input
        ref={input}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file.name)
          e.target.value = ''
        }}
      />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {docs.map((doc) => {
          const upload = uploads[doc.id]
          return (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-muted">
                {doc.status === 'BANK_HAS' ? <Landmark size={17} /> : <FileText size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  {doc.name}
                  {doc.status === 'OPTIONAL' && <span className="ml-1.5 text-xs font-normal text-ink-soft">необязательно</span>}
                </div>
                <div className="text-xs text-ink-muted">{upload ? upload.fileName : doc.hint}</div>
              </div>
              {doc.status === 'BANK_HAS' ? (
                <Badge tone="success">Уже есть у банка</Badge>
              ) : upload?.status === 'uploading' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <Loader2 size={14} className="animate-spin" /> Загрузка…
                </span>
              ) : upload?.status === 'done' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} /> Загружено
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    pending.current = doc.id
                    input.current?.click()
                  }}
                >
                  <Upload size={14} /> Загрузить
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
