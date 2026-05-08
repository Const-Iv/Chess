Название проекта: <Название проекта>
Дата создания intake: <YYYY-MM-DD HH:MM>

Статус intake (отметить один пункт):
- [x] Не начато
- [ ] В процессе
- [ ] Заблокировано
- [ ] Согласовано

Правило:
- Новый проект не переходит к feature/refactor/behavior-change реализации, пока все обязательные пункты ниже не заполнены и не согласованы owner'ом.
- Placeholder-ответы, `TBD`, “заполним потом” и несогласованные допущения считаются blocker.
- Пока проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.

Product Charter:

Миссия:
- Отвечает на вопросы: зачем проект существует; для кого работает; какую проблему решает; какую пользу создаёт.
- Формула: `Мы помогаем [кому] получать [какой результат] через [что / как]`.
- Ответ:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Видение:
- Отвечает на вопросы: куда проект идёт; каким хочет стать; какой рынок, привычку или способ работы хочет изменить; как выглядит успех через 3-10 лет.
- Формула: `Мы видим будущее, в котором [желаемое состояние мира / рынка], а наш проект — [роль в этом будущем]`.
- Ответ:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Цель проекта:
- Ответ:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Целевая аудитория:
- Ответ:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

JTBD:
- Ответ:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Статус гипотезы и утверждения решений:
- Проект проверяет гипотезу или уже подтверждён:
- Какие решения уже явно утверждены:
- Какие решения ещё нельзя считать утверждёнными:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Продуктовые ограничения:
- Что нельзя сломать:
- Что вне scope:
- Регуляторные / бизнес-рамки:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Сценарии использования:
- Основной сценарий:
- Adjacent scenarios:
- Нежелательные сценарии:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Метрики успеха:
- Пользовательская метрика:
- Операционная метрика:
- QA / reliability метрика:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Governance / Process:

Source-of-truth файлы:
- Product charter:
- Project context:
- Architecture map:
- Code rules:
- QA playbook:
- Operational docs:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Core / adapters / profiles boundary:
- Что остаётся core baseline:
- Что добавляется через adapters:
- Что является product-specific profile:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Stack / runtime choices:
- Runtime:
- Package manager:
- Test framework:
- Build command:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Echo-testing / root capability check:
- Есть ли неизвестная корневая технология, интеграция, provider, runtime, agent surface, bot/channel, worker или внешний API: [ ] Да [ ] Нет [ ] Заблокировано
- Что именно неизвестно:
- Minimal echo-test scenario:
- Входной сигнал / test input:
- Ожидаемый minimal observable result:
- Security boundary: какие secrets, production user data и insecure bypass запрещены:
- Evidence path / где фиксируется результат:
- Фактический результат:
- Найденные ограничения:
- Решение: [ ] Proceed [ ] Blocked [ ] Narrow spike [ ] Choose alternative
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

QA / release choices:
- Primary deterministic gate:
- Smoke / e2e scope:
- Security gate:
- Release path:
- Preview / deploy adapter:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Agent / eval choices:
- Agent surfaces:
- Хороший ответ:
- Провал:
- Критичные edge cases:
- Regression examples / golden prompts:
- Minimum pass threshold:
- Кто владеет eval-набором:
- Какие evals обязательны перед release:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Memory / rules ownership:
- Кто может менять charter:
- Кто может менять governance rules:
- Как фиксируются operational lessons:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Capability decisions (заполнять, если применимо):

Правило:
- Каждый блок ниже сначала получает статус `применимо` или `не применимо`.
- Если блок применим, owner согласует ответы до первой feature/refactor/behavior-change реализации в этой capability area.
- Нельзя переносить provider-specific или stack-specific рецепт в core baseline без отдельного adapter/profile boundary.

Auth / user identity:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Кто входит в продукт и зачем:
- Provider / identity source:
- Token/session storage strategy:
- Refresh / rotation / revocation policy:
- Logout / account disconnect behavior:
- CSRF / OAuth state / replay protection:
- Sensitive data boundaries:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Payments / billing:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Что пользователь покупает:
- Currency / market assumptions:
- Provider selection rule:
- Webhook verification strategy:
- Idempotency key / transaction id policy:
- Refund / cancellation behavior:
- Audit trail:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Credits / limits:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Что измеряется и почему:
- Balance source of truth:
- Precision / rounding policy:
- Pre-execution check:
- Spend / refund / correction policy:
- Race condition protection:
- User-visible balance / history:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Analytics / consent:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Какие решения нужно измерять:
- Event catalog owner:
- Consent / cookie policy:
- Provider selection rule:
- Failure isolation policy:
- Data retention / privacy boundaries:
- Reject / accept / withdrawal scenarios:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

i18n / localization:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Supported locales:
- Default locale / fallback rule:
- Locale selection strategy:
- Translation source of truth:
- Metadata / SEO / routing policy:
- Translation completeness check:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Async jobs / workers:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Какие операции долгие или отложенные:
- Job lifecycle statuses:
- Retry / backoff policy:
- Cancellation policy:
- Idempotency / duplicate handling:
- Concurrency / locking choice:
- User-visible progress:
- Failure alerting:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

API documentation:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- API audience:
- Documentation source of truth:
- Human-readable docs path:
- Agent-readable docs path:
- Freshness / generation policy:
- Public / private boundary:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Service layout:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Product code layout:
- Service boundaries:
- Shared package boundaries:
- Worker / cron / background process boundaries:
- Governance-root files that must stay at repo root:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Runtime-specific rules:
- Статус применимости: [ ] Применимо [ ] Не применимо [ ] Заблокировано
- Runtime / language:
- Dependency manager:
- Type / lint expectations:
- Runtime safety checks:
- Нужны ли действия после публикации, например перезапуск локальных агентов или сервисов:
- Как owner согласовал способ выполнения таких действий:
- Official docs / integration source:
- What must remain adapter/profile-specific:
- Required QA scenarios:
- Статус согласования: [ ] Ожидает owner approval [ ] Согласовано [ ] Заблокировано
- Подтвердил:
- Дата:

Перенос в canonical sources:
- [ ] `.memory-bank/product-charter.md`
- [ ] `.memory-bank/project-context.md`
- [ ] `.memory-bank/architecture-map.md`
- [ ] `.memory-bank/code-rules.md`
- [ ] `.memory-bank/qa-playbook.md`
- [ ] `AGENTS.md`
- [ ] `CODEX_MEMORY.md`
- [ ] `README.md`
- [ ] Другие релевантные файлы:

Итоговое подтверждение:
- [ ] Все обязательные пункты заполнены
- [ ] Все обязательные пункты согласованы owner'ом
- [ ] Ответы перенесены в canonical sources
- [ ] Baseline QA прошёл

Итоговый статус:
- [ ] Project Intake согласован
- [ ] Project Intake заблокирован

Комментарии / blockers:
-

## Shared Starter Baseline Rules

- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
