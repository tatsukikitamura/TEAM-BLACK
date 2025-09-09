// shodo/ShodoAdviceLauncher.tsx
import React, { useState } from "react";
import ShodoAdvicePanel from "./ShodoAdvicePanel";
import styles from "./ShodoAdvicePanel.module.css";
import { collectDraft } from "./domCollector";

type SelectorConfig = { title?: string; lead?: string; body?: string; contact?: string };
type Draft = { title?: string; lead?: string; bodyMd?: string; contact?: string };

export default function ShodoAdviceLauncher(props: {
  selectors?: SelectorConfig;
  /** これを渡すとDOMスクレイプ無しで確実に値を使える */
  values?: Draft;
  /** 'fab' | 'inline'。既定は 'fab' */
  variant?: "fab" | "inline";
  /** ボタンのラベル（既定: "Shodoアドバイス"） */
  label?: string;
  /** inline のときに外部からクラス追加したい場合 */
  className?: string;
}) {
  const { selectors, values, variant = "fab", label = "Shodoアドバイス", className } = props;

  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<Draft>();

  function openWithCurrent(e?: React.MouseEvent) {
    const dom = collectDraft(selectors);
    const draft: Draft = {
      title:   values?.title   ?? dom.title,
      lead:    values?.lead    ?? dom.lead,
      bodyMd:  values?.bodyMd  ?? dom.bodyMd,
      contact: values?.contact ?? dom.contact,
    };
    if (e?.altKey) {
      console.group("[Shodo] draft");
      console.table(draft);
      console.groupEnd();
    }
    setSeed(draft);
    setOpen(true);
  }

  const btnClass =
    variant === "fab"
      ? styles.fab
      : [styles.btn, className].filter(Boolean).join(" "); // 既存CSSを流用

  return (
    <>
      <button className={btnClass} onClick={openWithCurrent}>
        {label}
      </button>
      <ShodoAdvicePanel
        open={open}
        onClose={() => setOpen(false)}
        title={seed?.title ?? ""}
        lead={seed?.lead ?? ""}
        content={seed?.bodyMd ?? ""}
        contact={seed?.contact ?? ""}
      />
    </>
  );
}
