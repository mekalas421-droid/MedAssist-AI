export default function StatCard({ icon: Icon, label, value, delta, deltaTone = "up" }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100 shadow-card p-5 flex items-start justify-between animate-fadeUp">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-800/60">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-navy-900 font-mono">{value}</p>
        {delta && (
          <p
            className={`mt-1 text-xs font-medium ${
              deltaTone === "up" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {delta}
          </p>
        )}
      </div>
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
