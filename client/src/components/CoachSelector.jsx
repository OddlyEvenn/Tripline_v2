/**
 * CoachSelector — Renders a list of train coaches as clickable tabs.
 */
export default function CoachSelector({ coaches = [], selectedCoach, onSelect }) {
    return (
        <div className="flex flex-wrap gap-2">
            {coaches.map(coach => (
                <button
                    key={coach}
                    type="button"
                    onClick={() => onSelect(coach)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all
            ${selectedCoach === coach
                            ? 'bg-primary-600 border-primary-500 text-white shadow-glow'
                            : 'bg-white/5 border-white/20 text-gray-300 hover:border-primary-500 hover:bg-primary-500/10'}`}
                >
                    {coach}
                </button>
            ))}
        </div>
    )
}
