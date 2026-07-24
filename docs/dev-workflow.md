# Flusso di sviluppo

## Comandi

```bash
npm install       # dipendenze
npm run dev       # sviluppo su http://localhost:5173
npm test          # test motore (Vitest): determinismo + realismo + cime
npm run typecheck # tsc -b --noEmit
npm run build     # tsc -b && vite build -> dist/
npm run preview   # anteprima della build
```

Node 20+. Nessun `Math.random()`/`Date.now()` in `src/engine` e `src/data`
(rompono il determinismo): usare sempre l'`Rng` seedato.

## Git — una fase, un branch, una PR

- `main` è il tronco. Ogni fase parte da un branch dedicato:
  ```bash
  git fetch origin main && git checkout -B claude/fase-1-turno-interattivo origin/main
  ```
- Si sviluppa, si committa, si apre una **PR verso `main`**, si mergia dopo che i
  test passano. Non committare direttamente su `main` codice di gioco (la docs è
  un'eccezione ammessa).
- Push: `git push -u origin <branch>` (retry con backoff su errori di rete).
- Messaggi di commit chiari; footer `Co-Authored-By` come da convenzione di
  sessione. **Non** citare l'identificativo del modello negli artefatti del repo.

## Deploy — GitHub Pages via Actions

- Workflow: `.github/workflows/deploy.yml`. Fa `npm ci` → `npm test` →
  `npm run build` → pubblica `dist/` su Pages. Gira su push a `main` (e al branch
  di lavoro) e via `workflow_dispatch`.
- **Configurazione una tantum (già fatta):** Settings → Pages → Source =
  **"GitHub Actions"** (NON "Deploy from a branch": quest'ultimo servirebbe il
  sorgente grezzo e darebbe pagina bianca con 404 su `/src/main.tsx`).
- **Base path**: `vite.config.ts` usa `base = '/MLBSim/'` (override via
  `BASE_PATH`, es. `'/'` per dominio dedicato o VPS). Il sito va aperto con la
  slash finale: `https://st80dev.github.io/MLBSim/`.
- Se la pagina resta bianca dopo un deploy verde → cache del browser: hard refresh
  (Ctrl/Cmd+Shift+R) o finestra anonima.

## Ambiente sandbox (note)

- L'uscita HTTPS passa da un proxy: `curl` verso `github.io`/`api.github.com` può
  fallire con `000`. Non è un problema del sito; usa gli strumenti GitHub MCP per
  verificare le run delle Actions.
- Per validare la UI in headless: Chromium è in `/opt/pw-browsers/...`; usare
  `playwright-core` con `executablePath` (installato `--no-save`, non committare).
- File temporanei/diagnostici: nella cartella scratchpad di sessione, mai nel repo.
