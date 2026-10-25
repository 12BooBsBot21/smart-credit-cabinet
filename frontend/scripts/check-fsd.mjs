// Проверка правил Feature-Sliced Design: npm run lint:fsd
// 1. Слой импортирует только из слоёв ниже: app → pages → widgets → features → entities → shared.
// 2. Соседние слайсы одного слоя друг друга не импортируют.
// 3. Чужой слайс — только через его public API (index.ts): @/layer/slice, без вложенных путей.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app']
const SRC = new URL('../src', import.meta.url).pathname

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(ts|tsx)$/.test(name)) yield path
  }
}

const problems = []
for (const file of files(SRC)) {
  const [layer] = relative(SRC, file).split(sep)
  if (!LAYERS.includes(layer)) continue
  for (const [, target] of readFileSync(file, 'utf8').matchAll(/from '@\/([^']+)'/g)) {
    const [targetLayer, ...rest] = target.split('/')
    const where = `${relative(SRC, file)}: @/${target}`
    if (LAYERS.indexOf(targetLayer) > LAYERS.indexOf(layer)) problems.push(`${where} — импорт из верхнего слоя`)
    else if (targetLayer === layer && !['shared', 'app'].includes(layer)) problems.push(`${where} — импорт из соседнего слайса`)
    else if (rest.length > 1) problems.push(`${where} — импорт в обход public API`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('FSD: нарушений нет')
