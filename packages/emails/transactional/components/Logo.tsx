import { Img } from "@react-email/components";
import { env } from "@typebot.io/env";
import * as React from "react";

void React;

export const Logo = () => (
  <Img
    src={`${env.NEXTAUTH_URL}/images/acb-pro-logo.svg`}
    width="120"
    height="40"
    alt="AI Chat Bot Pro Logo"
    style={{
      margin: "24px 0",
    }}
  />
);
