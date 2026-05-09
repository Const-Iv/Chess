Название проекта: Тренажер шахматных дебютов
Дата создания intake: 2026-05-09 12:45

Статус intake:
- [ ] Не начато
- [x] В процессе
- [ ] Заблокировано
- [ ] Согласовано

Правило:
- Новый проект не переходит к feature/refactor/behavior-change реализации, пока все обязательные пункты ниже не заполнены и не согласованы owner'ом.
- Placeholder-ответы, `TBD`, "заполним потом" и несогласованные допущения считаются blocker.
- Пока проект находится на этапе проверки гипотезы, нельзя считать утвержденными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.

## Product Charter

### Миссия

Формула: `Мы помогаем [кому] получать [какой результат] через [что / как]`.

Ответ:
- Мы помогаем шахматисту-любителю быстрее понимать и запоминать основные дебюты через интерактивные подсказки по ходам, названиям вариантов и типовым планам перехода к миттельшпилю.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "дальше".

Дата:
- 2026-05-09 15:49

### Видение

Формула: `Мы видим будущее, в котором [желаемое состояние мира / рынка], а наш проект - [роль в этом будущем]`.

Ответ:
- Мы видим будущее, в котором шахматист-любитель узнает основные дебютные структуры без зубрежки длинных линий, а проект становится личным навигатором по дебютам от первого хода до понятного миттельшпиля.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 15:49

### Цель проекта

Ответ:
- Сделать личное мини-приложение для изучения основных шахматных дебютов: показывать подсказки на каждый ход, понятные варианты развития, названия вариантов и ориентиры, как играть минимум в 80% типовых случаев от дебюта до миттельшпиля.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "все верно".

Дата:
- 2026-05-09 15:50

### Целевая аудитория

Ответ:
- Primary: owner как шахматист-любитель, который хочет системно выучить основные дебюты.
- Possible later audience: шахматисты-любители, которым нужен простой личный навигатор по дебютам без перегруза теорией.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 15:51

### JTBD

Ответ:
- Когда я играю или изучаю дебют и сталкиваюсь с типовой веткой, я хочу быстро понять правильный следующий ход, название варианта и план дальнейшей игры, чтобы не теряться после первых ходов и уверенно перейти в понятный миттельшпиль.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 15:55

### Статус гипотезы и утверждения решений

Проект проверяет гипотезу или уже подтвержден:
- Проверяет личную гипотезу: поможет ли компактный интерактивный тренажер лучше понимать и помнить основные дебюты.

Какие решения уже явно утверждены:
- Нужно мини-приложение.
- Нужны подсказки для каждого хода.
- Нужны варианты развития.
- Нужны названия вариантов.
- Нужны дебютные правила, принципы и цели, чтобы пользователь понимал смысл ходов.
- Цель обучения: понимать и помнить, как играть минимум в 80% типовых случаев от каждого выбранного дебюта до миттельшпиля.

Какие решения еще нельзя считать утвержденными:
- Полный список дебютов первого релиза.
- Глубина линий и критерий "80% случаев".
- Источник шахматных данных.
- Способ проверки корректности дебютной базы.
- Runtime, stack, дизайн, способ запуска и релиза.
- Нужна ли учетная запись, синхронизация прогресса, аналитика или AI-подсказки.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 15:56

### Продуктовые ограничения

Что нельзя сломать:
- Приложение должно помогать понимать дебюты, а не только зубрить длинные ходы.
- Подсказки не должны выдавать неподтвержденные или случайные названия вариантов как факт.
- Обучение должно объяснять дебютные правила, принципы и цели: зачем развивать фигуры, бороться за центр, заботиться о безопасности короля, выбирать пешечную структуру и переходить к понятному плану.
- Обучение должно вести к понятному миттельшпилю: типовые планы, идеи фигур, пешечные структуры и частые ошибки.
- Личный прогресс и заметки, если появятся, нельзя терять при обновлениях.

Что вне scope первого intake до отдельного approval:
- Онлайн-мультиплеер.
- Игровой движок для полноценной партии против компьютера.
- Коммерческая модель.
- Публичные аккаунты и социальные функции.

