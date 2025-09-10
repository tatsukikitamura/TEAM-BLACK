export type Draft = { title: string; lead: string; bodyMd: string; contact: string };
type SelectorConfig = Partial<{ title: string; lead: string; body: string; contact: string }>;

const S = (v: unknown) => (v ?? "").toString();

function val(el: Element | null): string {
  if (!el) return "";
  const anyEl = el as any;
  if ("value" in anyEl && typeof anyEl.value === "string") return anyEl.value;
  return (el.textContent ?? "").trim();
}

function pickByList(list: string[]): string {
  for (const sel of list) {
    const el = document.querySelector(sel);
    if (el) return val(el);
  }
  return "";
}

/** h見出し(タイトル/サブタイトル/本文/お問い合わせ)の「次の」textareaを拾う */
function byHeadingFollowTextarea(headings: string[]): string {
  const hs = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  for (const h of hs) {
    const t = (h.textContent ?? "").trim();
    if (!t) continue;
    if (!headings.some((kw) => t.includes(kw))) continue;

    // 1) 同じブロック内の textarea
    const inner = h.parentElement?.querySelector?.("textarea");
    if (inner) return val(inner);

    // 2) 次の兄弟に textarea
    let sib: Element | null | undefined = h.nextElementSibling ?? undefined;
    for (let i = 0; i < 3 && sib; i++, sib = sib.nextElementSibling ?? undefined) {
      const ta = sib.querySelector?.("textarea");
      if (ta) return val(ta);
      // 直接 textarea のこともある
      if (sib.tagName.toLowerCase() === "textarea") return val(sib);
    }
  }
  return "";
}

export function collectDraft(now?: SelectorConfig): Draft {
  // title は h1/textarea などから
  const title =
    pickByList(
      [now?.title ?? "", '[data-shodo="title"]', '#title', 'input[name="title"]', 'textarea[name="title"]', 'h1']
        .filter(Boolean)
    ) || byHeadingFollowTextarea(["タイトル", "Title"]);

  const lead =
    pickByList(
      [now?.lead ?? "", '[data-shodo="lead"]', '#lead', 'textarea[name="lead"]', 'input[name="lead"]', '.lead', '.summary']
        .filter(Boolean)
    ) || byHeadingFollowTextarea(["サブタイトル", "リード", "概要", "Lead", "Summary"]);

  const bodyMd =
    pickByList(
      [now?.body ?? "", '[data-shodo="body"]', '#body', 'textarea[name="body"]', '.markdown-body', '[contenteditable="true"]']
        .filter(Boolean)
    ) || byHeadingFollowTextarea(["本文", "Body", "内容"]);

  const contact =
    pickByList(
      [now?.contact ?? "", '[data-shodo="contact"]', '#contact', 'input[name="contact"]', 'textarea[name="contact"]', '.contact']
        .filter(Boolean)
    ) || byHeadingFollowTextarea(["お問い合わせ", "連絡先", "Contact"]);

  return {
    title: S(title),
    lead: S(lead),
    bodyMd: S(bodyMd),
    contact: S(contact),
  };
}
