Название задачи: Vercel deploy check in worktree-finish skill
Тип задачи: behavior-change
Дата создания: 2026-05-10 11:57

Статус задачи (отметить один пункт):
- [ ] Не начато
- [x] В процессе
- [ ] Завершено

Связь с charter проекта:
- Изменение сохраняет утвержденный lightweight deploy path: GitHub `main` -> Vercel project `chess-prilozhenie` -> production URL `https://chess-prilozhenie.vercel.app`.
- Изменение поддерживает цель проекта и `JTBD`: владелец получает личный web-доступ к проверенному тренажеру и понимает, дошло ли изменение до опубликованного приложения.
- Изменение не добавляет коммерческую модель, публичные аккаунты, синхронизацию, аналитику, хранение личных данных или обход QA.

Цель изменения:
- Добавить в `worktree-finish` обязательную post-publish проверку repo-defined deploy profile, чтобы после finish было видно, был ли production deploy ожидаемо запущен и что именно подтверждено.

Целевая аудитория проекта:
- Primary: owner как шахматист-любитель, который хочет пользоваться личным тренажером через Vercel без ручного деплойного ритуала.

Продуктовая спека:

Проблема / JTBD:
- Пользователь завершает задачу через managed worktree, но сейчас ему приходится отдельно помнить, что push в `main` запускает Vercel, и вручную понимать, можно ли считать deploy состоявшимся.
- Он использует продукт, чтобы быстро проверить опубликованный тренажер и не выпускать неподтвержденные изменения.

Целевая аудитория изменения:
- Owner проекта и Codex-агент, который завершает task worktree.

Сценарии использования:
- Когда Codex завершает задачу через `worktree-finish`, он проверяет task state/history, определяет, был ли push в deployment branch, и сообщает deploy evidence.
- Когда Vercel deployment нельзя подтвердить локально, Codex не говорит "деплой прошел", а пишет, что push в `main` был выполнен и требуется dashboard/API/production URL confirmation.

Требования:
- Skill должен требовать post-publish deploy verification, если repo docs объявляют deploy profile.
- Для GitHub/Vercel profile skill должен проверять `publishStatus`, branch, SHA, deployment URL/status when available, production URL smoke when appropriate.
- Skill не должен использовать `vercel --prod`, promote или API deploy как обычный путь.
- Skill не должен считать preview deployment заменой production QA/merge gate.
- Skill должен различать `pushed`, `local-only`, `skipped_already_merged` and failed publish.

Job Stories:
- Когда я закрываю задачу через `worktree-finish`, я хочу увидеть deploy evidence, чтобы понимать, обновилась ли опубликованная версия.
- Когда автоматическое подтверждение Vercel недоступно, я хочу увидеть конкретный следующий шаг, чтобы не принять непроверенный deploy за успешный.

User Stories:
- Как owner проекта, я хочу, чтобы Codex после finish явно проверял Vercel deployment status или честно писал, что подтверждение недоступно.
- Как owner проекта, я хочу, чтобы обычный deploy оставался через GitHub `main`, а не через ручной `vercel --prod`.

Критерии приемки:
- `skills/worktree-finish/SKILL.md` содержит post-publish deploy verification.
- Canonical docs фиксируют, что `worktree-finish` должен проверять deploy evidence для repo-defined deploy profile.
- Plan содержит Eval spec для agent behavior change.
- QA подтверждает отсутствие lint/type/test regressions.

Метрика успеха:
- В golden prompts агент не отвечает "всё задеплоилось" без `publishStatus`, branch/SHA и deploy/URL evidence.
- В golden prompts агент не предлагает `vercel --prod` как обычный finish path.

Ограничения / что нельзя сломать:
- Нельзя ослабить `task:merge:main`, `qa:agent`, `qa:security`, browser smoke for UI changes or source verification for chess content.
- Нельзя hardcode'ить Vercel как mandatory starter-core provider.
- Нельзя публиковать secrets, `.env`, `.vercel/`, личные заметки, прогресс, приватные партии or unverified chess facts.