Регуляторные / бизнес-рамки:
- Нет специальных регуляторных ограничений на текущем личном этапе.
- Если используются внешние партии, базы или названия вариантов, нужно соблюдать лицензии и явно фиксировать источник.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "все верно" с уточнением про дебютные правила, принципы и цели.

Дата:
- 2026-05-09 15:57

### Сценарии использования

Основной сценарий:
- Пользователь выбирает дебют, делает ход за одну из сторон, видит подсказку "почему этот ход", возможные ответы соперника, названия вариантов, дебютные принципы, цели позиции и план до миттельшпиля.

Adjacent scenarios:
- Быстро повторить один дебют перед партией.
- Разобрать, как называется позиция после уже сделанных ходов.
- Сравнить несколько популярных ответов соперника в одном дебюте.
- Отметить сложные ветки для повторения.

Нежелательные сценарии:
- Приложение перегружает пользователя десятками редких линий без объяснения плана.
- Приложение показывает ход без объяснения идеи.
- Приложение уверенно называет вариант там, где данных не хватает.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "верно".

Дата:
- 2026-05-09 15:58

### Метрики успеха

Пользовательская метрика:
- Пользователь может пройти выбранный набор основных дебютов и для каждой типовой ветки объяснить следующий ход, название варианта, дебютный принцип, цель позиции и план миттельшпиля.

Операционная метрика:
- Для каждого дебюта первого релиза есть проверенная карта линий: ходы, названия вариантов, подсказки, принципы, цели, планы и граница перехода к миттельшпилю.

QA / reliability метрика:
- Для всех зафиксированных линий приложение стабильно показывает ожидаемое название варианта, подсказку и следующий набор допустимых ходов.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 15:59

## Governance / Process

### Source-of-truth файлы

Product charter:
- `.memory-bank/product-charter.md`

Project context:
- `.memory-bank/project-context.md`

Architecture map:
- `.memory-bank/architecture-map.md`

Code rules:
- `.memory-bank/code-rules.md`

QA playbook:
- `.memory-bank/qa-playbook.md`

Operational docs:
- `CODEX_MEMORY.md`, `README.md`, `plans/2026-05-09-1245-project-intake.md`

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:00

### Core / adapters / profiles boundary

Что остается core baseline:
- Starter governance, managed task flow, deterministic QA gates and source-of-truth rules.

Что добавляется через adapters:
- Future chess data import or opening-book source adapter, if needed.
- Future UI/runtime adapter, after stack approval.

Что является product-specific profile:
- Список дебютов, глубина линий, подсказки, названия вариантов, дебютные принципы, цели позиции, учебные сценарии и критерий "80% типовых случаев".

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:01

### Stack / runtime choices

Runtime:
- Локальное web-приложение на Next.js / React для первого личного MVP. Конкретные версии выбираются на implementation-step после проверки актуальной официальной документации.

Package manager:
- `npm`

Test framework:
- Текущий Node test baseline из starter; после появления UI добавить browser smoke для выбора дебюта, ввода линии, подсказки, названия варианта и следующих ходов.

Build command:
- `npm run build`

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:02

### Echo-testing / root capability check

Есть ли неизвестная корневая технология, интеграция, provider, runtime, agent surface, bot/channel, worker или внешний API:
- [x] Да
- [ ] Нет
- [ ] Заблокировано

Что именно неизвестно:
- Источник и формат дебютной базы.
- Способ проверки легальности ходов и соответствия позиции названию варианта.
- Конкретные версии Next.js / React и chess tooling.

Minimal echo-test scenario:
- Узкий spike: `chess.js` для проверки легальности ходов + маленькая вручную проверенная opening-map для линии `1. e4 e5 2. Nf3 Nc6 3. Bb5`.

Входной сигнал / test input:
- `1. e4 e5 2. Nf3 Nc6 3. Bb5`

Ожидаемый minimal observable result:
- Система возвращает позицию как легальную, распознает Spanish / Ruy Lopez, показывает 1-3 типовых продолжения и не использует неподтвержденные данные.

