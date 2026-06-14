import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-center text-white">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-gray-400 mb-6">You do not have Super Admin privileges.</p>
      <Link href="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
        Return to App
      </Link>
    </div>
  );
}
