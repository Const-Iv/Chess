# CODEX Project Memory

Оперативная память для Codex-сессий в этом репозитории.

## Knowledge Layers

- `.memory-bank/*` — канонические и долгоживущие правила/знания проекта.
- `CODEX_MEMORY.md` — короткие operational notes, learned rules и project notes.

## How To Use

1. Сначала читать `.memory-bank/index.md`, потом этот файл.
2. `Hard Rules` считать non-negotiable.
3. После каждого повторяющегося бага, failed QA или conveyor lesson добавлять `Learned Rule`.
4. После завершённой существенной задачи добавлять короткий `Project Note`.
5. Стабильные правила поднимать из этого файла в `.memory-bank/*`.

## Hard Rules

- Canonical governance хранится в `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`; `.cursorrules` — только mirror.
- Для non-trivial work явно фиксировать assumptions, показывать plausible variants и делать surgical diffs.
- Перед mutating action нужно кратко объяснить change intent.
- Deterministic checks — единственное доказательство корректности.
- Будущие plan files начинаются с продуктового блока `Миссия -> Видение -> Цель -> Целевая аудитория проекта -> Продуктовая спека`; product spec включает проблему / `JTBD`, целевую аудиторию изменения, сценарии использования, требования, критерии приемки, метрику успеха и ограничения / что нельзя сломать.
- Новый downstream-проект стартует с Project Intake Gate по `plans/_project_intake_template.md`; все обязательные сведения должны быть заполнены и явно согласованы owner'ом до первой feature/refactor/behavior-change реализации.
- Для AI/agent behavior changes обязателен `Eval spec`; QA evidence должно фиксировать eval cases, expected behavior, actual behavior и pass/fail.
- В Plan mode уточняющие вопросы, варианты выбора и рекомендации должны проходить через Product Charter; recommended option должен быть charter-safe, а конфликтный с charter вариант нельзя подавать как равнозначно рекомендуемый.
- В `main` нельзя вносить изменения без явного разрешения пользователя на direct-main правку в текущей задаче.
- По умолчанию implementation work выполняется в отдельном managed worktree и ветке `codex/*`.
- `qa:agent` обязателен перед finish / merge / release для code-changing work.
- `task:start` / `task:qa:agent` / `task:finish:core` / `task:merge:main` / `release:local` — canonical process entrypoints.
- `task:start` запускается только из clean tree; `--allow-dirty` не считается допустимым bypass.
- Task state и runtime history должны жить только в `.git/codex-task-pipeline/*`.
- `previewPreparedSha` обязателен как checkpoint even when preview status = `not_supported`.
- Shared operational docs — single-writer; task branches работают через capture/sync.
- TRIZ triggers фиксируются в runtime history и `Docs/triz-usage-log.md`.
- Если используется BMAD, `_bmad/` — canonical install, `_bmad-output/` — uncommitted scratch, а сам BMAD не отменяет conveyor gates.
- При process/git/QA rule change обновлять canonical sources в той же задаче и не оставлять правило только в `.cursorrules`.
- Commit format: `Ver. <version> <type> <description> | <qa-result>`.

## Learned Rules

