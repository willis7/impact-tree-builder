import React from "react";
import type { NodeType } from "@/types/drag";
import { KEYBOARD_SHORTCUTS } from "@/types/drag";

export interface UseKeyboardNavigationState {
  mode: "select" | "add-node" | "connect";
  dragState: { isDragging: boolean };
}

export interface UseKeyboardNavigationActions {
  cancelDrag: () => void;
  setMode: React.Dispatch<React.SetStateAction<"select" | "add-node" | "connect">>;
  setSelectedNodeType: React.Dispatch<React.SetStateAction<NodeType | null>>;
  setConnectSourceNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setHelpDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Node type shortcuts mapping (case-insensitive)
 */
const NODE_TYPE_SHORTCUTS: Record<string, NodeType> = {
  b: KEYBOARD_SHORTCUTS.b,
  B: KEYBOARD_SHORTCUTS.b,
  p: KEYBOARD_SHORTCUTS.p,
  P: KEYBOARD_SHORTCUTS.p,
  i: KEYBOARD_SHORTCUTS.i,
  I: KEYBOARD_SHORTCUTS.i,
  n: KEYBOARD_SHORTCUTS.n,
  N: KEYBOARD_SHORTCUTS.n,
};

/**
 * Custom hook for managing keyboard navigation and shortcuts
 */
export function useKeyboardNavigation(
  state: UseKeyboardNavigationState,
  actions: UseKeyboardNavigationActions
): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Escape key - cancel current operation
      if (e.key === KEYBOARD_SHORTCUTS.Escape) {
        if (state.dragState.isDragging) {
          actions.cancelDrag();
        } else if (state.mode === "connect") {
          actions.setMode("select");
          actions.setConnectSourceNodeId(null);
        } else if (state.mode === "add-node") {
          actions.setMode("select");
          actions.setSelectedNodeType(null);
        }
        return;
      }

      // Node type shortcuts (b, p, i, n)
      const nodeType = NODE_TYPE_SHORTCUTS[e.key];
      if (nodeType) {
        actions.setSelectedNodeType(nodeType);
        actions.setMode("add-node");
        e.preventDefault();
        return;
      }

      // 'c' key - Connect Nodes mode
      if (e.key === "c" || e.key === "C") {
        actions.setMode("connect");
        actions.setSelectedNodeType(null);
        e.preventDefault();
        return;
      }

      // 's' key - Select mode
      if (e.key === "s" || e.key === "S") {
        actions.setMode("select");
        actions.setSelectedNodeType(null);
        actions.setConnectSourceNodeId(null);
        e.preventDefault();
        return;
      }

      // F1 key - Open help dialog
      if (e.key === "F1") {
        actions.setHelpDialogOpen(true);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // Using individual action dependencies instead of the whole `actions` object
    // to prevent effect re-runs when unrelated actions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.dragState.isDragging,
    state.mode,
    actions.cancelDrag,
    actions.setMode,
    actions.setSelectedNodeType,
    actions.setConnectSourceNodeId,
    actions.setHelpDialogOpen,
  ]);

  // No return value needed
}