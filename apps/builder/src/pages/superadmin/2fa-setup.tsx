import { useState } from "react";
import { useRouter } from "next/router";
import prisma from "@typebot.io/prisma";
import type { GetServerSidePropsContext } from "next";
import { generateSecret, getTOTPUri } from "@/features/superadmin/lib/totp";

type Props = { secret: string; qrUrl: string; email: string };

export default function TwoFASetupPage({ secret, qrUrl, email }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (code.length !== 6) return setError("Enter a 6-digit code.");
    setLoading(true);
    setError("");
    const res = await fetch("/api/superadmin/2fa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Verification failed.");
    } else {
      router.push("/superadmin/verify-2fa");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="mb-1 text-2xl font-bold">Set Up Two-Factor Auth</h1>
        <p className="mb-6 text-sm text-gray-400">
          Scan the QR code with your authenticator app ({email}), then enter the code.
        </p>
        <div className="mb-6 flex justify-center">
          <img src={qrUrl} alt="QR code" className="rounded-lg border border-gray-700" width={200} height={200} />
        </div>
        <p className="mb-4 text-center font-mono text-sm text-gray-400 break-all">{secret}</p>
        <label className="mb-1 block text-sm text-gray-300">Verification Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center font-mono text-xl tracking-widest focus:border-indigo-500 focus:outline-none"
          placeholder="000000"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={confirm}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Confirm & Enable 2FA"}
        </button>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const req = ctx.req;
  const token =
    req.cookies["authjs.session-token"] ??
    req.cookies["__Secure-authjs.session-token"];
  if (!token) return { redirect: { destination: "/signin", permanent: false } };

  const dbSession = await prisma.session.findUnique({
    where: { sessionToken: token },
    select: { userId: true, expires: true },
  });
  if (!dbSession || dbSession.expires < new Date()) {
    return { redirect: { destination: "/signin", permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { id: dbSession.userId },
    select: { role: true, email: true, totpSecret: true },
  });
  if (!user || user.role !== "SUPERADMIN") {
    return { redirect: { destination: "/superadmin/forbidden", permanent: false } };
  }
  if (user.totpSecret) {
    return { redirect: { destination: "/superadmin/verify-2fa", permanent: false } };
  }

  const totpSecret = generateSecret();
  const email = user.email ?? "superadmin";
  const uri = getTOTPUri(totpSecret, email, "AI Chat Bot Pro");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  return { props: { secret: totpSecret, qrUrl, email } };
}
