export default function MetricCard({ title, value, color = 'text-gray-900', icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>
            {typeof value === 'number' ? `${value.toFixed(2)} €` : value}
          </p>
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  )
}
