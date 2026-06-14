import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { SendMailOptions } from "nodemailer";
import type { ComponentProps } from "react";
import * as React from "react";
import { sendEmail } from "../helpers/sendEmail";
import { Logo } from "./components/Logo";
import {
  container,
  footerText,
  hr,
  main,
  paragraph,
  primaryButton,
} from "./styles";

void React;

type ReminderDay = 7 | 2 | 0;

interface Props {
  workspaceName: string;
  daysRemaining: ReminderDay;
  upgradeUrl: string;
  trialEndsDate: string;
}

const getSubjectAndMessage = (
  daysRemaining: ReminderDay,
  workspaceName: string,
  trialEndsDate: string,
): { subject: string; headline: string; body: string } => {
  if (daysRemaining === 7) {
    return {
      subject: `7 days left in your AI Chat Bot Pro trial`,
      headline: `You're halfway through your trial`,
      body: `Your free trial for the workspace "${workspaceName}" has 7 days remaining (until ${trialEndsDate}). You can continue building bots and collecting leads — upgrade any time to keep everything running after your trial ends.`,
    };
  }
  if (daysRemaining === 2) {
    return {
      subject: `Your trial expires in 2 days — don't lose your bots`,
      headline: `2 days left in your trial`,
      body: `Your free trial for "${workspaceName}" expires on ${trialEndsDate}. After expiry, new chat sessions will stop. Upgrade now to keep your bots live with no interruption.`,
    };
  }
  return {
    subject: `Your AI Chat Bot Pro trial has ended`,
    headline: `Your trial has expired`,
    body: `Your free trial for "${workspaceName}" has ended. Your bots are currently paused. Upgrade to a paid plan to reactivate them — all your data and bot configurations are safely preserved.`,
  };
};

export const TrialReminderEmail = ({
  workspaceName,
  daysRemaining,
  upgradeUrl,
  trialEndsDate,
}: Props) => {
  const { headline, body } = getSubjectAndMessage(
    daysRemaining,
    workspaceName,
    trialEndsDate,
  );

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Logo />
          <Text style={paragraph}>
            <strong>{headline}</strong>
          </Text>
          <Text style={paragraph}>{body}</Text>
          <Button href={upgradeUrl} style={primaryButton}>
            {daysRemaining === 0 ? "Reactivate my bots" : "Upgrade now"}
          </Button>
          <Hr style={hr} />
          <Text style={footerText}>
            AI Chat Bot Pro · You&apos;re receiving this because your trial is
            ending.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

TrialReminderEmail.PreviewProps = {
  workspaceName: "Acme Corp",
  daysRemaining: 7,
  upgradeUrl: "https://app.aichatbotpro.com/billing",
  trialEndsDate: "July 1, 2026",
} as Props;

export default TrialReminderEmail;

export const sendTrialReminderEmail = async ({
  to,
  ...props
}: Pick<SendMailOptions, "to"> &
  ComponentProps<typeof TrialReminderEmail>) => {
  const { subject } = getSubjectAndMessage(
    props.daysRemaining,
    props.workspaceName,
    props.trialEndsDate,
  );
  return sendEmail({
    to,
    subject,
    html: await render(<TrialReminderEmail {...props} />),
  });
};
