import { CubeIcon } from '@heroicons/react/24/outline'

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-8 w-full text-apple-text-primary animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-20 p-8">


      <div className="flex items-center justify-center p-20 rounded-[32px] bg-apple-tertiary-bg/10 border border-white/5 backdrop-blur-3xl">
        <div className="flex flex-col items-center gap-4 opacity-50">
          <CubeIcon className="w-12 h-12 text-apple-text-secondary" />
          <p className="text-sm font-bold tracking-widest text-apple-text-tertiary uppercase">待后续模块接入</p>
        </div>
      </div>
    </div>
  )
}
