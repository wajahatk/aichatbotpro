import { SignInPage } from "@/features/auth/components/SignInPage";
import type { GetServerSideProps } from "next";

type Props = { showDevLogin: boolean };

export default function Page({ showDevLogin }: Props) {
  return <SignInPage type="signup" showDevLogin={showDevLogin} />;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const showDevLogin =
    process.env.NODE_ENV !== "production" &&
    !process.env.SMTP_HOST &&
    !!process.env.ADMIN_EMAIL;

  return { props: { showDevLogin } };
};
