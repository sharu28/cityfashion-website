import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom has <dialog> but not its modal methods.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom has no element scrollTo; move scrollLeft/scrollTop the way a browser would.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number, y?: number) {
    if (typeof options === "number") {
      this.scrollLeft = options;
      this.scrollTop = y ?? 0;
      return;
    }
    if (options?.left !== undefined) this.scrollLeft = options.left;
    if (options?.top !== undefined) this.scrollTop = options.top;
  };
}
