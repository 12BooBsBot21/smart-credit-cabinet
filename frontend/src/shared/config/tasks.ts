/**
 * Реестр задач макета — единый источник для меток на экранах (MockFrame) и страницы «Карта задач» (/map).
 *
 * status:
 *   ready — работает на настоящих данных;
 *   mock  — интерфейс есть, данные фиктивные (mockRequest), нужна реализация;
 *   todo  — в интерфейсе не видно, но нужно для сдачи.
 * Когда блок доделан — меняем статус здесь, метка на экране обновится сама.
 */

export type Owner = 'FE' | 'BE' | 'ML'
export type TaskStatus = 'ready' | 'mock' | 'todo'

export const OWNER_LABEL: Record<Owner, string> = { FE: 'Фронтенд', BE: 'Бэкенд', ML: 'ML' }

export interface TaskEntry {
  id: string
  title: string
  summary: string
  status: TaskStatus
  owners: Owner[]
  /** Где посмотреть в макете */
  where?: { label: string; path: string }
  /** Какие критерии оценки (1–6) и требования кейса закрывает */
  criteria: string
  todo: { owner: Owner; text: string }[]
}

export const TASKS: TaskEntry[] = [
  // --- Уже работает ---
  {
    id: 'core-path',
    title: 'Сквозной путь клиента',
    summary: 'Заявка → проверка → источники → скоринг → решение → подписание → выдача, статусы меняются на глазах.',
    status: 'ready',
    owners: ['FE', 'BE'],
    where: { label: 'Кабинет клиента', path: '/client' },
    criteria: 'Критерии 1, 4 · стр. 13–15',
    todo: [],
  },
  {
    id: 'scoring-rules',
    title: 'Скоринг и правила решения',
    summary: 'Балльная карта из 11 признаков → грейд A–E; правила поверх грейда и продукта дают 4 исхода.',
    status: 'ready',
    owners: ['BE', 'ML'],
    where: { label: 'Карточка андеррайтера', path: '/bank' },
    criteria: 'Критерии 1, 5 · стр. 14–15',
    todo: [{ owner: 'ML', text: 'Проверить веса балльной карты, описать модель в docs/scoring.md' }],
  },
  {
    id: 'underwriter-card',
    title: 'Рабочее место андеррайтера',
    summary: 'Очередь ручной проверки, карточка с показателями, ответами источников, разбором скоринга и журналом.',
    status: 'ready',
    owners: ['FE', 'BE'],
    where: { label: 'Очередь заявок', path: '/bank' },
    criteria: 'Критерий 3 · «банк управляет процессом», стр. 2',
    todo: [],
  },
  {
    id: 'product-picker',
    title: 'Подбор продукта по задаче + глоссарий',
    summary: 'Клиент выбирает задачу бизнеса, продукты ранжируются с объяснением «почему подходит»; термины с подсказками.',
    status: 'ready',
    owners: ['FE'],
    where: { label: 'Новая заявка', path: '/client/applications/new' },
    criteria: 'Критерий 3 · пользователь без банковской экспертизы, стр. 5',
    todo: [
      { owner: 'FE', text: 'Уточнить правила ранжирования, добавить вопрос про сумму' },
      { owner: 'BE', text: 'Опционально: перенести описания продуктов из фронтенда в каталог API' },
    ],
  },
  {
    id: 'contract-preview',
    title: 'Превью договора перед подписанием',
    summary: 'Текст договора собирается из принятого предложения — клиент видит, что подписывает.',
    status: 'ready',
    owners: ['FE'],
    where: { label: 'Шаг подписания', path: '/client' },
    criteria: 'Критерий 3 · «документы и финансирование», стр. 13',
    todo: [{ owner: 'BE', text: 'Опционально: генерация PDF договора на сервере' }],
  },

  // --- Макет: интерфейс есть, нужна реализация ---
  {
    id: 'client-feed',
    title: 'Лента под клиента',
    summary: 'Новости и подсказки, подобранные по ОКВЭД, региону, сезонности и статусу заявок, с пометкой «почему показано».',
    status: 'mock',
    owners: ['BE', 'FE'],
    where: { label: 'Главная клиента', path: '/client' },
    criteria: 'Стр. 7: «покажите, как изменяется новостная лента под клиента» · критерий 3',
    todo: [
      { owner: 'BE', text: 'GET /api/feed: синтетические новости с тегами (ОКВЭД, регион, сезонность, статус), поле reason' },
      { owner: 'FE', text: 'Заменить mockRequest в entities/feed на http.get' },
      { owner: 'ML', text: 'Опционально: ранжирование ленты по профилю клиента' },
    ],
  },
  {
    id: 'notifications',
    title: 'Колокольчик уведомлений',
    summary: 'Уведомления внутри продукта вместо email и SMS. Статусы заявок настоящие, отметка «прочитано» — в браузере.',
    status: 'mock',
    owners: ['BE', 'FE'],
    where: { label: 'Шапка кабинета клиента', path: '/client' },
    criteria: 'Огр. 5: без email и SMS · критерий 4',
    todo: [
      { owner: 'BE', text: 'GET /api/notifications из журнала событий, POST /api/notifications/read, поле users.last_seen_event_id' },
      { owner: 'FE', text: 'Перевести колокольчик на API, показывать текст события' },
    ],
  },
  {
    id: 'documents',
    title: 'Документы заявки',
    summary: 'Чек-лист документов под продукт: часть «уже есть у банка», остальное клиент загружает; андеррайтер их видит.',
    status: 'mock',
    owners: ['BE', 'FE'],
    where: { label: 'Новая заявка → шаг 3', path: '/client/applications/new' },
    criteria: 'Стр. 12: «работа с заявкой, данными и документами» · критерий 1',
    todo: [
      { owner: 'BE', text: 'Модель Document, POST /api/applications/{id}/documents (multipart), хранение в томе, список требований по продукту' },
      { owner: 'FE', text: 'Отправка файлов с прогрессом, просмотр в карточке андеррайтера' },
    ],
  },
  {
    id: 'ai-explanation',
    title: 'Объяснение решения от ИИ',
    summary: 'Клиенту простыми словами: почему такое решение и что делать дальше. Сейчас текст собирается шаблоном.',
    status: 'mock',
    owners: ['ML', 'BE'],
    where: { label: '«Что дальше» в заявке клиента', path: '/client' },
    criteria: 'Стр. 12: ИИ с понятной ценностью · критерии 3, 6',
    todo: [
      { owner: 'ML', text: 'LLM с открытыми весами (Ollama + Qwen3-4B), промпт, шаблон-фолбэк' },
      { owner: 'BE', text: 'Шаг конвейера explain, таблица ai_texts, поле ai_explanation в ответе API' },
    ],
  },
  {
    id: 'ai-summary',
    title: 'Резюме заявки от ИИ для андеррайтера',
    summary: '«Что важно» и «на что обратить внимание» в 5–7 строках — экономит время ручной проверки.',
    status: 'mock',
    owners: ['ML', 'BE'],
    where: { label: 'Карточка андеррайтера', path: '/bank' },
    criteria: 'Стр. 12: ИИ с понятной ценностью · критерий 6',
    todo: [
      { owner: 'ML', text: 'Промпт по фактам, скорингу и правилам; числа подставляются из данных, а не генерируются' },
      { owner: 'BE', text: 'Поле ai_summary в карточке банка, профиль ai в docker-compose' },
    ],
  },
  {
    id: 'ml-second-opinion',
    title: 'Второе мнение ML-модели',
    summary: 'Вероятность дефолта и вклад признаков рядом с балльной картой. На решение не влияет — подсвечивает расхождения.',
    status: 'mock',
    owners: ['ML', 'BE'],
    where: { label: 'Карточка андеррайтера', path: '/bank' },
    criteria: 'Критерии 5, 6 · модель champion/challenger',
    todo: [
      { owner: 'ML', text: 'Синтетический датасет, логистическая регрессия, экспорт коэффициентов, карточка модели docs/ml-model.md' },
      { owner: 'BE', text: 'Инференс чистым Python в домене, поле second_opinion в карточке банка' },
    ],
  },
  {
    id: 'bank-dashboard',
    title: 'Дашборд конвейера',
    summary: 'Заявки по статусам, доля автоматических решений, время решения, причины отказов — банк управляет процессом.',
    status: 'mock',
    owners: ['BE', 'FE'],
    where: { label: 'Дашборд', path: '/bank/dashboard' },
    criteria: 'Стр. 4: «поддерживать эффективную работу банка» · критерии 3, 5',
    todo: [
      { owner: 'BE', text: 'GET /api/bank/stats по журналу событий; seed --history с 40–60 историческими заявками' },
      { owner: 'FE', text: 'Перевести дашборд на API' },
    ],
  },
  {
    id: 'queue-sla',
    title: '«Взять в работу» и SLA в очереди',
    summary: 'Андеррайтер берёт заявку на себя, видно, сколько времени осталось до срока.',
    status: 'mock',
    owners: ['BE', 'FE'],
    where: { label: 'Очередь заявок', path: '/bank' },
    criteria: 'Критерии 3, 5 · несколько сотрудников банка',
    todo: [
      { owner: 'BE', text: 'Поле applications.assignee_id, POST /api/bank/applications/{id}/take, срок SLA в настройках' },
      { owner: 'FE', text: 'Колонка «Ответственный», кнопка «Взять», фильтр «Мои»' },
    ],
  },

  // --- Не видно в интерфейсе, но нужно для сдачи ---
  {
    id: 'docker-ci',
    title: 'Docker и CI',
    summary: 'docker compose up на чистой машине; GitHub Actions: тесты, линтеры, e2e-прогон сценария в браузере.',
    status: 'todo',
    owners: ['BE'],
    criteria: 'Критерий 2 · стр. 7: запуск одной командой',
    todo: [
      { owner: 'BE', text: 'Проверить docker compose на чистой машине, исправить теги образов' },
      { owner: 'BE', text: '.github/workflows/ci.yml: ruff + pytest, eslint + build, e2e на Playwright' },
    ],
  },
  {
    id: 'jury-docs',
    title: 'Документы для жюри',
    summary: 'Исследование (JTBD, персоны), модель процесса, тест-сценарии, описание API, решения и путь развития.',
    status: 'todo',
    owners: ['FE', 'BE', 'ML'],
    criteria: 'Задачи 1–2 кейса · стр. 7: обязательные артефакты · критерий 6',
    todo: [
      { owner: 'FE', text: 'docs/research.md и docs/process-model.md' },
      { owner: 'BE', text: 'docs/test-scenarios.md, docs/api.md по фактическому API' },
      { owner: 'ML', text: 'docs/scoring.md и docs/ml-model.md' },
    ],
  },
  {
    id: 'demo',
    title: 'Защита: сценарий, презентация, видео',
    summary: 'Сценарий демо на 5–7 минут, 7–10 слайдов, резервная запись прохода.',
    status: 'todo',
    owners: ['FE', 'BE', 'ML'],
    criteria: 'Все критерии',
    todo: [{ owner: 'FE', text: 'Сценарий демо и презентация; запись резервного видео' }],
  },
]

export const taskById = (id: string) => TASKS.find((t) => t.id === id)
