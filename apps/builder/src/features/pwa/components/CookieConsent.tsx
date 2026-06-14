import { useEffect, useState } from "react";

const COOKIE_KEY = "aicbp_cookie_consent";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

type Props = {
  consentText?: string;
  privacyUrl?: string;
};

export function CookieConsent({
  consentText = "We use cookies to keep you signed in and improve your experience.",
  privacyUrl = "/legal/privacy",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    setCookie(COOKIE_KEY, "accepted", 365);
    setVisible(false);
  };

  const decline = () => {
    setCookie(COOKIE_KEY, "declined", 30);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4"
    >
      <p className="flex-1 text-sm text-gray-600">
        {consentText}{" "}
        <a href={privacyUrl} className="underline text-indigo-600 hover:text-indigo-800">
          Privacy Policy
        </a>
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={decline}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