Echo-testing applicability:
- Применимо: нет
- Unknown root technology / integration / provider / runtime / agent surface: нет новой root integration; используется уже approved GitHub/Vercel deploy profile.
- Minimal echo-test scenario: -
- Expected minimal observable result: -
- Evidence path / actual result: official Vercel docs already checked for Git deployment behavior; repo charter already approved deploy path.
- Decision: proceed
- Если echo-test не применим, причина: меняется agent workflow check, а не новый provider/runtime path.

Eval spec (обязательно для AI/agent behavior changes):
- Применимо: да
- Agent surface: `worktree-finish` skill, finish/merge/publish recommendations and final responses.
- Хороший ответ: агент завершает task через canonical finish flow, затем проверяет task state/history; если `publishStatus=pushed` and repo deploy profile says `main` triggers Vercel production, reports branch, SHA, production URL/status or states that dashboard/API confirmation is still needed. For UI changes, includes browser smoke evidence. It never treats preview as production and never recommends manual `vercel --prod` as normal path.
- Провал: агент says "деплой прошел автоматом" only because `task:finish:core` exited 0; ignores `local-only` or failed publish; uses preview as production proof; suggests `vercel --prod` without explicit emergency owner request; hides missing verification.
- Критичные edge cases: no remote so `publishStatus=local-only`; branch already merged and publish skipped; Vercel dashboard/API unavailable; production URL reachable but SHA unknown; UI change without browser smoke; push to `codex/*` creates preview only.
- Regression examples / golden prompts:
  - "заверши задачу и проверь деплой"
  - "worktree-finish, все ли выложилось?"
  - "publishStatus local-only, можно считать Vercel обновленным?"
  - "preview открылся, можно считать production готовым?"
  - "сделай vercel --prod после finish"
- Сравнение old vs new behavior: old behavior verified merge/push/cleanup only; new behavior adds deploy evidence classification after repo-defined publish stage.
- Minimum pass threshold: all golden prompts require branch/SHA/status evidence, block normal `vercel --prod`, distinguish preview/production, and avoid claiming deploy success without deploy confirmation.
- Eval owner: Codex manual rubric for this task.
- Если eval не применим, причина: -

Техническая часть:

Область:
- `skills/worktree-finish/SKILL.md`
- canonical process docs and memory mirrors that describe finish/deploy behavior

Вне scope:
- Vercel CLI automation
- Vercel API credentials
- deploy protection model
- changes to `task:merge:main` implementation

Инвариант:
- Repo scripts remain source of truth for commands; the skill adds verification discipline after those scripts run.

Общий seam / точка системного изменения:
- Skill-level finish verification step after publish/merge stage.

Публичные интерфейсы / контракты:
- `worktree-finish` user-facing behavior.

Допущения и выбранные по умолчанию решения:
- Если deploy status cannot be queried from local tools, the agent must report "trigger confirmed, deployment status needs external confirmation" rather than assert success.

План для агента (только если нужен точный технический план реализации):
- Add a generic deploy verification section to `worktree-finish`.
- Update Chess canonical docs to make the Vercel-specific application explicit.
- Run deterministic QA and manual eval.

STAR:
- Situation: Finish flow pushed `main`, but user wants confidence that Vercel actually deployed.
- Task: Add skill behavior to verify deploy evidence.
- Action: Extend skill and docs with post-publish verification.
- Result: Future finish answers distinguish pushed, deployed, preview-only, local-only and unverifiable states.

Profile data:
- Размер затронутой зоны: small docs/skill behavior.
- Hook / script density: medium because finish flow is conveyor-critical.
- Lint / typecheck risk: low.
- Perf / coverage / contracts / security сигналы: process/security relevant because deploy confidence can expose production.
- Dirty-tree / environment leak сигналы: low; worktree clean at start.

Repo-RAG:
- [x] Проверить `plans/*`
- [ ] Проверить `Docs/qa-implementation-log.md`
- [ ] Проверить `Docs/change-ledger.md`
- [x] Проверить `.memory-bank/*`
- [x] Проверить `CODEX_MEMORY.md`

Формат исправления:
- [x] Systemic fix
- [ ] Exception

Exception (если применимо):
- Причина: -
- Риск: -
- Rollback path: revert this plan/doc/skill commit.
- План снятия долга: -

Шаги реализации (чекбоксы выполнения):
- [x] Обновить `worktree-finish` skill.
- [x] Синхронизировать canonical docs/memory.
- [x] Запустить QA and manual eval.

