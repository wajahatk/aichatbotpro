import { useTranslate } from "@tolgee/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Seo } from "@/components/Seo";
import { TextLink } from "@/components/TextLink";
import { SignInForm } from "./SignInForm";

type Props = {
  type: "signin" | "signup";
  defaultEmail?: string;
  showDevLogin?: boolean;
};

function DevQuickLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
      });
      if (res.ok || res.redirected) {
        window.location.href = res.url || "/chatbots";
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Login failed");
        setLoading(false);
      }
    } catch {
      setError("Request failed");
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-dashed border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            ⚡ Dev Quick Login
          </span>
          <span className="text-xs text-amber-500">
            Signs in as the admin account (no email needed)
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export const SignInPage = ({ type, showDevLogin }: Props) => {
  const { t } = useTranslate();
  const { query } = useRouter();

  return (
    <div className="flex flex-col gap-4 h-dvh justify-center items-center">
      <Seo
        title={
          type === "signin"
            ? t("auth.signin.heading")
            : t("auth.register.heading")
        }
      />
      <div className="flex flex-col p-8 rounded-lg gap-6 bg-gray-1">
        <div className="flex flex-col gap-4">
          <h2>
            {type === "signin"
              ? t("auth.signin.heading")
              : t("auth.register.heading")}
          </h2>
          {type === "signin" ? (
            <p>
              {t("auth.signin.noAccountLabel.preLink")}{" "}
              <TextLink href="/register">
                {t("auth.signin.noAccountLabel.link")}
              </TextLink>
            </p>
          ) : (
            <p>
              {t("auth.register.alreadyHaveAccountLabel.preLink")}{" "}
              <TextLink href="/signin">
                {t("auth.register.alreadyHaveAccountLabel.link")}
              </TextLink>
            </p>
          )}
        </div>

        <SignInForm defaultEmail={query.g?.toString()} />

        {showDevLogin && <DevQuickLogin />}
      </div>
    </div>
  );
};
