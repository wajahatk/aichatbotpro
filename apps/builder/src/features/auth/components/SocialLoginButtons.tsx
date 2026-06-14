import { useTranslate } from "@tolgee/react";
import { omit } from "@typebot.io/lib/utils";
import { Button } from "@typebot.io/ui/components/Button";
import { GithubIcon } from "@typebot.io/ui/icons/GithubIcon";
import { useRouter } from "next/router";
import { type getProviders, signIn, useSession } from "next-auth/react";
import { stringify } from "qs";
import { useState } from "react";
import { GoogleLogo } from "@/components/GoogleLogo";
import { AzureAdLogo } from "@/components/logos/AzureAdLogo";
import { FacebookLogo } from "@/components/logos/FacebookLogo";
import { GitlabLogo } from "@/components/logos/GitlabLogo";
import { KeycloackLogo } from "@/components/logos/KeycloakLogo";

type Props = {
  providers: Awaited<ReturnType<typeof getProviders>> | undefined;
};

// Provider IDs that have their own dedicated button below
const HANDLED_PROVIDERS = new Set([
  "github",
  "google",
  "facebook",
  "gitlab",
  "microsoft-entra-id",
  "custom-oauth",
  "keycloak",
  "apple",
  "nodemailer",
  "email",
]);

function AppleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 814 1000"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.8-157.1-107.4C76.1 789.9 0 671.1 0 553.1c0-195.7 127.7-299.2 253.6-299.2 67.1 0 122.9 44.4 164.9 44.4 40 0 103.8-48.5 180.7-48.5 29.3 0 130.3 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

export const SocialLoginButtons = ({ providers }: Props) => {
  const { t } = useTranslate();
  const { query } = useRouter();
  const { status } = useSession();
  const [authLoading, setAuthLoading] = useState<string>();

  const isDisabled = (id: string) =>
    ["loading", "authenticated"].includes(status) || authLoading === id;

  const handleSignIn = async (provider: string) => {
    setAuthLoading(provider);
    await signIn(provider, {
      callbackUrl:
        query.callbackUrl?.toString() ??
        `/chatbots?${stringify(omit(query, "error", "callbackUrl"))}`,
    });
    setTimeout(() => setAuthLoading(undefined), 3000);
  };

  // Any DB-enabled providers not covered by the hardcoded buttons below
  const genericProviders = Object.values(providers ?? {}).filter(
    (p) => p && !HANDLED_PROVIDERS.has(p.id),
  );

  return (
    <div className="flex flex-col gap-2">
      {providers?.github && (
        <Button
          onClick={() => handleSignIn("github")}
          disabled={isDisabled("github")}
          variant="outline-secondary"
        >
          <GithubIcon />
          {t("auth.socialLogin.githubButton.label")}
        </Button>
      )}
      {providers?.google && (
        <Button
          onClick={() => handleSignIn("google")}
          disabled={isDisabled("google")}
          variant="outline-secondary"
        >
          <GoogleLogo />
          {t("auth.socialLogin.googleButton.label")}
        </Button>
      )}
      {providers?.facebook && (
        <Button
          onClick={() => handleSignIn("facebook")}
          disabled={isDisabled("facebook")}
          variant="outline-secondary"
        >
          <FacebookLogo />
          {t("auth.socialLogin.facebookButton.label")}
        </Button>
      )}
      {providers?.gitlab && (
        <Button
          onClick={() => handleSignIn("gitlab")}
          disabled={isDisabled("gitlab")}
          variant="outline-secondary"
        >
          <GitlabLogo />
          {t("auth.socialLogin.gitlabButton.label", {
            gitlabProviderName: providers.gitlab.name,
          })}
        </Button>
      )}
      {providers?.["microsoft-entra-id"] && (
        <Button
          onClick={() => handleSignIn("microsoft-entra-id")}
          disabled={isDisabled("microsoft-entra-id")}
          variant="outline"
        >
          <AzureAdLogo />
          {t("auth.socialLogin.azureButton.label", {
            azureProviderName: providers["microsoft-entra-id"].name,
          })}
        </Button>
      )}
      {providers?.apple && (
        <Button
          onClick={() => handleSignIn("apple")}
          disabled={isDisabled("apple")}
          variant="outline-secondary"
        >
          <AppleLogo />
          Continue with Apple
        </Button>
      )}
      {providers?.["custom-oauth"] && (
        <Button
          onClick={() => handleSignIn("custom-oauth")}
          disabled={isDisabled("custom-oauth")}
          variant="outline-secondary"
        >
          {t("auth.socialLogin.customButton.label", {
            customProviderName: providers["custom-oauth"].name,
          })}
        </Button>
      )}
      {providers?.keycloak && (
        <Button
          onClick={() => handleSignIn("keycloak")}
          disabled={isDisabled("keycloak")}
          variant="outline-secondary"
        >
          <KeycloackLogo />
          {t("auth.socialLogin.keycloakButton.label")}
        </Button>
      )}
      {/* Generic fallback: any provider enabled via superadmin that isn't handled above */}
      {genericProviders.map((p) =>
        p ? (
          <Button
            key={p.id}
            onClick={() => handleSignIn(p.id)}
            disabled={isDisabled(p.id)}
            variant="outline-secondary"
          >
            Continue with {p.name}
          </Button>
        ) : null,
      )}
    </div>
  );
};
