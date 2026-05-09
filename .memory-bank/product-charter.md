# Product Charter

Этот файл — канонический product source of truth для миссии, видения, цели, целевой аудитории и пользовательской ценности `new-project-starter`.

## Как формулировать миссию и видение

Миссия отвечает на вопросы:
- зачем проект существует;
- для кого проект работает;
- какую проблему проект решает;
- какую пользу проект создаёт.

Миссия описывает настоящее и смысл деятельности.

Формула миссии для Project Intake:

`Мы помогаем [кому] получать [какой результат] через [что / как].`

Видение отвечает на вопросы:
- куда проект идёт;
- каким проект хочет стать;
- какой рынок, привычку или способ работы проект хочет изменить;
- как выглядит успех через 3-10 лет.

Видение описывает будущее и амбицию.

Формула видения для Project Intake:

`Мы видим будущее, в котором [желаемое состояние мира / рынка], а наш проект — [роль в этом будущем].`

Для новых downstream-проектов mission/vision в Project Intake нужно проверять по этим вопросам и формулам до переноса в canonical sources. Миссия и видение принадлежат уровню проекта; для отдельных задач используются цель изменения, `JTBD`, Job Stories, User Stories и критерии приемки.

## Миссия

Мы помогаем командам, которые запускают новый проект или репозиторий, с первого дня получать понятную и воспроизводимую операционную основу через переносимый starter baseline: правила работы, безопасное ведение задач, проверяемое качество, память проекта и разговорное управление процессом без ручной сборки заново.

## Видение

Мы видим будущее, в котором новый проект начинается не с ручной сборки правил, процессов и проверок, а с готовой переносимой основы; `new-project-starter` становится базовым слоем для таких репозиториев, где команда добавляет продуктовую специфику поверх через adapters/profiles без изменения core governance.

## Цель проекта

Поддерживать runnable local-first starter baseline, который можно подключать или копировать в downstream проекты, чтобы они сразу имели canonical sources of truth, managed worktrees, deterministic QA, task state/history, operational docs и reusable shared skills.

## Целевая аудитория

- Команды, которые начинают новый проект или новый репозиторий и хотят с первого дня работать по понятным правилам без ручной сборки governance заново.
- Технические и продуктовые лиды, которые отвечают за переносимую операционную основу: task flow, проверки, правила, память проекта и безопасное завершение задач.
- Инженеры и agent-operators, которые ведут задачи через Codex/worktree conveyor и должны получать воспроизводимый, проверяемый процесс.
- Downstream maintainers, которые подключают starter как baseline и добавляют продуктовую специфику поверх него через adapters/profiles.

Не является целевой аудиторией starter core: конечные пользователи downstream-продуктов. Их аудитория должна быть отдельно описана в product charter и product specs конкретного downstream-проекта.

## JTBD

Когда начинается новый проект, я хочу получить готовую и переносимую операционную основу, чтобы команда сразу работала по ясным правилам, проверяла изменения воспроизводимо и не собирала governance, task flow и QA заново.

## Product Charter Gate

- Перед любым продуктовым решением, feature, behavior, process или governance изменением нужно сначала прочитать этот документ целиком и сверить решение с миссией, видением, целью, целевой аудиторией и `JTBD`.
- Изменение нельзя реализовывать, если оно противоречит этому документу, ослабляет переносимость baseline, deterministic QA, safe task flow, source-of-truth governance или hardcode'ит product-specific поведение в starter core.
- Для feature, behavior, process и governance задач нужно явно показать, какую часть миссии, видения, цели, целевой аудитории или `JTBD` изменение поддерживает. Для maintenance-задач достаточно явно сохранить совместимость с этим charter.
- Product proposal нельзя подменять техническим sketch: полный разбор должен ссылаться на существующий project charter, а затем идти через `Цель изменения/решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`. `Миссия` и `Видение` нельзя создавать для конкретной задачи; эти блоки принадлежат project charter или Project Intake нового downstream-проекта.
- В Plan mode все уточняющие вопросы, варианты выбора и рекомендации ассистента должны проходить через этот же gate: recommended option обязан быть совместим с миссией, видением, целью, целевой аудиторией и `JTBD`, а charter-конфликтный вариант нельзя подавать как равнозначно рекомендуемый.
- Если запрос пользователя конфликтует с этим charter, ассистент должен остановиться, коротко объяснить конфликт и предложить ближайший безопасный вариант, который сохраняет миссию и цель проекта.
- Product charter нельзя обходить через локальный patch, mirror-файл, временный exception или ad-hoc script. Если charter требует изменения, сначала обновить этот файл и синхронизировать обязательные правила в `AGENTS.md`, `.memory-bank/*` и `CODEX_MEMORY.md`.
- Downstream проекты должны заменить или расширить этот charter своим product-specific charter, включая собственную целевую аудиторию, и сохранить baseline-инварианты starter core.
- Новый downstream-проект обязан начинаться с Project Intake Gate: команда заполняет недостающие сведения о миссии, видении, цели, целевой аудитории, `JTBD`, продуктовых ограничениях, сценариях, метриках успеха, governance/QA choices, integration/review path и applicable capability decisions; каждый применимый пункт должен получить явное owner approval до первой feature/refactor/behavior-change реализации в этой зоне.
- Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
- Пока downstream-проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.
- Если новый downstream-проект или capability опирается на неизвестную корневую технологию, интеграцию, provider, runtime, agent surface, bot/channel, worker или внешний API, Project Intake или product spec должны зафиксировать isolated echo-test evidence либо blocker до feature/refactor/behavior-change реализации в этой зоне. Echo-test проверяет только минимальный корневой путь и не заменяет full QA, security checks, product acceptance и owner approval.
- Conversational bootstrap нового downstream-проекта должен идти через `$starter-project-bootstrap`: фразы вроде `стартуем новый проект` автоматически создают managed bootstrap worktree on clean `main`, запускают safe skill linking (`npm run skills:link`), guided Project Intake, перенос approved ответов в canonical sources и baseline QA вместо общего checklist.
- Для изменений, влияющих на AI/agent behavior, рекомендации, Plan mode, rule-sync reports, rule-share reports, conversational commands или качество ответов, acceptance criteria недостаточно: задача должна иметь Eval spec с описанием хорошего ответа, провала, критичных edge cases, regression examples, способа сравнения версий и minimum pass threshold.

## Shared Starter Baseline Rules

- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
