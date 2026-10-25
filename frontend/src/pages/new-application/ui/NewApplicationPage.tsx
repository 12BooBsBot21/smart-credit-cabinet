import { useState } from 'react'
import { Alert, MockFrame, Section, Spinner } from '@/shared/ui'
import { ProductCard, ProductDetails, useProducts } from '@/entities/product'
import { useMyCompany } from '@/entities/company'
import { CreateApplicationForm } from '@/features/create-application'
import { NeedSelector, rankProducts, type NeedAnswers } from '@/features/pick-product'
import { DocumentsChecklist } from '@/features/upload-documents'

export function NewApplicationPage() {
  const products = useProducts()
  const company = useMyCompany()
  const [answers, setAnswers] = useState<NeedAnswers>({ goal: null, regular: null, hasPledge: null })
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  if (products.isPending || company.isPending) return <Spinner />
  if (products.error || company.error) return <Alert tone="danger">{(products.error ?? company.error)?.message}</Alert>

  // Пока задача не выбрана — показываем каталог как есть, после выбора — ранжируем
  const ranked = answers.goal
    ? rankProducts(products.data, answers, company.data)
    : products.data.map((product) => ({ product, match: undefined }))
  const selected = products.data.find((p) => p.code === selectedCode)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Новая заявка</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Расскажите, что нужно бизнесу, — подберём продукт. Данные о компании банк уже знает.
        </p>
      </div>

      <MockFrame taskId="product-picker">
        <Section title="1. Что нужно бизнесу?">
          <NeedSelector value={answers} onChange={setAnswers} />
        </Section>
      </MockFrame>

      <section>
        <h2 className="label mb-3">2. {answers.goal ? 'Подходящие продукты' : 'Все продукты'}</h2>
        <div className="grid gap-4 pt-2 md:grid-cols-3">
          {ranked.map(({ product, match }, index) => (
            <ProductCard
              key={product.code}
              product={product}
              match={match}
              best={!!match && index === 0 && match.score >= 60}
              selected={product.code === selectedCode}
              onSelect={() => setSelectedCode(product.code)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <Section title={`3. Условия · ${selected.name}`}>
          <div className="space-y-6">
            <ProductDetails product={selected} />
            <p className="text-sm text-ink-muted">
              Заявка от {company.data.name}, ИНН {company.data.inn}.
            </p>
            {/* key сбрасывает форму при смене продукта */}
            <CreateApplicationForm
              key={selected.code}
              product={selected}
              company={company.data}
              beforeSubmit={
                <MockFrame taskId="documents">
                  <div className="pt-2">
                    <h3 className="mb-1 text-sm font-semibold text-ink">Документы</h3>
                    <DocumentsChecklist productCode={selected.code} isBankClient={company.data.is_bank_client} />
                  </div>
                </MockFrame>
              }
            />
          </div>
        </Section>
      )}
    </div>
  )
}
