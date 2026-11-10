import React from 'react'
import { Shield, ShieldCheck, Trophy, BadgeCheck, Crown, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

export type RankLevel = 'Classic' | 'Silver' | 'Gold' | 'Platinum' | 'Crown'

interface RankCardProps {
  name: string
  period?: number
  nextRankDays?: number
  nextRankName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const rankConfig: Record<string, {
  icon: LucideIcon,
  gradient: string,
  bannerBg: string,
  textColor: string,
  subTextColor: string,
  iconColor: string,
  accentColor: string,
  title: string,
  description: string,
}> = {
  'Classic': {
    icon: Shield,
    gradient: 'from-slate-200 via-slate-300 to-slate-400',
    bannerBg: 'bg-slate-700',
    textColor: 'text-slate-900',
    subTextColor: 'text-slate-700',
    iconColor: 'text-white',
    accentColor: 'bg-slate-400/30',
    title: 'ผู้พิชิตจุดเริ่มต้น',
    description: 'คุณคือหนึ่งในไม่กี่คนที่ผ่านจุดที่ยากที่สุดมาได้สำเร็จ การตัดสินใจ "เริ่ม" คือก้าวที่ยิ่งใหญ่ที่สุดแล้ว'
  },
  'Silver': {
    icon: ShieldCheck,
    gradient: 'from-zinc-300 via-zinc-400 to-zinc-500',
    bannerBg: 'bg-zinc-800',
    textColor: 'text-zinc-900',
    subTextColor: 'text-zinc-800',
    iconColor: 'text-white',
    accentColor: 'bg-zinc-500/30',
    title: 'ก้าวข้ามขีดจำกัด',
    description: 'คุณผ่านช่วงที่ทรมานร่างกายที่สุดมาได้แล้ว ความอดทนในระดับนี้พิสูจน์ว่าคุณแกร่งและเก่งมาก'
  },
  'Gold': {
    icon: Trophy,
    gradient: 'from-amber-200 via-yellow-400 to-orange-500',
    bannerBg: 'bg-amber-900',
    textColor: 'text-amber-950',
    subTextColor: 'text-amber-900',
    iconColor: 'text-white',
    accentColor: 'bg-white/30',
    title: 'คนใหม่ใจแกร่ง',
    description: 'เกือบเดือนแล้วที่ไม่มีมัน ตอนนี้ร่างกายคุณคนใหม่สดชื่น สดใส ขึ้นมาก'
  },
  'Platinum': {
    icon: BadgeCheck,
    gradient: 'from-cyan-200 via-teal-400 to-blue-500',
    bannerBg: 'bg-teal-900',
    textColor: 'text-teal-950',
    subTextColor: 'text-teal-900',
    iconColor: 'text-white',
    accentColor: 'bg-white/30',
    title: 'รางวัลของคนจริง',
    description: '2 เดือนที่สม่ำเสมอคือเครื่องยืนยันว่าคุณทวงคืนสุขภาพกลับมาได้สำเร็จ ภูมิใจในตัวเองได้เลย'
  },
  'Crown': {
    icon: Crown,
    gradient: 'from-purple-300 via-indigo-500 to-purple-800',
    bannerBg: 'bg-indigo-950',
    textColor: 'text-white',
    subTextColor: 'text-indigo-100',
    iconColor: 'text-yellow-300',
    accentColor: 'bg-white/20',
    title: 'ที่สุดของคนจริง',
    description: 'ขอชื่นชมในความกล้าหาญ อดทน แข็งแกร่ง คุณมาถึงระดับสูงสุดแล้ว เป็นอิสระจากมันได้อย่างเต็มภาคภูมิ'
  }
}

export const RankCard: React.FC<RankCardProps> = ({
  name,
  period,
  nextRankDays,
  nextRankName,
  className
}) => {
  const config = rankConfig[name] || rankConfig['Classic']
  const Icon = config.icon

  const currentDays = period || 0
  const progressPct = nextRankDays
    ? Math.min(100, Math.round((currentDays / nextRankDays) * 100))
    : 100

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 border-black/10 w-full max-w-xl mx-auto group transition-all duration-500",
      "bg-linear-to-br", config.gradient,
      className
    )}>

      {/* Body: icon | content | stats, laid out horizontally */}
      <div className="relative z-10 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-black/10">

        {/* Icon + Rank identity */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-0.5 px-4 py-3 sm:w-24 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
            <div className={cn("absolute w-10 h-10 rounded-full blur-md opacity-50", config.accentColor)} />
            <div className={cn("relative z-10 p-2 rounded-xl", config.accentColor)}>
              <Icon className={cn("w-5 h-5", config.iconColor)} />
            </div>
          </div>

          <div className="flex flex-col sm:items-center">
            <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", config.textColor)}>
              Rank
            </span>
            <h3 className={cn("text-base font-black tracking-tight leading-none", config.textColor)}>
              {name}
            </h3>
          </div>
        </div>

        {/* Title + description — main content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 px-4 py-3">
          <span className={cn("text-sm font-black tracking-tight leading-none", config.textColor)}>
            {config.title}
          </span>
          <p className={cn("text-xs font-semibold leading-snug line-clamp-2", config.textColor)}>
            {config.description}
          </p>
        </div>

        {/* Stats: current vs next rank, with progress */}
        {nextRankDays ? (
          <div className="flex flex-col justify-center gap-1.5 px-4 py-3 sm:w-36 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-xs font-black tabular-nums", config.textColor)}>
                {currentDays}<span className="text-[9px] font-bold opacity-60"> d</span>
              </span>
              <span className={cn("text-[9px] font-black uppercase tracking-wider opacity-50", config.textColor)}>
                / {nextRankDays}d
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-black/30"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Banner */}
      <div className={cn(
        "w-full py-1.5 px-4 text-center relative overflow-hidden",
        config.bannerBg
      )}>
        <p className="text-white text-[11px] font-bold tracking-wide relative z-10 truncate">
          {nextRankDays ? `พยายามต่อไปนะ! เป้าหมายต่อไปที่ระดับ ${nextRankName}` : "สุดยอด! รักษาเป้าหมายของคุณไว้ให้ดีที่สุดนะ"}
        </p>
      </div>
    </div>
  )
}