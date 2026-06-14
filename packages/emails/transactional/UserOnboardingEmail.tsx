import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ComponentProps } from "react";
import * as React from "react";
import { bodyText, container, footerText, main } from "./styles";

void React;

interface Props {
  unsubscribeUrl?: string;
}

export const UserOnboardingEmail = ({ unsubscribeUrl }: Props) => (
  <Html>
    <Head />
    <Preview>Welcome to AI Chat Bot Pro!</Preview>
    <Body style={main}>
      <Container
        align="left"
        style={{
          ...container,
          margin: "0",
          maxWidth: "100%",
          textAlign: "left",
        }}
      >
        <Text style={bodyText}>
          Hi,
          <br />
          <br />
          Welcome to AI Chat Bot Pro! 🎉
          <br />
          <br />
          We&apos;re excited to have you on board. AI Chat Bot Pro makes it
          easy to build beautiful, engaging chat experiences for your business —
          without writing a single line of code.
          <br />
          <br />
          Here&apos;s how to get started:
          <br />
          <br />
          1. <strong>Create your first bot</strong> — drag and drop blocks to
          build your conversation flow.
          <br />
          2. <strong>Publish and share</strong> — embed it on your website or
          share via a direct link.
          <br />
          3. <strong>Track results</strong> — see every response in your results
          dashboard.
          <br />
          <br />
          If you have any questions, our support team is here to help at{" "}
          <Link href="mailto:support@aichatbotpro.com">
            support@aichatbotpro.com
          </Link>
          .
          <br />
          <br />
          Let&apos;s build something great together!
          <br />
          <br />
          The AI Chat Bot Pro Team
        </Text>
        <Hr />
        {unsubscribeUrl ? (
          <Text style={{ ...footerText, marginTop: "24px" }}>
            <Link href={unsubscribeUrl}>Click here to unsubscribe</Link>
          </Text>
        ) : null}
      </Container>
    </Body>
  </Html>
);

UserOnboardingEmail.PreviewProps = {
  unsubscribeUrl: "https://aichatbotpro.com/emails/unsubscribe",
} satisfies Props;

export default UserOnboardingEmail;

export const renderUserOnboardingEmail = async (
  props: ComponentProps<typeof UserOnboardingEmail>,
) => render(<UserOnboardingEmail {...props} />);
