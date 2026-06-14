import { useState } from "react";
import type { InstallState } from "../hooks/usePwa";

type Props = { state: InstallState; install: () => Promise<boolean> };

export function InstallPrompt({ state, install }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || state === "installed" || state === "idle") return null;

  if (state === "available") {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-indigo-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install AI Chat Bot Pro</p>
          <p className="text-xs text-indigo-200">Quick access from your home screen</p>
        </div>
        <button
          onClick={() => install().then((ok) => { if (!ok) setDismissed(true); })}
          className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-semibold shrink-0"
        >
          Install
        </button>
        <button onClick={() => setDismissed(true)} className="text-indigo-200 hover:text-white p-1">✕</button>
      </div>
    );
  }

  if (state === "ios") {
    return (
      <>
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-indigo-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <div className="text-2xl">📱</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Add to Home Screen</p>
            <p className="text-xs text-indigo-200">Install for offline access & push notifications</p>
          </div>
          <button onClick={() => setIosOpen(true)} className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-semibold shrink-0">
            How?
          </button>
          <button onClick={() => setDismissed(true)} className="text-indigo-200 hover:text-white p-1">✕</button>
        </div>

        {iosOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setIosOpen(false)}>
            <div className="bg-white w-full rounded-t-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900">Add to Home Screen</h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3"><span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">1</span><span>Open <strong>Safari</strong> on your iPhone or iPad</span></li>
                <li className="flex gap-3"><span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">2</span><span>Tap the <strong>Share</strong> button <span className="font-mono bg-gray-100 px-1 rounded">⬆</span> at the bottom of the screen</span></li>
                <li className="flex gap-3"><span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">3</span><span>Scroll down and tap <strong>"Add to Home Screen"</strong></span></li>
                <li className="flex gap-3"><span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">4</span><span>Tap <strong>"Add"</strong> in the top right corner</span></li>
              </ol>
              <p className="text-xs text-gray-400">Push notifications require iOS 16.4+ and the app must be launched from the home screen icon.</p>
              <button onClick={() => setIosOpen(false)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Got it!</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
