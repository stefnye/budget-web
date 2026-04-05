export default function TransactionRow({ transaction, categories }) {
  const category = categories?.find((c) => c.id === transaction.category_id)
  const isExpense = transaction.amount < 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        {category?.color && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {transaction.description || 'Sans description'}
          </p>
          <p className="text-xs text-gray-500">
            {category?.name || 'Non catégorisé'} &middot; {transaction.date}
          </p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
        {isExpense ? '' : '+'}{Number(transaction.amount).toFixed(2)} €
      </span>
    </div>
  )
}
