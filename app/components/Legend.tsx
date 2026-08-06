'use client';

export default function Legend() {
  return (
    <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-3.5 py-2.5 select-none">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900 mb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-4 w-4 rounded" />
        SF Street Sweeping
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="inline-block h-2.5 w-5 rounded-sm bg-blue-600/80" />
        Side being swept
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
        <span className="inline-block h-2.5 w-5 rounded-sm bg-slate-400/50" />
        Opposite side
      </div>
      <div className="mt-1.5 text-[11px] text-gray-400">
        Tap a street for its schedule
      </div>
    </div>
  );
}
