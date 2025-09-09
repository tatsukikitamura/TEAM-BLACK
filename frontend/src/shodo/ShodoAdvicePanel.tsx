import React, { useEffect, useMemo, useRef, useState } from "react";
import css from "./ShodoAdvicePanel.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ---- types ----
type ShodoMessage = {
  type: string;
  before?: string;
  after?: string;
  explanation?: string; // ← API側 normalize_message の出力
  section?: string;
  offset?: number;
  length?: number;
};
type ShodoProcessing = { shodo: { status: "processing"; task_id?: string; retryAfterMs?: number } };
type ShodoDone = { shodo: { status: "done"; messages: ShodoMessage[] } };
type ShodoError = { error: { code: string; message: string } };

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  lead?: string;
  content?: string; // ← これをそのまま content として送る
  contact?: string;
};

// ---- utils ----
const S = (v: unknown) => (v ?? "").toString();

function typeLabel(t?: string) {
  if (!t) return "";
  if (t.includes("zenkaku_symbol")) return "約物は全角に（JTF 4.2）";
  if (t.includes("ranuki")) return "ら抜き言葉";
  if (t.includes("keigo")) return "敬語";
  return t;
}

type Grouped = ShodoMessage & { count: number };
function groupMessages(msgs: ShodoMessage[]): Grouped[] {
  const map = new Map<string, Grouped>();
  for (const m of msgs) {
    const key = [m.type, m.before ?? "", m.after ?? "", m.section ?? ""].join("|");
    const g = map.get(key);
    if (g) g.count += 1;
    else map.set(key, { ...m, count: 1 });
  }
  return Array.from(map.values());
}

// ---- component ----
export default function ShodoAdvicePanel({
  open,
  onClose,
  title = "",
  lead = "",
  content = "",
  contact = "",
}: Props) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShodoDone | ShodoProcessing | ShodoError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // どれか1つでも入っていれば送信可
  const canSubmit = useMemo(
    () => [title, lead, content, contact].some((v) => S(v).trim().length > 0),
    [title, lead, content, contact]
  );

  useEffect(() => {
    if (!open) {
      setSending(false);
      setError(null);
      setResult(null);
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open]);

  async function runShodo() {
    setSending(true);
    setError(null);
    setResult(null);

    // ← 新APIに合わせて body をやめ、content(string) を送る
    const payload = {
      title: S(title).replace(/^#\s*/, "").trim(),
      lead: S(lead),
      content: S(content),
      contact: S(contact),
      options: { type: "text", maxWaitMs: 6000, pollIntervalMs: 500 },
    };

    try {
      const res = await fetch(`${API_BASE}/api/shodo`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const json: ShodoDone | ShodoProcessing | ShodoError = await res.json();
      if (!res.ok) throw new Error((json as ShodoError)?.error?.message || `API error: ${res.status}`);

      if ("shodo" in json && json.shodo.status === "done") {
        setResult(json);
        setSending(false);
        return;
      }

      if ("shodo" in json && json.shodo.status === "processing") {
        setResult(json);
        const taskId = json.shodo.task_id;
        const interval = json.shodo.retryAfterMs ?? 500;
        if (!taskId) {
          setSending(false);
          return;
        }

        abortRef.current?.abort();
        const aborter = new AbortController();
        abortRef.current = aborter;

        while (!aborter.signal.aborted) {
          await new Promise((r) => setTimeout(r, interval));
          const poll = await fetch(`${API_BASE}/api/shodo/${encodeURIComponent(taskId)}`, {
            method: "GET",
            signal: aborter.signal,
          });
          const pj: ShodoDone | ShodoProcessing | ShodoError = await poll.json();
          if (!poll.ok) {
            setError((pj as ShodoError)?.error?.message || `Polling error: ${poll.status}`);
            break;
          }
          setResult(pj);
          if ("shodo" in pj && pj.shodo.status === "done") break;
        }
        setSending(false);
        return;
      }

      setResult(json);
      setSending(false);
    } catch (e: any) {
      setError(e?.message ?? "送信に失敗しました");
      setSending(false);
    }
  }

  if (!open) return null;

  // 表示用整形
  const messages = ("shodo" in (result ?? {}) && (result as ShodoDone).shodo.messages) || [];
  const grouped = groupMessages(messages);

  return (
    <aside className={css.wrap} aria-label="Shodoアドバイス">
      <div className={css.h2}>
        <span>Shodo 摘要（messagesのみ）</span>
        <button className={`${css.btn} ${css.btnGhost}`} onClick={onClose}>
          閉じる
        </button>
      </div>

      <div className={css.row}>
        <button className={css.btn} onClick={runShodo} disabled={!canSubmit || sending}>
          {sending ? "送信中…" : "Shodoに送る"}
        </button>
      </div>

      {error && <div className={`${css.row} ${css.err}`}>{error}</div>}

      {result && "shodo" in result && result.shodo.status === "processing" && (
        <div className={`${css.row} ${css.box}`}>
          <div><span className={css.badge}>processing</span></div>
          <div className={css.kv}>
            <div>タスクID</div>
            <div>{(result as ShodoProcessing).shodo.task_id ?? "-"}</div>
          </div>
        </div>
      )}

      {result && "shodo" in result && result.shodo.status === "done" && (
        <div className={`${css.row} ${css.box}`}>
          <div><span className={css.badge}>done</span></div>

          {grouped.length === 0 ? (
            <div className={css.muted}>指摘はありませんでした。</div>
          ) : (
            <ul className={css.list}>
              {grouped.map((m, i) => (
                <li key={i}>
                  <strong>[{typeLabel(m.type)}]</strong>{" "}
                  {m.explanation ?? ""} 
                  {m.before && m.after && <>：「<mark>{m.before}</mark>」→「<mark>{m.after}</mark>」</>}
                  {m.section && <> / section: {m.section}</>}
                  {m.count > 1 && <span className={css.badge}>×{m.count}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