- Для starter baseline smoke/nightly контуров допустимы не browser-tests, а process-level temp-repo scenarios, если это прямо отражено в `qa-playbook.md` и реально исполняется командами.
- `typecheck` в JS-first starter можно строить на `tsc --checkJs`, если scripts/tests покрыты JSDoc types и это проверяется deterministic gate.
- `qa:coverage:critical` не обязан быть line-coverage percentage, если проект честно использует manifest-driven critical regression coverage и документирует это как source of truth.
- Governance-правило считается реально внедрённым только после синхронизации хотя бы в `AGENTS.md` и `.memory-bank/*`; mirror-файлы сами по себе недостаточны.
- После sync/import baseline reference docs и mirrors тоже нужно проверять на parity: нельзя оставлять старый порядок plan template, допустимый `--allow-dirty` или условный `previewPreparedSha`, даже если canonical files уже обновлены.
- `_bmad-output/` и похожие workflow scratch-артефакты нельзя смешивать с single-writer operational docs или task state.
- `task:finish:core` должен писать task state и runtime history через стабильный repo root из task state, а cleanup managed worktree под `$CODEX_HOME/worktrees/<taskId>/` должен дополнительно подчищать пустой task-root после удаления самого worktree.
- Cleanup-choice в finish-flow должен задаваться фиксированно как `1. Удалить` / `2. Оставить`; ответ цифрой считается canonical и не требует текстовой расшифровки.
- Resume cleanup из `main` должен использовать `--task-id <id>` как canonical selector; `--branch` допустим только как compatibility fallback.
- `cleanupStatus` и `cleanupTargets` — часть канонического task state/history contract; отсутствие `cleanupStatus` означает, что cleanup может требовать resume even if `cleanupDecision` уже записан.
- Optional `task:finish:cleanup` repo hook может возвращать только task-scoped `extraPaths` и/или `blocked`; starter core не делает sweep вне текущего task scope.
- Reusable starter skills должны жить в repo `skills/` и подключаться в `$CODEX_HOME/skills` через symlink-based `skills:link`; после `git pull` existing links обновляются сами, а для новых/renamed skills нужно повторно запустить link.
- Finish-flow не должен reuse task QA для dirty worktree перед commit: если есть незакоммиченные task changes, сначала фиксируется task commit/checkpoint, затем прогоняется QA уже на этом committed `HEAD`.
- Для командного multi-project reuse shared skills downstream repo может держать starter как git submodule и линковать skills через `skills-manage.mjs --source vendor/new-project-starter/skills`, чтобы новые участники получали зафиксированную версию baseline.
- Product proposal нельзя подменять `Summary` / `Key Changes` / technical sketch без product-charter якоря; полный вариант идёт через `Миссия -> Видение -> Цель -> Целевая аудитория -> JTBD`, короткий вариант обязан явно опереться хотя бы на один charter anchor.
- Generated skill trees (`.agents/skills`, `.claude/skills`, `.cursor/skills`) считаются profile/tool output; в starter core нельзя bulk-import'ить их содержимое вместо repo-owned source в `skills/` или переносимой policy.
- Активные `Docs/qa-implementation-log.md` и `Docs/triz-usage-log.md` должны оставаться читаемыми; при compaction полный pre-compaction snapshot сохраняется в `Docs/archive/*.md.gz`.
- Если clean task branch уже содержится в `main` и task commit ещё не записан, finish-flow должен ставить `publishStatus=skipped_already_merged`, писать `PUBLISH_SKIP` и всё равно завершать cleanup через `passed|kept`.
- Product proposal нельзя подменять `Summary` / `Key Changes` / technical sketch без product-charter якоря; полный вариант идёт через `Связь с charter проекта -> Цель изменения/решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`, короткий вариант обязан явно опереться хотя бы на один charter anchor.
- Governance/rule-sync ответы пользователю должны сначала объяснять человеческий смысл, решение и следующий шаг; raw ids, snippets and file lists идут только как traceability.
- QA/TRIZ logs для rule-sync import являются evidence, а не готовым rule text: import должен быть переписан как portable starter invariant без source-project details.
- Performance/state-safety changes должны сохранять user data и public behavior contracts; read-only/internal automatic updates не считаются user changes без user interaction или real entity changes.
- `cleanupStatus=passed` для delete cleanup валиден только после проверки exact `state.worktreePath`, отсутствия этого пути в `git worktree list`, удаления `$CODEX_HOME/worktrees/<taskId>/` и отсутствия task-scoped leftovers; похожие worktrees других задач нужно сообщать как отдельный pending cleanup с новым выбором `1. Удалить` / `2. Оставить`.
- GitHub CI failures нужно разбирать через repo-owned `gh-fix-ci`: recent Actions audit группирует повторы по repo/workflow/branch scope/failure class, а `account_billing_blocker` считается owner/platform action, не code regression.
- `rule-sync:report --latest` должен fallback'иться с короткого нулевого follow-up probe на предшествующий meaningful scan и показывать traceability; настоящий нулевой scan за полный период нельзя подменять старым результатом.
- Если отчёт или дайджест собирает данные из разных источников, каждая запись должна явно показывать свой источник. Конкретные каналы проекта, например Telegram или Gmail, остаются в проекте-источнике.
- `task:start` slug regression: если user title содержит осмысленный текст, нельзя получать generic `task`; для non-ASCII title нужно сохранять читаемую связь с запросом через deterministic ASCII slug (`ЭХО` -> `echo`).
- Echo-testing lesson: перед строительством продукта на неизвестной корневой связке сначала проверять минимальный изолированный loop/result, фиксировать limitations and decision, и только потом разрешать product feature work.
- Approved reusable starter rules должны фиксироваться в `.memory-bank/starter-rule-registry.json`; без stable id и exact text `starter-rule-share` не может надёжно отличить уже применённое правило от missing rule.
- Outbound rule sharing переносит в copied-baseline проекты только `missingRules`; `presentUnregisteredRules` нельзя дублировать как новый текст, а partial/manual-review matches требуют owner review.
- Outbound rule sharing переносит в copied-baseline проекты только `missingRules`; `presentUnregisteredRules` нельзя дублировать как новый текст, а partial/manual-review matches сначала требуют Codex read-only self-check с конкретной рекомендацией для владельца.
- Большая база дебютов, import adapter and full UI behavior remain blocked until each expansion has source/manual verification and deterministic QA.
- Vercel deploy profile approved only as lightweight personal web access via GitHub `main`; auth, sync, analytics, personal data storage and deploy protection model remain separate approvals.
- Большая база дебютов допустима только как checked study layer: каждая линия должна иметь source/manual verification, deterministic legal-move QA и visible source status; prefix-only imported continuations нельзя показывать как exact source fact or engine-best.
- After `worktree-finish` / `task:merge:main` touching the GitHub/Vercel profile, report deploy evidence explicitly: `publishStatus`, source branch/SHA, target branch, provider/deployment URL/status if available, and smoke result. A push to `main` confirms the deployment trigger, not completed Vercel deployment by itself.

