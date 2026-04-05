export default function CategoryBar({ name, spent, limit, color }) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const isOver = spent > limit

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{name}</span>
        <span className={isOver ? 'text-red-500 font-semibold' : 'text-gray-500'}>
          {spent.toFixed(2)} € / {limit.toFixed(2)} €
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOver ? '#ef4444' : (color || '#1D9E75'),
          }}
        />
      </div>
    </div>
  )
}
