import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 3000;

export default function useToast() {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const timerRef = useRef(null);

  function clearToastTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function hideToast() {
    clearToastTimer();

    setToast({
      message: "",
      type: "success",
    });
  }

  function showToast({
    message,
    type = "success",
    duration = DEFAULT_DURATION,
  }) {
    clearToastTimer();

    setToast({
      message,
      type,
    });

    timerRef.current = setTimeout(() => {
      setToast({
        message: "",
        type: "success",
      });

      timerRef.current = null;
    }, duration);
  }

  function showSuccessToast(message, duration) {
    showToast({
      message,
      type: "success",
      duration,
    });
  }

  function showErrorToast(message, duration) {
    showToast({
      message,
      type: "error",
      duration,
    });
  }

  useEffect(() => {
    return () => {
      clearToastTimer();
    };
  }, []);

  return {
    toast,
    showToast,
    showSuccessToast,
    showErrorToast,
    hideToast,
  };
}