## Project Notes

- Этот starter репозиторий сам по себе является runnable process baseline: здесь проверяется не продуктовая логика, а conveyor/governance/runtime contracts.
- Starter является канонической reusable базой для новых проектов; любые новые правила нужно проверять на переносимость в baseline, а продуктовую специфику добавлять поверх него через adapters/profiles.
- Preview в core starter помечается `not_supported`; продуктовые проекты поверх starter могут добавить свой preview adapter без изменения базового task state contract.
- Governance baseline стартера синхронизирован с более свежими правилами Карпаты, BMAD и clean-tree worktree flow, чтобы новый проект стартовал уже с актуальным process-contract.
- Starter теперь может versioned хранить reusable shared skills вроде `worktree-create` и `worktree-finish`, чтобы их можно было коммитить в git и использовать на нескольких устройствах через один bootstrap link.
- Starter теперь содержит собственный `.memory-bank/product-charter.md` как переносимый baseline-паттерн; downstream проекты должны заменить или расширить charter под свою миссию, не ослабляя core governance.
- Starter содержит `starter-rule-sync` skill и `rule-sync:*` commands как approval-safe контур регулярного переноса reusable правил из downstream проектов обратно в baseline.
- Starter содержит `starter-rule-sync` как основной project-local skill для ручного и автоматического rule sync workflow; scheduled automations должны вызывать этот skill, а не дублировать его scan/report логику. `rule-sync:*` commands остаются approval-safe execution layer, default scan window идёт от последнего saved scan snapshot до текущего запуска, а owner report начинается с decision proposals вместо raw candidate ids.
- Starter содержит `starter-rule-share` skill и `rule-share:*` commands как approval-safe outbound контур: после подтверждённого starter import владелец выбирает active downstream проекты из ignored local allowlist, а apply-plan готовит только dry-run task seeds без direct edits и bulk-copy.
- `starter-rule-share` поддерживает guarded one-run mode: по явному owner request или ignored standing approval skill может сам пройти scan/report/apply-plan и выполнить reusable-rule import в downstream managed task worktrees с QA; manual-review/blocked проекты пропускаются, finish/merge/publish требуют отдельного явного gate.
- Для copied-baseline `prepare_rule_import` task seed должен включать не только список файлов, но и downstream implementation contract: preserve product charter wording, canonical/mirror parity, QA/TRIZ evidence и stop-before-publish gate.
- Starter содержит `starter-project-bootstrap` как основной conversational entrypoint для старта нового downstream-проекта после копирования baseline: skill сначала подключает repo-managed skills через `skills:link`, затем ведёт owner'а по intake, canonical transfer и QA, а product-specific choices оставляет в downstream adapters/profiles.
- Starter содержит `starter-project-bootstrap` как основной conversational entrypoint для старта нового downstream-проекта после копирования baseline: skill автоматически создаёт managed bootstrap worktree on clean `main`, подключает repo-managed skills через `skills:link`, затем ведёт owner'а по intake, canonical transfer и QA, а product-specific choices оставляет в downstream adapters/profiles.
- Product charter теперь содержит явные вопросы и формулы для mission/vision, чтобы Project Intake новых downstream-проектов точнее различал текущий смысл проекта и будущую амбицию.
- Starter содержит `starter-rule-report`, `starter-rule-import` и temporary `starter-rule-sync` router как approval-safe контур регулярного переноса reusable правил из downstream проектов обратно в baseline.
- Scheduled automations должны вызывать `starter-rule-report` для read-only scan/report; утреннее owner approval и import должны идти через `starter-rule-import`; `starter-rule-sync` только направляет старые prompt'ы к одному из этих двух skills. `rule-sync:*` commands остаются approval-safe execution layer, default scan window идёт от последнего saved scan snapshot до текущего запуска, а owner report начинается с decision proposals вместо raw candidate ids.
- Starter содержит `.memory-bank/starter-rule-registry.json` как machine-readable реестр reusable правил; `starter-rule-import` обновляет его при новом approved import, а `starter-rule-share` использует его для project-level отчёта `present/missing/presentUnregistered/blocked`.
- Ночной `starter-rule-report` и исходящий `starter-rule-share` не должны отдавать владельцу read-only поиск по проектам: если Codex может проверить source/target files сам, он делает self-check и пишет итог `уже покрыто / добавить как написано / добавить с адаптацией / не добавлять`; владелец согласует решение или снимает настоящий blocker.
- Rule-share report не должен перекладывать read-only проверку partial/blocked rules на владельца; для `blockedRules` в ready-проекте Codex сначала проверяет target files сам и пишет конкретную рекомендацию.
- При каждом интерактивном запуске `starter-rule-share` первый owner-facing шаг — выбор проектов для текущего переноса: показать полный обнаруженный список кандидатов, отметить include/exclude/blocked/source-only рекомендации, получить exact confirmation, и только затем запускать scan/apply-plan/downstream task worktrees. Если UI-окно выбора недоступно, остановиться и спросить в чате; “all ready projects”, прошлый approval JSON и standing approval не считаются текущим подтверждением.
- 2026-05-09: Project Intake согласован owner'ом для "Тренажера шахматных дебютов".
- 2026-05-09: Skills were adopted to point at this Chess worktree; previous conflicting skill symlinks were backed up under `$CODEX_HOME/skills-backups/2026-05-09T12-43-37-375Z`.
- 2026-05-09: Approved runtime direction is local Next.js / React MVP with `npm`; exact package versions and chess tooling require official docs check at implementation time.
- 2026-05-09: Approved echo-test: legal move parsing for `1. e4 e5 2. Nf3 Nc6 3. Bb5` plus manually verified opening-map for Spanish / Ruy Lopez.
- 2026-05-09: Echo-test PASS via `npm run echo:chess-opening`; `chess.js@1.4.0` legally applied the line and manually verified map returned Ruy Lopez / Spanish Opening / Spanish Game with `a6`, `Nf6`, `d6` continuations.
- 2026-05-09: First MVP UI slice implemented for Ruy Lopez: local Next.js screen shows board state, move hints, verified variation names, opening principle, position goal, middlegame plan and legal continuations; browser smoke requires no console errors.
- 2026-05-09: Opening board perspective is fixed by the side being studied, not by whose turn it is; current Ruy Lopez continuation screen studies black responses, so black pieces stay at the bottom while stepping through both sides' moves.
- 2026-05-09: Move-by-move learning UI should keep the current move explanation directly under the board with previous/next arrows; full move lists are secondary because they distract from the beginner explanation.
- 2026-05-09: Vercel/GitHub deploy rule approved: `Const-Iv/Chess` -> Vercel `chess-prilozhenie`, production branch `main`, production URL `https://chess-prilozhenie.vercel.app`; branch pushes may create preview deployments, but production updates must go through GitHub `main` after QA/security gates.
- 2026-05-09: Imported ChatGPT deep-research app-ready v1 into `research/chess-openings-app-ready-v1/`; app now loads 98 research lines after chess.js strict SAN validation and Lichess exact/prefix validation, with UI source labels and A/B/C filters.
- 2026-05-10: Owner approved the current white-piece rendering in `app/globals.css` as the ideal primary design. Preserve it exactly when merging to `main`; also preserve the pre-task `main` black-piece variant as a rollback reference during merge/finish, in case the owner asks to restore it later.
