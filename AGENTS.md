<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Front-only MVP: all data is deterministic mock data in `src/lib/mock.ts`, mutated through the in-memory store in `src/lib/store.ts` (`update()` + `useStore()`); no backend, so state resets on reload by design.
- Business rules (stock status, quote totals, follow-up stop statuses) live in `src/lib/store.ts` so pages and tests share them.
- `/` is the login screen; the authenticated shell is the `/app` layout route (sidebar, top bar, command bar, AI assistant, animated background).
- List pages with detail children use `*.index.tsx` so the parent path is not a layout needing `<Outlet />`.
- tsconfig has `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` off to keep mock-data-heavy UI code readable.
- Service-agent settings use one shared form embedded in the service module and reused by the standalone settings route, so both entry points edit the same in-memory state.
