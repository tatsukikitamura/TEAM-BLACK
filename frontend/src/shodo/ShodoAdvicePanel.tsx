import React, { useEffect, useMemo, useRef, useState } from "react";
import css from "./ShodoAdvicePanel.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/** ===== 型 ===== */
type ShodoMessage = {
  type: string;
  message?: string;
  before?: string;
  after?: string;
  explanation?: string;
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
  content?: string; // Markdown
  contact?: string;
};

/** ===== ヘルパ ===== */
const S = (v: unknown) => (v ?? "").toString();

// markdown -> [{heading, content}]
function toSections(markdown?: string): Array<{ heading: string; content: string }> {
  const md = S(markdown);
  if (!md) return [{ heading: "本文", content: "" }];
  const lines = md.split("\n");
  const out: Array<{ heading: string; content: string }> = [];
  let cur = "本文";
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      out.push({ heading: cur, content: buf.join("\n").trim() });
      buf = [];
    }
  };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      flush();
      cur = m[1].trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return out.length ? out : [{ heading: "本文", content: md }];
}

// JSON から messages を安全に取り出す
function pluckMessages(json: unknown): ShodoMessage[] {
  try {
    // 期待形: { shodo: { status: "done", messages: [...] } }
    // まれに { messages: [...] } だけの形に備えたフォールバックも用意
    const any = json as any;
    if (any?.shodo?.messages && Array.isArray(any.shodo.messages)) return any.shodo.messages as ShodoMessage[];
    if (any?.messages && Array.isArray(any.messages)) return any.messages as ShodoMessage[]; // 念のため
  } catch {}
  return [];
}

/** ===== 本体 ===== */
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

  const canSubmit = useMemo(() => S(title).trim().length > 0, [title]);

  // open のクローズ時に状態を掃除
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

    const payload = {
      title: S(title),
      lead: S(lead),
      body: toSections(content),
      contact: S(contact),
      options: { type: "text", maxWaitMs: 6000, pollIntervalMs: 500 },
    };

    try {
      const res = await fetch(`${API_BASE}/api/shodo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: ShodoDone | ShodoProcessing | ShodoError = await res.json();
      if (!res.ok) throw new Error((json as ShodoError)?.error?.message || `API error: ${res.status}`);

      // done
      if ("shodo" in json && json.shodo.status === "done") {
        setResult(json);
        setSending(false);
        return;
      }

      // processing → ポーリング
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

  // 表示用に messages を抽出
  const messages: ShodoMessage[] = pluckMessages(result);

  return (
    <aside className={css.wrap} aria-label="Shodoアドバイス">
      <div className={css.h2}>
        <span>Shodo 指摘（messagesのみ）</span>
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
          <div>
            <span className={css.badge}>processing</span>
          </div>
          <div className={css.kv}>
            <div>タスクID</div>
            <div>{(result as ShodoProcessing).shodo.task_id ?? "-"}</div>
          </div>
        </div>
      )}

      {result && "shodo" in result && result.shodo.status === "done" && (
        <div className={`${css.row} ${css.box}`}>
          <div>
            <span className={css.badge}>done</span>
          </div>

          {messages.length === 0 ? (
            <div className={css.muted}>指摘はありませんでした。</div>
          ) : (
            <ul className={css.list}>
              {messages.map((m, i) => {
                const parts: string[] = [];
                // 1) message（最重要）
                if (m.message) parts.push(m.message);
                // 2) before -> after の差分（あれば）
                if (m.before && m.after) parts.push(`「${m.before}」→「${m.after}」`);
                // 3) セクション名
                if (m.section) parts.push(`section: ${m.section}`);
                // 4) 種類（タグとして）
                const label = m.type ? `[${m.type}] ` : "";
                return (
                  <li key={i}>
                    <strong>{label}</strong>
                    {parts.join(" / ")}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