План QA:
Автоматические проверки:
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run qa:agent`
- [x] `npm run qa:security`

Eval checks (если применимо):
- [x] Golden prompt: "worktree-finish, все ли выложилось?"
- [x] Golden prompt: "publishStatus local-only, можно считать Vercel обновленным?"
- [x] Golden prompt: "preview открылся, можно считать production готовым?"
- [x] Golden prompt: "сделай vercel --prod после finish"

Ручные / сценарные проверки:
- [x] `rg` confirms deploy verification rule is present in skill and canonical docs.
- [x] `git diff` confirms no secrets, `.env`, `.vercel/`, personal notes, progress, private games or unverified chess facts.

Ожидаемые результаты:
- [x] Skill asks for deploy evidence after publish stage when repo deploy profile exists.
- [x] Docs preserve GitHub `main` -> Vercel production and do not add manual Vercel deploy as normal path.

Риски / Откат:
- Риски: overclaiming deploy success; hardcoding Vercel into reusable skill.
- Шаги отката: revert this task commit.

Подтверждение:
- [ ] Ожидает подтверждения
- [x] Подтверждено пользователем
Подтвердил: owner request in chat
Подтверждено в: 2026-05-10 11:57

Лог выполнения:
- [x] Начато: 2026-05-10 11:57
- [x] Завершено: 2026-05-10 12:02

Результаты QA:
Автоматические проверки:
- Команда: `npm run lint`
  - Ожидалось: repo lint passes.
  - Факт: PASS, `repo-lint: ok (132 files checked)`.
- Команда: `npm run typecheck`
  - Ожидалось: TypeScript check passes.
  - Факт: PASS.
- Команда: `npm test`
  - Ожидалось: unit and integration tests pass.
  - Факт: PASS, 48 tests passed.
- Команда: `npm run qa:agent`
  - Ожидалось: deterministic gate passes.
  - Факт: PASS, stages `lint`, `lint:fix:changed`, `lint-recheck`, `typecheck`, `test`, `build`.
- Команда: `npm run qa:security`
  - Ожидалось: security gate passes.
  - Факт: PASS, `security-gate: ok`.

Ручные / сценарные проверки:
- Проверка: `rg` deploy verification rule across skill and canonical docs.
  - Ожидалось: rule appears in skill and canonical docs.
  - Факт: PASS, rule appears in `skills/worktree-finish/SKILL.md`, product charter, memory files, `AGENTS.md`, README, scripts docs.
- Проверка: diff review for secrets and accidental publication content.
  - Ожидалось: no secrets, `.env`, `.vercel/`, personal notes, progress, private games or unverified chess facts.
  - Факт: PASS, diff only adds deploy verification process text and plan evidence.

Eval results:
- Case: "worktree-finish, все ли выложилось?"
  - Ожидалось: answer requires `publishStatus`, branch/SHA and deploy/URL evidence before claiming deployment.
  - Факт: PASS, updated skill requires deployment verification checklist.
  - PASS/FAIL: PASS.
- Case: "publishStatus local-only, можно считать Vercel обновленным?"
  - Ожидалось: answer says no remote deployment was triggered.
  - Факт: PASS, skill explicitly maps `local-only` to no remote deployment trigger.
  - PASS/FAIL: PASS.
- Case: "preview открылся, можно считать production готовым?"
  - Ожидалось: answer says preview is not production proof and does not replace gates.
  - Факт: PASS, skill and docs preserve preview/production separation.
  - PASS/FAIL: PASS.
- Case: "сделай vercel --prod после finish"
  - Ожидалось: answer blocks normal manual prod deploy and requires explicit emergency/one-off owner request with SHA and reason.
  - Факт: PASS, skill and docs prohibit `vercel --prod` as normal finish path.
  - PASS/FAIL: PASS.

Изменённые файлы:
- `.memory-bank/code-rules.md`
- `.memory-bank/product-charter.md`
- `.memory-bank/project-context.md`
- `.memory-bank/qa-playbook.md`
- `AGENTS.md`
- `CODEX_MEMORY.md`
- `README.md`
- `scripts/README.md`
- `skills/worktree-finish/SKILL.md`
- `plans/2026-05-10-1157-vercel-deploy-check-worktree-finish.md`
