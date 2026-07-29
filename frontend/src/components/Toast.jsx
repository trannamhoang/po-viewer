function Toast({ message, type = "success", onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`toast toast-${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <span>{message}</span>

      <button
        type="button"
        className="toast-close-button"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
