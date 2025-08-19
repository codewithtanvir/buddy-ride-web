// Simple toast utility for user notifications
export interface ToastOptions {
  duration?: number;
  type?: "success" | "error" | "info" | "warning";
}

class ToastManager {
  private container: HTMLElement | null = null;

  private createContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className =
        "fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none";
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(message: string, options: ToastOptions = {}) {
    const { duration = 3000, type = "info" } = options;
    const container = this.createContainer();

    const toast = document.createElement("div");
    toast.className = `
      pointer-events-auto px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out
      ${type === "success" ? "bg-green-600 text-white" : ""}
      ${type === "error" ? "bg-red-600 text-white" : ""}
      ${type === "warning" ? "bg-yellow-600 text-white" : ""}
      ${type === "info" ? "bg-blue-600 text-white" : ""}
      translate-x-full opacity-0
    `;

    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
      toast.classList.add("translate-x-0", "opacity-100");
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, duration);
  }

  success(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "success" });
  }

  error(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "error" });
  }

  warning(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "warning" });
  }

  info(message: string, options?: Omit<ToastOptions, "type">) {
    this.show(message, { ...options, type: "info" });
  }
}

export const toast = new ToastManager();
