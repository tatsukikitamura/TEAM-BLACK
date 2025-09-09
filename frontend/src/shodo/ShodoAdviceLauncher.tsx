import React, { useState } from "react";
import ShodoAdvicePanel from "./ShodoAdvicePanel";
import styles from "./ShodoAdvicePanel.module.css";
import { collectDraft } from "./domCollector";

type SelectorConfig = { title?: string; lead?: string; body?: string; contact?: string };
type Values = { title?: string; lead?: string; bodyMd?: string; contact?: string };

export default function ShodoAdviceLauncher(props: { selectors?: SelectorConfig; values?: Values }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<Values>();

  function openWithCurrent(e?: React.MouseEvent) {
    let draft: Values | null = null;

    if (props.values) {
      // ← 編集中の値が来ていればそれを優先
      draft = props.values;
    } else {
      draft = collectDraft(props.selectors);
      if (e?.altKey) {
        console.group("[Shodo] collected draft");
        console.table(draft);
        console.groupEnd();
      }
    }
    setSeed(draft || {});
    setOpen(true);
  }

  return (
    <>
      <button className={styles.fab} onClick={openWithCurrent}>
        Shodoヘルプ
      </button>
      <ShodoAdvicePanel
        open={open}
        onClose={() => setOpen(false)}
        title={seed?.title ?? ""}
        lead={seed?.lead ?? ""}
        content={seed?.bodyMd ?? ""}  // ← Panel 側では content として送られる
        contact={seed?.contact ?? ""}
      />
    </>
  );
}

