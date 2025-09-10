import React, { useState } from "react";
import ShodoAdvicePanel from "./ShodoAdvicePanel";
import styles from "./ShodoAdvicePanel.module.css";
import { collectDraft } from "./domCollector";

type SelectorConfig = {
  title?: string;
  lead?: string;
  body?: string;
  contact?: string;
};
type Values = {
  title?: string;
  lead?: string;
  bodyMd?: string;
  contact?: string;
};

type Props = {
  selectors?: SelectorConfig;
  values?: Values;
  variant?: "fab" | "inline";
  label?: string;
};

export default function ShodoAdviceLauncher(props: Props) {
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
      <button
        className={props.variant === "inline" ? styles.inlineBtn : styles.fab}
        onClick={openWithCurrent}
      >
        {props.label || "Shodoヘルプ"}
      </button>
      <ShodoAdvicePanel
        open={open}
        onClose={() => setOpen(false)}
        title={seed?.title ?? ""}
        lead={seed?.lead ?? ""}
        content={seed?.bodyMd ?? ""} // ← Panel 側では content として送られる
        contact={seed?.contact ?? ""}
      />
    </>
  );
}
