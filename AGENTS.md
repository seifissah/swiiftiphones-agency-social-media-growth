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

- Keep report drafting, monthly snapshots and versioned serialization in `src/lib/report-document.ts`; all report entry points use the central report studio so previews and published reports agree.
- Store report snapshots alongside editable narrative in the existing summary field with backward-compatible decoding; later metric edits must not silently change a saved client report.
- Generate PDFs in the browser through a lazy-loaded PDF library; exports need no privileged server access.
