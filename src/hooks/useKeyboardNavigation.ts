import React from "react";

export interface UseKeyboardNavigationState {
  mode: "select" | "add-node" | "connect";
  dragState: { isDragging: boolean };
}

export interface UseKeyboardNavigationActions {
  cancelDrag: () => void;
  setMode: React.Dispatch<React.SetStateAction<"select" | "add-node" | "connect">>;
  setSelectedNodeType: React.Dispatch<React.SetStateAction<string | null>>;
  setConnectSourceNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setHelpDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

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

      // T116: Escape key - cancel current operation
      if (e.key === "Escape") {
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

      // T110: 'b' key - Business Metric
      if (e.key === "b" || e.key === "B") {
        actions.setSelectedNodeType("business_metric");
        actions.setMode("add-node");
        e.preventDefault();
        return;
      }

      // T111: 'p' key - Product Metric
      if (e.key === "p" || e.key === "P") {
        actions.setSelectedNodeType("product_metric");
        actions.setMode("add-node");
        e.preventDefault();
        return;
      }

      // T112: 'i' key - Initiative (positive)
      if (e.key === "i" || e.key === "I") {
        actions.setSelectedNodeType("initiative_positive");
        actions.setMode("add-node");
        e.preventDefault();
        return;
      }

      // T113: 'n' key - Initiative (negative)
      if (e.key === "n" || e.key === "N") {
        actions.setSelectedNodeType("initiative_negative");
        actions.setMode("add-node");
        e.preventDefault();
        return;
      }

      // T117: 'c' key - Connect Nodes mode
      if (e.key === "c" || e.key === "C") {
        actions.setMode("connect");
        actions.setSelectedNodeType(null);
        e.preventDefault();
        return;
      }

      // T118: 's' key - Select mode
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