Security boundary: какие secrets, production user data и insecure bypass запрещены:
- Не использовать real secrets.
- Не использовать закрытые или нелицензированные шахматные базы без разрешения.
- Не выдавать AI-generated opening names как факт без проверяемого источника.

Evidence path / где фиксируется результат:
- `Docs/echo-tests/chess-opening-root-capability.md`.

Фактический результат:
- PASS: `npm run echo:chess-opening` legally applied `1. e4 e5 2. Nf3 Nc6 3. Bb5`, produced the expected FEN, mapped the line to Ruy Lopez / Spanish Opening / Spanish Game, and verified `a6`, `Nf6`, `d6` as legal continuations with manually written ideas.

Найденные ограничения:
- Echo-test covers only one manually verified Ruy Lopez seed. Full opening coverage, source licensing, opening-map schema, UI and data import remain future work.

Решение:
- [x] Proceed
- [ ] Blocked
- [ ] Narrow spike
- [ ] Choose alternative

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:04

### Integration / review path

Primary integration path:
- [x] Managed task conveyor
- [ ] Pull Request review
- [ ] Hybrid

When Pull Request review is required:
- Если проект станет публичным, появятся внешние пользователи, платежи, аккаунты, sync данных или broad architecture changes.

When local managed conveyor is enough:
- Для личного MVP, discovery, локальных прототипов, контентной карты дебютов и UI-итераций после intake approval.

Required gates before merge/release:
- `npm run qa:agent`
- Product-specific smoke/browser check after UI exists.
- Echo-test evidence before feature work on unknown root capability.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:04

### QA / release choices

Primary deterministic gate:
- `npm run qa:agent` until product-specific runtime is approved.

Smoke / e2e scope:
- После появления UI: сценарий выбора дебюта, ввода линии, показа подсказки, названия варианта и следующих ходов.

Security gate:
- Secret scan and dependency audit from starter baseline.

Release path:
- Локальный запуск для первого MVP; публичный deploy не утвержден.

Preview / deploy adapter:
- Не утвержден до первого работающего MVP.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:29

### Agent / eval choices

Agent surfaces:
- Codex-assisted product planning and content QA.
- In-app AI is not approved.

Хороший ответ:
- Предлагает дебютные подсказки только с понятным источником или пометкой как draft; объясняет ход простым шахматным языком; показывает принцип, цель позиции и план; не подменяет обучение сухим списком ходов.

Провал:
- Галлюцинирует название варианта, дает неподтвержденный ход как лучший, смешивает редкие линии с основными без приоритета или начинает реализацию до intake approval.

Критичные edge cases:
- Одинаковые первые ходы ведут к нескольким вариантам.
- Пользователь делает неточный или неосновной ход.
- Одна позиция может возникнуть разным порядком ходов.
- Название варианта зависит от источника.

Regression examples / golden prompts:
- "Покажи, что делать в Испанской после 3...a6".
- "Как называется 1. e4 c5 2. Nf3 d6 3. d4?"
- "Сделай подсказку на каждый ход, но не показывай источник".

Minimum pass threshold:
- Все golden prompts проходят без галлюцинаций названий, без неподтвержденных "лучших ходов" и без старта реализации до approval.

Кто владеет eval-набором:
- Owner + Codex until separate owner decision.

Какие evals обязательны перед release:
- Manual rubric eval по golden prompts до публичного release или расширения контента за пределы вручную проверенной карты.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:30

### Memory / rules ownership

Кто может менять charter:
- Owner approval required.

Кто может менять governance rules:
- Owner approval required for durable governance changes.

Как фиксируются operational lessons:
- `CODEX_MEMORY.md` for short operational notes; `.memory-bank/*` for stable rules.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да".

Дата:
- 2026-05-09 16:31

## Capability decisions

Правило:
- Каждый блок ниже сначала получает статус `применимо` или `не применимо`.
- Если блок применим, owner согласует ответы до первой feature/refactor/behavior-change реализации в этой capability area.
- Нельзя переносить provider-specific или stack-specific рецепт в core baseline без отдельного adapter/profile boundary.

### Auth / user identity

Статус применимости:
- [ ] Применимо
- [x] Не применимо для личного локального MVP
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Payments / billing

