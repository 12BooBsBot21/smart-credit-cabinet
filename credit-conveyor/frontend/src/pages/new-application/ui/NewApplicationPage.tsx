import { useState } from 'react'
import { Alert, Section, Spinner } from '@/shared/ui'
import { ProductCard, useProducts } from '@/entities/product'
import { useMyCompany } from '@/entities/company'
import { CreateApplicationForm } from '@/features/create-application'

export function NewApplicationPage() {
  const products = useProducts()
  const company = useMyCompany()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const selected = products.data?.find((p) => p.code === selectedCode)

  if (products.isPending || company.isPending) return <Spinner />
  if (products.error || company.error) return <Alert tone="danger">{(products.error ?? company.error)?.message}</Alert>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Новая заявка</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Выберите продукт и заполните три поля — данные о компании банк уже знает.
        </p>
      </div>

      <section>
        <h2 className="label mb-3">1. Продукт</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {products.data.map((product) => (
            <ProductCard
              key={product.code}
              product={product}
              selected={product.code === selectedCode}
              onSelect={() => setSelectedCode(product.code)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <Section title={`2. Условия · ${selected.name}`}>
          <p className="mb-4 text-sm text-ink-muted">
            Заявка от {company.data.name}, ИНН {company.data.inn}.
          </p>
          {/* key сбрасывает форму при смене продукта */}
          <CreateApplicationForm key={selected.code} product={selected} company={company.data} />
        </Section>
      )}
    </div>
  )
}
