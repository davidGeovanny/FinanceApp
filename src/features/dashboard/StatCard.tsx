interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  sub?: string;
}

export function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#8899AA] font-medium">{label}</span>
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </span>
      </div>
      <p
        className="text-lg font-semibold tabular-nums truncate"
        style={{ color }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[#8899AA] mt-0.5 truncate">{sub}</p>}
    </div>
  );
}