/**
 * Tooltip em hover/foco para campos bloqueados ou com dica.
 */
export default function FieldTooltip({ children, message, active = true, className = "" }) {
	if (!active || !message) {
		return children;
	}

	return (
		<div className={`group relative w-full ${className}`}>
			{children}
			<div
				role="tooltip"
				className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
			>
				{message}
				<span
					className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"
					aria-hidden
				/>
			</div>
		</div>
	);
}
