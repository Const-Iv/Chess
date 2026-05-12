## Scope

These rules apply to the whole repository.

## Product Charter (Mandatory)

Канонический product source of truth: `.memory-bank/product-charter.md`.

Правило формулировки миссии и видения:
- Миссия отвечает на вопросы “зачем существуем”, “для кого работаем”, “какую проблему решаем”, “какую пользу создаём”; это про настоящее и смысл деятельности. Формула: `Мы помогаем [кому] получать [какой результат] через [что / как]`.
- Видение отвечает на вопросы “куда идём”, “какими хотим стать”, “какой рынок, привычку или способ работы хотим изменить”, “как выглядит успех через 3–10 лет”; это про будущее и амбицию. Формула: `Мы видим будущее, в котором [желаемое состояние мира / рынка], а наш проект - [роль в этом будущем]`.
- Для новых downstream-проектов mission/vision в Project Intake нужно проверять по этим вопросам и формулам до переноса в canonical sources; миссия и видение не создаются на уровне отдельных задач.

Миссия:
- Мы помогаем шахматисту-любителю быстрее понимать и запоминать основные дебюты через интерактивные подсказки по ходам, названиям вариантов и типовым планам перехода к миттельшпилю.

Видение:
- Мы видим будущее, в котором шахматист-любитель узнает основные дебютные структуры без зубрежки длинных линий, а проект становится личным навигатором по дебютам от первого хода до понятного миттельшпиля.

Цель проекта:
- Сделать личное мини-приложение для изучения основных шахматных дебютов: показывать подсказки на каждый ход, понятные варианты развития, названия вариантов и ориентиры, как играть минимум в 80% типовых случаев от дебюта до миттельшпиля.

Целевая аудитория:
- Primary: owner как шахматист-любитель, который хочет системно выучить основные дебюты.
- Possible later audience: шахматисты-любители, которым нужен простой личный навигатор по дебютам без перегруза теорией.

JTBD:
- Когда я играю или изучаю дебют и сталкиваюсь с типовой веткой, я хочу быстро понять правильный следующий ход, название варианта и план дальнейшей игры, чтобы не теряться после первых ходов и уверенно перейти в понятный миттельшпиль.

Продуктовые ограничения:
- Приложение должно помогать понимать дебюты, а не только зубрить длинные ходы.
- Подсказки не должны выдавать неподтвержденные или случайные названия вариантов как факт.
- Обучение должно объяснять дебютные правила, принципы и цели: зачем развивать фигуры, бороться за центр, заботиться о безопасности короля, выбирать пешечную структуру и переходить к понятному плану.
- Обучение должно вести к понятному миттельшпилю: типовые планы, идеи фигур, пешечные структуры и частые ошибки.
- Личный прогресс и заметки, если появятся, нельзя терять при обновлениях.
- Если используются внешние партии, базы или названия вариантов, нужно соблюдать лицензии и явно фиксировать источник.
- Нельзя выдавать AI-generated opening names или "лучшие ходы" как факт без проверяемого источника.

