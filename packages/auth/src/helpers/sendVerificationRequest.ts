import { sendLoginCodeEmail } from "@typebot.io/emails/transactional/LoginCodeEmail";
import { env } from "@typebot.io/env";

type Props = {
  identifier: string;
  url: string;
};

export const sendVerificationRequest = async ({ identifier, url }: Props) => {
  try {
    const code = extractCodeFromUrl(url);
    if (!code) throw new Error("Could not extract code from url");
    const redirectEmailUrl = new URL("/signin/email-redirect", url);
    redirectEmailUrl.searchParams.set("token", code);
    redirectEmailUrl.searchParams.set("email", identifier);
    const redirectPath = new URL(url).searchParams.get("redirectPath");
    if (redirectPath)
      redirectEmailUrl.searchParams.set("redirectPath", redirectPath);
    if (!env.SMTP_HOST) {
      if (process.env.NODE_ENV === "production")
        throw new Error(
          "SMTP is not configured. Set SMTP_HOST (and related SMTP_* vars) to enable email login.",
        );
      console.info(
        [
          "",
          "==================== AI Chat Bot Pro login ====================",
          `  Email:     ${identifier}`,
          `  Code:      ${code}`,
          `  Sign-in:   ${redirectEmailUrl.toString()}`,
          "  (SMTP is not configured, so the login code is printed here.)",
          "=======================================================",
          "",
        ].join("\n"),
      );
      return;
    }
    await sendLoginCodeEmail({
      url: redirectEmailUrl.toString(),
      code,
      to: identifier,
    });
  } catch (err) {
    console.error(err);
    throw new Error("Magic link email could not be sent. See error above.");
  }
};

const extractCodeFromUrl = (url: string) => {
  const urlParts = url.split("?");
  const queryParams = new URLSearchParams(urlParts[1]);
  return queryParams.get("token");
};
