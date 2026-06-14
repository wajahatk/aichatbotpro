import { useState } from "react";
import { useRouter } from "next/router";
import prisma from "@typebot.io/prisma";
import type { GetServerSidePropsContext } from "next";
import { isSaSessionValid } from "@/features/superadmin/lib/saSession";

type Props = { email: string };

export default function Verify2FAPage({ email }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (code.length !== 6) return setError("Enter a 6-digit code.");
    setLoading(true);
    setError("");
    const res = await fetch("/api/superadmin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Invalid code.");
    } else {
      router.push("/superadmin");
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") verify();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="mb-4 text-center text-4xl">🔐</div>
        <h1 className="mb-1 text-center text-xl font-bold">2FA Verification</h1>
        <p className="mb-6 text-center text-sm text-gray-400">{email}</p>
        <label className="mb-1 block text-sm text-gray-300">Authenticator Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          onKeyDown={handleKey}
          autoFocus
          className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center font-mono text-2xl tracking-widest focus:border-indigo-500 focus:outline-none"
          placeholder="000000"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={verify}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
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
  if (!user.totpSecret) {
    return { redirect: { destination: "/superadmin/2fa-setup", permanent: false } };
  }
  if (isSaSessionValid(ctx.req, dbSession.userId)) {
    return { redirect: { destination: "/superadmin", permanent: false } };
  }
  return { props: { email: user.email ?? "" } };
}