Product Charter Gate:
- Перед любым продуктовым решением, feature, behavior, process или governance изменением нужно сначала прочитать `.memory-bank/product-charter.md` целиком и сверить решение с миссией, видением, целью, целевой аудиторией и `JTBD`.
- Feature, behavior, process и governance изменения должны явно показывать, какую часть миссии, видения, цели, целевой аудитории или `JTBD` они поддерживают. Maintenance-изменения должны явно сохранять charter.
- Нельзя реализовывать изменение, которое противоречит `.memory-bank/product-charter.md`, превращает продукт в справочник ходов без объяснения принципов/целей, ослабляет deterministic QA, safe task flow или source-of-truth governance.
- В Plan mode все уточняющие вопросы, варианты выбора и рекомендации ассистента должны быть отфильтрованы через Product Charter; recommended option обязан явно сохранять или усиливать миссию, видение, цель, целевую аудиторию и `JTBD`, а charter-конфликтный вариант нельзя подавать как равнозначно рекомендуемый.
- Если запрос конфликтует с charter, ассистент обязан остановиться, коротко объяснить конфликт и предложить ближайший безопасный вариант.
- Если буквальная инструкция пользователя ослабляет product charter, safety, privacy, governance, QA или уже принятый рабочий контракт проекта, согласие пользователя не является достаточным основанием для выполнения. Ассистент должен назвать конкретный конфликт, предложить ближайший вариант, который сохраняет цель пользователя и контракт проекта, и продолжать только по согласованному безопасному варианту.
- Product charter нельзя обходить через локальный patch, mirror-файл, temporary exception или ad-hoc script; при изменении charter сначала обновить `.memory-bank/product-charter.md`, `AGENTS.md`, релевантные `.memory-bank/*` и `CODEX_MEMORY.md`.
- До echo-test нельзя строить product feature work на неизвестном источнике дебютной базы, неизвестном формате opening-map или непроверенной связке legal move parsing.
- Утвержденный deploy path ограничен личным web-доступом через Vercel: GitHub repository `Const-Iv/Chess`, Vercel project `chess-prilozhenie`, production branch `main`, production URL `https://chess-prilozhenie.vercel.app`. Это не утверждает коммерческую модель, публичные аккаунты, синхронизацию, аналитику, external opening database или хранение личных данных.
- До отдельного approval не фиксировать коммерческую модель, публичные аккаунты, синхронизацию, аналитику, другой deploy path, deploy protection model или большую внешнюю базу дебютов как готовые продуктово-технические решения.
- Любой push в GitHub может создать Vercel deployment: push в `main` обновляет production, push в другие ветки может создать preview. Перед merge/push в `main` обязателен PASS `npm run qa:agent`; для UI/user-visible changes нужен browser smoke, если интерфейс можно запустить; для внешней публикации нужен `npm run qa:security`.
- Production deploy через Vercel должен идти из GitHub `main` после обычного task/merge flow. Ручной `vercel --prod`, Vercel promote или API production deploy допустимы только по явному owner request как emergency/one-off path с зафиксированной причиной и exact SHA.
- Preview deployments из `codex/*` веток допустимы для owner review, но не заменяют QA gate, source/manual verification дебютных данных и task finish/merge gate.
- После finish/merge, затрагивающего Vercel deploy profile, нужно явно проверить и сообщить deploy evidence: `publishStatus`, source branch/SHA, target branch, provider/deployment URL/status если доступен, production URL smoke when appropriate. Если подтвержден только push в `main`, формулировать это как deployment trigger, а не как доказанный completed deploy.
- Перед push нужно проверить, что diff не содержит secrets, credentials, личные заметки, прогресс, приватные партии или неподтвержденные шахматные факты; `.vercel/`, `.env`, runtime artifacts and local state должны оставаться ignored.
- External libraries, integrations and package setup require official documentation check before installation/configuration/update/debugging.
- Reusable shared skills можно versioned хранить в `skills/` и публиковать в `$CODEX_HOME/skills` через repo scripts; downstream проекты могут подключать starter как git submodule и линковать skills через `skills-manage.mjs --source vendor/new-project-starter/skills`; `.system`, plugin-managed, product-specific skills и generated skill trees (`.agents/skills`, `.claude/skills`, `.cursor/skills`) не являются частью starter core и не импортируются bulk-copy.
- `skills/starter-rule-report/` — основной project-local skill для ночного и ручного read-only сбора reusable rule updates из downstream проектов; автоматизации должны вызывать этот skill, а не дублировать scan/report логику. `rule-sync:scan` и `rule-sync:report` остаются deterministic execution layer, default scan window идёт от последнего saved scan snapshot до текущего запуска.
- `skills/starter-rule-import/` — основной project-local skill для утреннего согласования и переноса approved reusable правил в starter. Он ведёт owner'а по последнему readable report, задаёт вопросы по сгруппированным пунктам, готовит approval JSON и preliminary check без изменений, а сам импорт требует owner approval, managed worktree и QA. Каждый новый approved reusable rule должен добавлять или обновлять запись в `.memory-bank/starter-rule-registry.json`. Перед каждым owner choice `starter-rule-import` сначала выводит в чат полную сводку в порядке `Статус сейчас`, `Проект-источник`, `Суть`, `Job Story`, `Точный текст для starter`; только после этой сводки можно показывать choice или вызывать `request_user_input`.
- `skills/starter-rule-sync/` — временный compatibility router для старых prompt'ов; он не должен смешивать report и import, а направляет к `starter-rule-report` или `starter-rule-import`.
- `rule-sync:report --latest` должен иметь fallback от короткого нулевого follow-up scan к предшествующему meaningful scan, если latest scan выглядит как technical probe, созданный сразу после содержательного run; настоящий нулевой scan за полный период нельзя подменять старым отчётом.
- Rule-sync owner report должен начинаться с decision proposals через `Связь с charter проекта -> Цель решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`; candidate ids допустимы только как traceability для approval JSON. `Требует ручной проверки` не должен перекладывать read-only source inspection на владельца: если Codex может проверить источник сам, он делает self-check и пишет конкретную рекомендацию.
- Rule-sync report должен сохранять человекочитаемый Markdown в ignored `runtime/rule-sync/reports/` и группировать разбор по проектам: похожие находки внутри проекта объединяются в одно предложение; для каждой группы простыми словами показывать, что нашли, есть ли дубли, почему это полезно starter, точный текст правила для starter, как убрать лишние детали, куда может лечь правило и по каким ids проверить источник. Нижние decision-блоки `Кандидаты на импорт` и `Требует ручной проверки` — эталонный owner-facing формат для этой задачи: их можно читать самостоятельно без верхнего разбора; они группируют похожие пункты по проекту и теме; каждая группа содержит bold labels вроде `**Точный текст для starter:**`, `**Что Codex проверяет сам:**`, `**Моё предложение:**`, `**Что ожидается от владельца:**`; ручная проверка явно пишет self-check Codex, рекомендуемое решение и какой ответ ожидается от владельца.
- Rule-sync report anti-regressions: нельзя возвращаться к raw списку ids, generic формулировкам вроде “использовать как evidence” без конкретной проблемы, отдельным повторяющимся пунктам для дублей, technical jargon без объяснения, или нижним блокам, которые требуют читать верхний разбор, чтобы понять решение. QA/TRIZ logs нельзя показывать как готовые правила; они остаются ручной проверкой, пока не написан конкретный reusable starter text.
- Rule-sync import не должен переносить сырой QA/TRIZ log как готовое правило: logs используются как evidence, а import text переписывается в portable starter invariant с source traceability.
- Owner-facing reports должны сначала давать человеческий смысл, решение и следующий шаг; candidate ids, commits, task ids и source snippets используются только как проверяемая traceability и не заменяют summary.
- Если отчёт или дайджест собирает данные из разных источников, каждая запись должна явно показывать свой источник. Конкретные каналы проекта, например Telegram или Gmail, остаются в проекте-источнике.
- `skills/starter-rule-share/` — основной project-local skill для outbound sharing текущего подтверждённого starter baseline в выбранные активные downstream проекты. Rule-level source of truth: `.memory-bank/starter-rule-registry.json` со стабильными `id`, точным `text`, `targetFiles`, `requiredFragments`, `source` и `sharePolicy`. `rule-share:*` commands остаются approval-safe execution layer: scan/report read-only, apply-plan только dry-run task seeds, список проектов берётся из ignored `runtime/rule-share/config.json`, а direct bulk-copy во все локальные проекты запрещён. Report должен группировать результат по проектам и показывать `presentRules`, `missingRules`, `presentUnregisteredRules`, `blockedRules` с конкретным текстом правил; для rule-level partial match в ready-проекте Codex сначала делает read-only self-check и превращает пункт в конкретную рекомендацию: уже покрыто, добавить как написано, добавить с адаптацией или не добавлять. Apply-plan для copied-baseline проектов переносит только `missingRules` и не дублирует уже найденный текст. Guarded one-run mode допустим только по явному owner request или ignored standing approval: перенос идёт через downstream managed task worktrees и deterministic QA, manual-review/blocked проекты пропускаются, finish/merge/publish не выполняются без отдельного явного разрешения. Для copied-baseline `prepare_rule_import` task seed должен включать exact missing rule list, canonical/mirror parity (`AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, README, `.cursorrules`, `CLAUDE.md`), QA/TRIZ evidence и явную остановку перед publish gate.
- При запуске `starter-rule-share` первым owner-facing шагом должен быть выбор проектов для текущего переноса: Codex показывает полный обнаруженный список кандидатов, явно отмечает include/exclude/blocked/source-only рекомендации, получает подтверждение владельца по exact project set и только после этого запускает `rule-share:scan`, `rule-share:apply-plan`, downstream `task:start` или guarded one-run. Если окно выбора недоступно, Codex задаёт вопрос в чате и останавливается; нельзя молча трактовать “all ready projects”, прошлый approval JSON или standing approval как подтверждение текущего интерактивного запуска.
- Rule-share report не должен перекладывать read-only проверку partial/blocked rules на владельца. Для `blockedRules` в ready-проекте Codex сначала проверяет target files сам и пишет конкретную рекомендацию: уже покрыто, добавить как написано, добавить с адаптацией или не добавлять; владелец только согласует рекомендацию или снимает настоящий blocker.
- `skills/starter-project-bootstrap/` — основной project-local skill для conversational bootstrap нового downstream-проекта после копирования или подключения starter baseline. Если пользователь пишет `стартуем новый проект`, `запусти новый проект`, `проведи bootstrap нового проекта` или сообщает, что скопировал starter в новый репозиторий, ассистент запускает `starter-project-bootstrap`: создаёт отдельную рабочую папку из чистого `main`, подключает skills из starter, проводит Project Intake и не начинает разработку функций до согласования intake. Если для `skills:link` нужно заменить конфликтующие локальные skills, ассистент отдельно запрашивает явное согласие владельца. Feature/refactor/behavior-change work запрещён до approved intake.

Project Intake Gate для нового downstream-проекта:
- Новый проект, который стартует от starter baseline, сначала заполняет Project Intake по `plans/_project_intake_template.md`; feature/refactor/behavior-change реализация начинается только после owner approval по всем обязательным пунктам.
- Обязательные сведения: миссия, видение, цель, целевая аудитория, `JTBD`, продуктовые ограничения, сценарии использования, метрики успеха, границы core/adapters/profiles, stack/runtime choices, echo-testing для unknown root technology, integration/review path, QA/release choices, agent/eval ownership, source-of-truth files, rules/memory ownership и applicable capability decisions.
- Миссия и видение в Project Intake должны быть сформулированы по правилам из `.memory-bank/product-charter.md`: миссия должна отвечать, кому проект помогает, какой результат даёт и через что; видение должно описывать желаемое будущее и роль проекта в нём. Миссия и видение пишутся только на уровне проекта, а не для отдельных задач.
- Пока проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.
- Capability decisions в Project Intake заполняются only-if-applicable: auth / user identity, payments / billing, credits / limits, analytics / consent, i18n / localization, async jobs / workers, API documentation, service layout и runtime-specific rules. Применимый блок требует owner approval до feature/refactor/behavior-change работы в этой зоне; неприменимый блок явно помечается как not applicable.
- Echo-testing Gate для нового продукта или capability: если Project Intake, product spec или feature plan опирается на неизвестную корневую технологию, интеграцию, provider, runtime, agent surface, bot/channel, worker или внешний API, до feature/refactor/behavior-change реализации нужно выполнить изолированный минимальный echo-test. Echo-test проверяет только корневой путь: входной сигнал проходит через выбранную связку и возвращается как same payload, фиксированный ответ или другой минимальный observable result. Evidence фиксирует hypothesis, setup, команду/сценарий, фактический результат, ограничения и решение `proceed | blocked | narrow spike | choose alternative`. Echo-test не заменяет full QA, security checks, product acceptance и owner approval; real secrets, production user data и insecure bypass запрещены.
- Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
- Starter core не должен hardcode'ить provider-specific или stack-specific defaults: конкретный frontend stack, identity provider, payment providers, fixed locales, Python-only decorators, database queue или single-worker model допустимы только как downstream adapter/profile choice.
- Если конкретному проекту нужны действия после публикации, например перезапуск локальных агентов или сервисов, способ выполнения нужно согласовать в Project Intake этого проекта. Starter не зашивает продуктовые агенты, локальные команды и настройки конкретной среды в общую основу.
- Security-sensitive capability decisions должны фиксировать portable invariants до implementation: token/session storage и revocation для auth; webhook verification и idempotency для payments; audit trail, precision, pre-execution checks and race protection for credits/limits; consent and failure isolation for analytics; completeness checks for i18n; retry/cancellation/idempotency for async jobs; documentation source of truth for APIs.
- Каждый пункт intake должен иметь статус `согласовано` или зафиксированный blocker; placeholder, `TBD`, “заполним потом” и несогласованные допущения не считаются готовым bootstrap.
- После approval ответы из intake переносятся в `.memory-bank/product-charter.md`, `.memory-bank/project-context.md`, `.memory-bank/architecture-map.md`, `.memory-bank/code-rules.md`, `AGENTS.md`, `CODEX_MEMORY.md`, `README.md` и другие релевантные canonical sources.
- Если по пункту нельзя выбрать безопасный вариант без владельца продукта, ассистент задаёт короткий choice question и рекомендует только charter-safe option.
- Если пользователь пишет `стартуем новый проект` или близкую формулировку, ассистент не должен выдавать только общий checklist: нужно использовать `$starter-project-bootstrap`, показать связь с charter, назвать текущее состояние bootstrap, дать следующий безопасный шаг и вести owner'а по intake, canonical transfer и deterministic QA.

Eval Gate для AI/agent behavior:
- Для изменений, влияющих на Plan mode, вопросы/рекомендации ассистента, Product Charter gate, Project Intake Gate, rule-sync owner reports, rule-share owner reports, conversational commands, TRIZ decisions или другой AI/agent behavior, plan file обязан содержать `Eval spec`.
- `Eval spec` должен фиксировать: agent surface, хороший ответ, провал, критичные edge cases, regression examples/golden prompts, способ сравнения old vs new behavior и minimum pass threshold.
- Acceptance criteria отвечают “что должно быть возможно для пользователя”; evals отвечают “насколько качественно агент выбирает, объясняет, рекомендует и соблюдает правила”.
- QA evidence для такого изменения должно включать eval result или явно зафиксированный gap с ближайшей deterministic компенсацией.

## Language Requirements

- Все ответы ассистента пользователю по умолчанию на русском, если пользователь явно не попросил другой язык.
- Все файлы в `plans/` и operator-facing docs должны быть на русском.
- Код, идентификаторы, API fields и inline code comments должны быть на английском.

## Vibe UX & Safety Standing Orders (Mandatory)

- Предпочитать simplest viable implementation.
- Перед любым mutating action кратко объяснять, что меняется и почему.
- Не выдавать placeholder outputs (`// ... existing code`, `TODO later`, частичные заглушки) за готовую реализацию.
- По умолчанию использовать diff-first output; полные файлы давать только по явному запросу.
- Не выводить секреты, токены, ключи, credentials, private notes.
- Если найден security-риск, помечать его `WARNING:` и сразу предлагать безопасную альтернативу.
- Не внедрять insecure patterns даже по явному запросу; коротко объяснять риск и вести к безопасному варианту.
- Файлы с реальными ключами, токенами, паролями и приватными credential-значениями считать read-only.
- Не удалять, не truncate'ить, не full-overwrite'ить и не rename-replace'ить существующий файл без явного подтверждения и rollback-ready path.
- Не удалять user data или существующее поведение без явного запроса и rollback-ready notes.
- Для user-facing продуктовых решений использовать простой продуктовый язык: сначала показать связь с существующим project charter, затем цель изменения, `JTBD`, Job Stories, User Stories и критерии приемки. `Миссия` и `Видение` нельзя создавать для конкретной задачи: они существуют только на уровне проекта и берутся из `.memory-bank/product-charter.md` или Project Intake нового downstream-проекта.
- Любое предложение продуктового решения, включая короткий ответ в чате, нельзя оформлять только как `Summary`, `Key Changes`, список implementation steps или технический sketch. Если нужен полный разбор, использовать `Связь с charter проекта -> Цель изменения/решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`; если пользователь задал короткий вопрос или нужен lightweight-вариант, дать хотя бы один charter anchor до implementation details.
- User-facing ответы по governance/rule-sync решениям должны быть charter-anchored и коротко объяснять “что это значит” до технических деталей; нельзя оставлять владельцу только raw ids, snippets или список файлов.
- В будущих plan files техническая часть начинается ниже верхнего продуктового блока `Связь с charter проекта -> Цель изменения -> Целевая аудитория проекта -> Продуктовая спека`.
- Новый downstream-проект до feature work проходит Project Intake Gate: все обязательные сведения из `plans/_project_intake_template.md` заполнены, согласованы owner'ом и перенесены в canonical sources.
- Для AI/agent behavior changes product spec включает `Eval spec`; без него нельзя считать acceptance criteria достаточными.
- В `Summary`, `TL;DR`, `Связь с charter проекта`, `Цель изменения`, `Целевая аудитория`, `JTBD`, `Job Stories` и `User Stories` не использовать технические термины без твердой необходимости; писать про ситуацию, ценность и ожидаемый результат понятным пользовательским языком. Блоки `Миссия` и `Видение` допустимы только для project charter или Project Intake, а не для task/spec output.
- Технические детали добавлять только там, где они помогают понять или реализовать решение. Их можно встроить в текст; если агенту нужен точный implementation context, добавлять отдельный блок `План для агента`.
- В user-facing ответах не использовать необъяснённый Git/process-жаргон; если термин нужен, сразу давать простой смысл рядом, например `diverged` = “локальная папка и GitHub разошлись”.
- Перед refactor сначала искать существующие тесты на затронутый seam и гонять ближайший baseline до/после каждого логического change batch.
- Для любого code-changing task доказательством корректности считаются только детерминированные проверки.
- После каждого логического change batch нужно прогонять хотя бы одну релевантную deterministic check.
- Диалог с пользователем держать на русском, а code/comments/identifiers — на английском.
- Если high-impact ambiguity нельзя снять из репо, задавать один короткий choice question.

## Karpathy Behavioral Overlay (Mandatory)

- Для non-trivial задач явно фиксировать assumptions, если они влияют на поведение, scope, data safety или rollout risk.
- Если есть несколько правдоподобных трактовок, коротко показать варианты вместо silent choice.
- Предпочитать simplest implementation, которая полностью закрывает запрос; не добавлять speculative abstraction без явной нужды.
- Для executable tasks ассистент должен вывести ожидаемый результат из запроса пользователя и вести цикл `goal -> change -> check -> fix -> re-check`, пока результат не проверен или не достигнут явный stop condition. Stop conditions: существенная продуктовая неоднозначность, риск destructive/data/prod/secret/main-worktree action, отсутствие permission/credential, конфликт, требующий выбора владельца, исчерпанный retryable QA chunk, baseline/infra blocker вне scope задачи или настоящий продуктовый tradeoff с несколькими валидными вариантами.
- Для user-visible UI behavior change или UI bugfix ассистент должен до реализации определить browser oracle: точный пользовательский сценарий, ожидаемый видимый результат, релевантные данные/состояния, признаки сбоя и console/runtime status. Перед завершением нужно проверить реальный интерфейс доступным browser-инструментом. Если browser verification падает и агент может это воспроизвести, он диагностирует, исправляет, повторяет deterministic checks и снова прогоняет browser oracle, а не просит владельца искать UI-ошибки вручную.
- Делать surgical diffs: каждая изменённая строка должна вести к requested outcome или к cleanup, вызванному самой правкой.
- Для bugfix/regression предпочитать `reproduce -> fix -> verify`, а не reasoning-only fixes.
- Для trivial low-risk edits не добавлять лишнюю церемонию.

## Codex-First Governance (Mandatory)

- Обязательные source-of-truth файлы: `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`; product charter: `.memory-bank/product-charter.md`; reusable starter rule registry: `.memory-bank/starter-rule-registry.json`.
- `.cursorrules` — compatibility mirror, но не единственный источник обязательных правил.
- Для любых process/git/QA изменений обновлять Codex-primary source в той же задаче.
- Для системных багов и high-impact regressions использовать `STAR + profile data + repo-RAG` до выбора финального fix-path:
  - `STAR`: Situation, Task, Action, Result.
  - `profile data`: file size / hook density / lint density, perf / coverage / contracts / security результаты, dirty-tree и environment-leak сигналы.
  - `repo-RAG`: смотреть `plans/*`, `Docs/qa-implementation-log.md`, `Docs/change-ledger.md`, `.memory-bank/*`, `CODEX_MEMORY.md`.
- Для регрессий по умолчанию исправлять shared seam и добавлять reusable guard. Локальный patch без guard — только как `Exception` с reason, risk, rollback и debt-removal follow-up.
- Если есть `historical_recurrence` или `cross_module_conflict`, не фиксировать финальный путь решения до TRIZ-pass.
- Перед завершением задачи делать Codex applicability check:
  - подтвердить, что новые/обновлённые правила есть в `AGENTS.md` и/или `.memory-bank/*`;
  - подтвердить, что обязательное правило не осталось только в `.cursorrules`;
  - зафиксировать этот check в plan QA results, если использовался plan file.

## BMAD Method Integration (Mandatory When BMAD Is Used)

- Если в проекте используется BMAD, каноническая установка должна жить в `_bmad/`; generated teammate entrypoints — в `.claude/skills/` и `.cursor/skills/`.
- BMAD project context должен опираться на `.memory-bank/project-context.md`; для governance и operational lessons BMAD-потоки также читают `AGENTS.md`, `.memory-bank/*` и `CODEX_MEMORY.md`.
- `_bmad-output/` — worktree-local scratch для BMAD artifacts и не должен коммититься или использоваться как source of truth.
- В parallel work BMAD запускать внутри task-specific worktree, созданного через `task:start`, и по возможности держать отдельный chat/context на workflow.
- BMAD дополняет conveyor, но не отменяет его обязательные gate'ы: plan approval, `task:qa:agent`, preview checkpoint contract, `task:finish:core`, merge/publish и operational-doc capture.
- Для small isolated bugfix/feature предпочитать BMAD Quick Flow; для cross-module, contract или architecture changes поднимать PRD/architecture/story workflow до implementation.

## Mandatory Workflow (Plan Mode Only): Plan -> Approval -> Implementation

Для feature/refactor/behavior-change задач в collaboration mode `Plan`:

1. Сначала прочитать `.memory-bank/index.md` и только релевантные memory-файлы.
2. До любых code edits создать план-файл в `plans/` по шаблону `plans/_template.md`.
3. Именование плана: `YYYY-MM-DD-HHMM-<short-slug>.md`.
4. Использовать checkboxes статуса (`[ ] Не начато`, `[ ] В процессе`, `[ ] Завершено`).
5. Plan file должен содержать продуктовую спеку: проблема / `JTBD`, целевая аудитория изменения, сценарии использования, требования, критерии приемки, метрика успеха и ограничения / что нельзя сломать.
6. Если задача меняет AI/agent behavior, plan file должен содержать `Eval spec` и QA plan должен включать eval evidence.
7. Если при подготовке или уточнении плана нужен choice question, сначала сверить варианты и рекомендацию с `.memory-bank/product-charter.md`; в вопросе кратко показать charter-safe recommendation или объяснить, почему безопасного recommended option нет.
8. После создания плана остановиться и запросить явное подтверждение пользователя.
9. Не менять source files до подтверждения.
10. После подтверждения:
   - выполнять шаги по порядку;
   - отмечать завершённые чекбоксы `[x]`;
   - записывать QA execution и results в тот же план.
11. При material scope change обновлять план и снова просить re-approval.
12. Перед завершением убедиться, что план содержит финальный статус и список changed files.

В collaboration mode `Default` этот workflow опционален и применяется только по явному запросу пользователя.

## Chat Conveyor Commands (Default Mode)

В `Default` режиме ассистент должен понимать разговорные формулировки и исполнять их через канонические скрипты репозитория.

### New Project Bootstrap

Канонический интент: `стартуем новый проект`.

- использовать `$starter-project-bootstrap`;
- прочитать `.memory-bank/product-charter.md`, `.memory-bank/index.md`, `plans/_project_intake_template.md`, `AGENTS.md` и `CODEX_MEMORY.md`;
- если repo на clean `main` и доступен `task:start`, автоматически создать managed bootstrap worktree; не спрашивать owner отдельно про этот безопасный шаг;
- если repo-managed skills ещё не подключены, установить зависимости через `npm ci` при необходимости и выполнить `npm run skills:link`; при конфликте не запускать `--adopt` без explicit owner approval;
- определить состояние bootstrap: `fresh-copy`, `intake-in-progress`, `intake-approved`, `canonical-ready` или `qa-ready`;
- если Project Intake не approved, создать или продолжить intake и не начинать feature/refactor/behavior-change работу;
- если intake approved, перенести ответы в canonical sources и mirrors as applicable;
- после canonical transfer установить зависимости, подключить repo-managed skills при необходимости и прогнать baseline QA;
- не hardcode'ить stack/provider/product defaults в starter core; такие решения фиксируются как downstream adapters/profiles с owner approval.

### Main Branch Protection

- В `main` нельзя вносить изменения без явного разрешения пользователя на direct-main правку в рамках текущей задачи.
- По умолчанию любые feature/refactor/bugfix/process/governance изменения выполняются в отдельном task-specific worktree и отдельной ветке `codex/*`.
- Если ассистент находится на `main` и пользователь не дал явного разрешения менять `main`, нужно остановиться до mutating action и предложить безопасный путь: создать managed worktree через `task:start`, сначала закоммитить/stash'нуть текущие изменения, либо получить явное direct-main разрешение для маленькой низкорисковой правки.
- На `main` без отдельного worktree допустимы read-only inspection, `git status`/`git diff`, а также явно запрошенные merge/release flows после обязательных QA gate'ов.

### Start Task / Worktree

Канонический интент: `Создай новый worktree "<Тело задачи>"`.

- parse title и передавать полный user request как `--seed-message`;
- проверять repo state;
- если working tree dirty, останавливаться до `task:start`; `--allow-dirty` больше не использовать, явно сообщать, что новый worktree не создан, и предлагать безопасные next steps (`git diff`, commit текущей работы или `git stash -u`);
- если `task:start`, `task:finish:core`, `task:merge:main` или `release:local` блокируются dirty `main`/source tree, ассистент сначала сам собирает read-only blocker report: конкретные файлы, тип изменения, tracked/untracked статус, вероятное происхождение по history/diff/name-status, связь с текущей task branch, риск для текущей работы и recommended safe path. Нельзя перекладывать первичный разбор dirty tree на владельца;
- запускать `npm run task:start -- --title "<Тело задачи>" --seed-message "<полный запрос>"`;
- создавать `codex/*` branch и отдельный managed worktree;
- `<task-slug>` должен строиться из фактического `<Тело задачи>`: для non-ASCII title используется deterministic readable ASCII transliteration или approved short semantic mapping, например `ЭХО` -> `echo`; fallback `task` допустим только когда в title нет осмысленных букв/цифр;
- managed local path должен жить под `~/.codex/worktrees/<taskId>/<source-project>-<task-slug>`;
- писать task state в `.git/codex-task-pipeline/tasks/*.json`;
- писать runtime history в `.git/codex-task-pipeline/history/events.ndjson`;
- bootstrap dependencies в новом worktree через shared dependency preflight;
- best-effort открывать новый worktree/chat; если локальная автоматизация умеет, можно auto-send seed message, но падение auto-open/auto-send не должно ломать START.

### Finish Task

Канонический интент: `Заверши задачу`.

- работать только на `codex/*` branch;
- использовать `npm run task:finish:core`, а не свободный ad-hoc flow;
- перед commit/merge/publish task QA должен быть PASS;
- если `HEAD == qaLastPassSha`, переиспользовать QA checkpoint вместо повторного full task QA;
- если finish стартует из dirty task tree, `task:finish:core` должен сначала зафиксировать task commit/checkpoint, затем прогнать task QA уже на committed `HEAD`, и только после этого переходить к publish stage;
- если task branch не получила собственного task commit, её `HEAD` уже содержится в `main`, а worktree clean, `task:finish:core` должен пропустить publish stage, записать `publishStatus=skipped_already_merged` и всё равно довести cleanup до `passed|kept`;
- shared operational docs сначала capture'ить из task branch, а sync'ить обратно только на publish/release stage как single-writer artifacts;
- `task:finish:core` не должен спрашивать legacy `--preview ok|skip`;
- для cleanup/publish resume из `main` использовать `--task-id <id>` как канонический селектор, `--branch codex/<task-branch>` оставить совместимым fallback;
- для starter baseline `task:qa:agent` всё равно пишет `previewPreparedSha`, но preview status по умолчанию `not_supported`, пока проект не добавит свой preview adapter;
- перед cleanup всегда спрашивать явно и в фиксированном формате:
  `1. Удалить`
  `2. Оставить`
  Ответ `1` маппится на удаление локального worktree/branch, ответ `2` — на сохранение.
- delete cleanup считается успешно завершённым только когда `cleanupStatus` в task state/history стал `passed` и проверено, что exact `state.worktreePath` исчез из filesystem и `git worktree list`, managed task root `$CODEX_HOME/worktrees/<taskId>/` удалён, а task-scoped leftovers отсутствуют; одного `cleanupDecision`, похожего имени папки или exit code недостаточно.
- keep cleanup считается завершённым только когда `cleanupStatus` стал `kept` после явного выбора `2. Оставить`.
- если после finish найден похожий worktree другого `taskId`, branch или проекта, сообщать его как отдельный pending cleanup и снова задавать фиксированный выбор `1. Удалить` / `2. Оставить`; нельзя засчитывать или удалять его как cleanup текущей задачи.
- optional repo script `task:finish:cleanup` может добавить только task-scoped `extraPaths` и/или вернуть `blocked`; starter core не делает глобальный sweep вне текущего task scope.

### Merge Semantic Command

Интенты типа `слей в main`, `влей в main`, `merge в main` мапятся на `npm run task:merge:main`.

- merge/publish разрешён только после task QA;
- local `main` должен быть clean;
- после merge на `main` обязательно прогнать `qa:agent`;
- single-writer operational docs синхронизируются только на publish/release stage.
- для этого продукта `main` является Vercel production branch, поэтому merge/push в `main` может обновить `https://chess-prilozhenie.vercel.app`;
- перед merge/push в `main` также нужен `npm run qa:security`, а UI/user-visible changes требуют browser smoke, если интерфейс можно запустить;
- после publish stage проверять deploy evidence: `publishStatus`, source branch/SHA, deployment URL/status если доступен, production URL smoke when appropriate; push в `main` означает trigger, но не сам по себе completed Vercel deploy;
- перед push нужно проверить отсутствие secrets, credentials, личных заметок, прогресса, приватных партий и неподтвержденных шахматных фактов.

### Release Semantic Command

Для starter core используется `release:local`, а не обязательный deploy-to-server pipeline.

- интенты типа `локально опубликуй`, `сделай local release`, `обнови локальный baseline` мапятся на `npm run release:local`;
- `release:local` требует clean и synced `main`;
- Vercel deploy profile уже добавлен как product-specific lightweight profile поверх GitHub `main`; он не заменяет `release:local`;
- ручной `vercel --prod`, Vercel promote или API production deploy не являются обычным release path и требуют явный owner request, причину bypass, exact SHA and post-deploy verification.

## QA Requirements

- Для задач с plan file план должен содержать automated checks, manual verification steps, expected outcomes и actual results.
- Primary deterministic gate: `npm run qa:agent`.
- Fixed gate order: `lint -> lint:fix:changed -> lint -> typecheck -> test -> build`.
- `qa:smoke:pr` и `qa:e2e:nightly` в starter baseline должны оставаться реальными process scenarios, а не no-op wrappers.
- `qa:smoke:pr` и `qa:e2e:nightly` в starter baseline — это process-level temp-repo scenarios, а не browser smoke.
- `qa:coverage:critical` — manifest-driven critical regression guard: каждый critical module обязан иметь связанный test set.
- `qa:perf:critical` использует `Docs/qa-perf-baseline.json`; если baseline меняется, обновлять файл в той же задаче.
- `qa:security` обязательно включает secret scan и dependency audit.
- Перед/внутри `qa:agent` обязателен dependency preflight; в fresh task worktrees тот же seam должны использовать `task:start` и `task:test`.
- Если QA создаёт временные worktrees / task state / fixtures, cleanup обязателен, а failure cleanup считается QA fail.
- Перед finish / merge / release обязателен полный PASS `npm run qa:agent`.
- Для bugfix-задач без planning mode эквивалентное QA evidence нужно фиксировать в ответе по задаче и в `Docs/qa-implementation-log.md`.
- Для process/governance implementation полезно дописывать в `Docs/qa-implementation-log.md` stage history, failures, fixes и rollback notes.
- Test quality для capability changes должен быть behavior-focused: happy path, empty/boundary inputs, validation/error paths, permissions, retry/timeout/cancellation, idempotency, concurrency, state transitions, provider failure isolation и user-visible states выбираются по релевантности. Bugfix требует regression test или явно зафиксированный deterministic gap; skipped/focused tests, arbitrary sleeps и tests that pass regardless of implementation не считаются trustworthy evidence.
- Performance и state-safety fixes должны явно сохранять пользовательские данные и публичные behavior contracts; read-only/internal automatic updates не считаются user changes без пользовательского действия или реального entity change.
- Риск потери пользовательского состояния требует root-cause анализа и reusable regression guard; локальное reasoning-only исправление без guard допустимо только как зафиксированный exception.
- Для complex behavior changes QA evidence должно включать deterministic checks и operational-doc capture; QA/TRIZ logs являются evidence для формулировки правила, а не готовым source text для governance import.
- GitHub CI расследования должны идти через repo-owned `gh-fix-ci` workflow: recent Actions audit группирует повторы по repo/workflow/branch scope/failure class, отделяет `account_billing_blocker` от code regression и не превращает owner/platform blocker в code patch.

## Operational Docs and Task State

- Task state canonical path: `.git/codex-task-pipeline/tasks/*.json`.
- Runtime history canonical path: `.git/codex-task-pipeline/history/events.ndjson`.
- `qaLastPassSha` и `previewPreparedSha` — обязательные reuse checkpoints.
- `cleanupStatus` и `cleanupTargets` — обязательные finish-cleanup markers; отсутствие `cleanupStatus` означает, что cleanup ещё может требовать resume, а `cleanupStatus=passed` допустим только после exact worktree, git worktree registration, managed task root и task-scoped leftovers verification.
- Shared operational snapshots (`Docs/qa-implementation-log.md`, `Docs/triz-usage-log.md`, append-only sections `CODEX_MEMORY.md`) — single-writer artifacts.
- `Docs/qa-implementation-log.md` и `Docs/triz-usage-log.md` должны оставаться активными читаемыми логами; при разрастании sync сохраняет полный pre-compaction snapshot в `Docs/archive/*.md.gz`, а в активном файле оставляет компактный текущий хвост.
- Task branches должны использовать `task:operational-docs:capture`, а publish/release stage — `task:operational-docs:sync`.

## Codex Code Review Severity Policy (Mandatory)

High-priority findings для этого starter repo ограничены:

- regressions в conveyor/runtime flows (`task:start`, `task:qa:agent`, `task:finish:core`, `task:merge:main`, `release:local`);
- поломки task state / runtime history / operational artifact contracts;
- security defects в GitHub Actions, secret scanning, dependency handling и local release safety;
- flaky или environment-leaking QA/CI, из-за которых PR/nightly evidence становится недостоверным;
- ошибки single-writer operational docs, ведущие к silent overwrite / duplicate merge / data drift.

Не считать high-priority:

- style-only, naming-only, formatting-only, comment-only замечания;
- optional refactor ideas без прямого correctness/reliability/security impact;
- низкосигнальный noise вокруг docs phrasing, если он не ломает process contract.
- Если high-priority findings нет, лучше короткий no-findings verdict, чем шум из мелких замечаний.

## TRIZ Escalation Protocol (Mandatory)

- Канонические TRIZ sources:
  - `research/triz/knowledge-pack.md`
  - `research/triz/agent-prompt-v2.md`
  - `research/triz/case-library.md`
- До финализации complex fixes/refactors делать history scan по:
  - `plans/*`
  - `Docs/qa-implementation-log.md`
  - `Docs/change-ledger.md`
- TRIZ обязателен при любом trigger:
  - `qa_repeat_stage`
  - `qa_chunk_exhausted`
  - `cross_module_conflict`
  - `historical_recurrence`
- При trigger conveyor должен писать `TRIZ_TRIGGER` в runtime history и запись в `Docs/triz-usage-log.md`.
- Если применено явное TRIZ-решение, писать `TRIZ_APPLIED` и детальную запись в `Docs/triz-usage-log.md`.
- В финальном ответе по задаче TRIZ-блок даётся один раз:
  - `TRIZ-вклад: применено | не применялось`
  - `Противоречие`
  - `Какие принципы/подходы использованы`
  - `Что конкретно устранено`
  - `Fallback/долг`
- Если TRIZ не применялся, писать: `не применялось (триггер не сработал)`.

## Repository Commands (Reference)

- `npm run lint`
- `npm run lint:fix`
- `npm run lint:fix:changed`
- `npm run skills:link`
- `npm run skills:status`
- `npm run skills:unlink`
- `npm run rule-sync:scan -- --since <date> --until <date>`
- `npm run rule-sync:report -- --latest`
- `npm run rule-sync:apply-plan -- --approval <path> --dry-run`
- `npm run rule-share:scan`
- `npm run rule-share:report -- --latest`
- `npm run rule-share:apply-plan -- --approval <path> --dry-run`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run qa:agent`
- `npm run qa:smoke:pr`
- `npm run qa:e2e:nightly`
- `npm run qa:security`
- `npm run qa:coverage:critical`
- `npm run qa:perf:critical`
- `npm run task:start -- --title "<title>" --seed-message "<request>"`
- `npm run task:test -- [args]`
- `npm run task:qa:agent`
- `npm run task:finish:core`
- `npm run task:merge:main`
- `npm run task:history -- tail --lines 20`
- `npm run task:history -- sync`
- `npm run task:ledger -- rebuild --write-docs`
- `npm run task:operational-docs:capture`
- `npm run task:operational-docs:sync`
- `npm run release:local`

## Commit Message Rules (Mandatory)

- Формат commit message: `Ver. <version> <type> <description> | <qa-result>`.
- `<version>`: для post-MVP line стартовать с `4.00`, затем повышать на `0.01`.
- `<type>`: `feat:` | `fix:` | `docs:` | `refactor:`.
- `<qa-result>`: `билд прошел` | `билд не прошел`.
- TRIZ summary не дублируется в commit message.

## Bugfix Workflow (Mandatory, No Plan Gate)

Для bugfix-задач planning mode опционален, но сам workflow обязателен:

1. Intake:
   - источник бага;
   - окружение и version/commit;
   - severity `P0` / `P1` / `P2` / `P3`.
2. Reproduction:
   - воспроизводимые шаги;
   - expected vs actual behavior;
   - если не воспроизводится, остановиться и уточнить.
3. Root cause:
   - конкретная гипотеза;
   - подтверждение логами, трассировкой или code-path evidence.
4. Class-level analysis:
   - defect class;
   - broken invariant;
   - shared seam, где класс должен быть исправлен системно.
5. Test-first:
   - добавить падающий test, когда это practically possible;
   - если невозможно, явно зафиксировать ограничение.
6. Fix strategy:
   - выбирать минимально рискованный systemic fix;
   - локальный patch без shared guard оформлять как `Exception`.
7. QA matrix:
   - reported case;
   - happy path;
   - минимум 2 adjacent variants;
   - reusable guard на shared seam.

## Shared Starter Baseline Rules

- `starter.agent.contract-challenge`: Если буквальная инструкция пользователя ослабляет product charter, safety, privacy, governance, QA или уже принятый рабочий контракт проекта, согласие пользователя не является достаточным основанием для выполнения. Ассистент должен назвать конкретный конфликт, предложить ближайший вариант, который сохраняет цель пользователя и контракт проекта, и продолжать только по согласованному безопасному варианту.
- `starter.conveyor.dirty-source-blocker-report`: Если `task:start`, `task:finish:core`, `task:merge:main` или `release:local` блокируются dirty `main`/source tree, ассистент сначала сам собирает read-only blocker report: конкретные файлы, тип изменения, tracked/untracked статус, вероятное происхождение по history/diff/name-status, связь с текущей task branch, риск для текущей работы и recommended safe path. Нельзя перекладывать первичный разбор dirty tree на владельца.
- `starter.agent.default-goal-loop`: Для executable tasks ассистент должен вывести ожидаемый результат из запроса пользователя и вести цикл `goal -> change -> check -> fix -> re-check`, пока результат не проверен или не достигнут явный stop condition. Stop conditions: существенная продуктовая неоднозначность, риск destructive/data/prod/secret/main-worktree action, отсутствие permission/credential, конфликт, требующий выбора владельца, исчерпанный retryable QA chunk, baseline/infra blocker вне scope задачи или настоящий продуктовый tradeoff с несколькими валидными вариантами.
- `starter.qa.ui-browser-oracle`: Для user-visible UI behavior change или UI bugfix ассистент должен до реализации определить browser oracle: точный пользовательский сценарий, ожидаемый видимый результат, релевантные данные/состояния, признаки сбоя и console/runtime status. Перед завершением нужно проверить реальный интерфейс доступным browser-инструментом. Если browser verification падает и агент может это воспроизвести, он диагностирует, исправляет, повторяет deterministic checks и снова прогоняет browser oracle, а не просит владельца искать UI-ошибки вручную.
- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
