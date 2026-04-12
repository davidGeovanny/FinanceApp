import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

const MONTH_LABELS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const prev = () => {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  };

  const next = () => {
    if (isCurrentMonth) return;
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#F0F4F8] hover:bg-white/5 transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-[#F0F4F8] min-w-[140px] text-center capitalize">
        {MONTH_LABELS[month]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#F0F4F8] hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}