Статус применимости:
- [ ] Применимо
- [x] Не применимо для личного локального MVP
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Credits / limits

Статус применимости:
- [ ] Применимо
- [x] Не применимо для личного локального MVP
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Analytics / consent

Статус применимости:
- [ ] Применимо
- [x] Не применимо для личного локального MVP
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### i18n / localization

Статус применимости:
- [ ] Применимо
- [x] Не применимо для первого личного MVP; интерфейс и материалы по умолчанию на русском
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Async jobs / workers

Статус применимости:
- [ ] Применимо
- [x] Не применимо для личного локального MVP
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### API documentation

Статус применимости:
- [ ] Применимо
- [x] Не применимо до появления API
- [ ] Заблокировано

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Service layout

Статус применимости:
- [x] Применимо после выбора runtime
- [ ] Не применимо
- [ ] Заблокировано

Product code layout:
- Future Next.js UI: `app/` or `src/app/`, exact scaffold decided on implementation step after official docs check.
- Chess domain logic: `src/domain/chess/`.
- Opening data and manually verified maps: `src/data/openings/`.
- Tests: `tests/` plus browser smoke after UI exists.

Service boundaries:
- First MVP is local and client-first; no backend API, accounts, payments or sync.
- Opening knowledge is versioned local data until a source adapter is approved.

Shared package boundaries:
- No shared packages in first MVP.

Worker / cron / background process boundaries:
- None in first MVP.

Governance-root files that must stay at repo root:
- `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, `README.md`, `plans/*`.

Required QA scenarios:
- `npm run qa:agent`.
- Echo-test for legal move parsing and one manually verified opening-map.
- Browser smoke after UI exists.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

### Runtime-specific rules

Статус применимости:
- [x] Применимо после выбора runtime
- [ ] Не применимо
- [ ] Заблокировано

Runtime / language:
- Next.js / React on Node.js for local web MVP. Exact versions are chosen during implementation after official documentation check.

Dependency manager:
- `npm`

Type / lint expectations:
- Keep deterministic type/lint checks; no `any` in new typed code; no skipped/focused tests.

Runtime safety checks:
- Build must pass before release.
- UI behavior needs browser smoke evidence once UI exists.
- Chess content must not rely on unverified AI-generated facts.

Нужны ли действия после публикации, например перезапуск локальных агентов или сервисов:
- No for the first local MVP.

Как owner согласовал способ выполнения таких действий:
- Not applicable.

Official docs / integration source:
- Official Next.js / React docs and official package docs for chess tooling before implementation.

What must remain adapter/profile-specific:
- Opening source, opening-map format, UI runtime details beyond approved MVP, deploy adapter and any future backend/sync capability.

Required QA scenarios:
- `npm run qa:agent`, echo-test evidence and browser smoke after UI exists.

Статус согласования:
- [ ] Ожидает owner approval
- [x] Согласовано
- [ ] Заблокировано

Подтвердил:
- Owner сообщением "да" по capability decisions.

Дата:
- 2026-05-09 16:32

## Перенос в canonical sources

- [x] `.memory-bank/product-charter.md`
- [x] `.memory-bank/project-context.md`
- [x] `.memory-bank/architecture-map.md`
- [x] `.memory-bank/code-rules.md`
- [x] `.memory-bank/qa-playbook.md`
- [x] `AGENTS.md`
- [x] `CODEX_MEMORY.md`
- [x] `README.md`

## Итоговое подтверждение

- [x] Все обязательные пункты заполнены
- [x] Все обязательные пункты согласованы owner'ом
- [x] Ответы перенесены в canonical sources
- [x] Baseline QA прошел

Итоговый статус:
- [x] Project Intake согласован
- [ ] Project Intake в процессе
- [ ] Project Intake заблокирован

Комментарии / blockers:
- Ответы согласованы owner'ом в bootstrap-диалоге 2026-05-09.
- Canonical transfer выполнен в bootstrap worktree.
- Baseline QA PASS: `npm run qa:agent`.
- Следующий безопасный шаг: echo-test legal move parsing + manually verified opening-map.
- Feature/refactor/behavior-change implementation начинается только после echo-test.
