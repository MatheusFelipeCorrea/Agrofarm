/** Alvos em portal (select, popover, datepicker) que não devem fechar o modal ao interagir. */
export function isModalPortalTarget(target) {
	if (!(target instanceof HTMLElement)) return false;

	return Boolean(
		target.closest("[data-radix-popper-content-wrapper]") ||
		target.closest("[data-radix-select-content]") ||
		target.closest("[data-radix-popover-content]") ||
		target.closest("[data-agro-select-content]") ||
		target.closest("[data-agro-picker-popover]") ||
		target.closest(".rdp"),
	);
}
