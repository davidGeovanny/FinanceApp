interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export function Badge({ label, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={
        color
          ? { backgroundColor: `${color}20`, color }
          : { backgroundColor: '#3D8BFF20', color: '#3D8BFF' }
      }
    >
      {label}
    </span>
  );
}