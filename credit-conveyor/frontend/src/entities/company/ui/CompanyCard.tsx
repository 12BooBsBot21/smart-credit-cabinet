import { Landmark } from 'lucide-react'
import { Badge, Definitions, Section } from '@/shared/ui'
import { formatDate } from '@/shared/lib'
import type { Company } from '../api/companyApi'

/** Реквизиты компании. Клиенту показываем, что вводить их не нужно — банк их уже знает */
export function CompanyCard({ company, title = 'Компания' }: { company: Company; title?: string }) {
  return (
    <Section
      title={title}
      aside={
        company.is_bank_client ? (
          <Badge tone="success">
            <Landmark size={13} className="mr-1" /> Клиент банка
          </Badge>
        ) : (
          <Badge>Новый клиент</Badge>
        )
      }
    >
      <Definitions
        items={[
          ['Название', company.name],
          ['ИНН', company.inn],
          [company.legal_form === 'IP' ? 'ОГРНИП' : 'ОГРН', company.ogrn],
          ['Дата регистрации', formatDate(company.registered_at)],
          ['Вид деятельности', `${company.okved} · ${company.okved_name}`],
          ['Руководитель', company.director],
          ['Регион', company.region],
        ]}
      />
    </Section>
  )
}
