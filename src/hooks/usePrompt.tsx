import { useEffect, useContext } from "react";
import {
  useLocation,
  useNavigate,
  UNSAFE_NavigationContext as NavigationContext,
} from "react-router-dom";

export function usePrompt(when: boolean, message: string) {
  const navigator = useContext(NavigationContext).navigator;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!when) return;

    const push = navigator.push;
    navigator.push = function (...args: [any, any?, any?]) {
      const confirmLeave = window.confirm(message);
      if (confirmLeave) {
        navigator.push = push;
        (push as (...args: [any, any?, any?]) => void)(...args);
      }
    };

    return () => {
      navigator.push = push;
    };
  }, [when, message, navigator, location, navigate]);
}
