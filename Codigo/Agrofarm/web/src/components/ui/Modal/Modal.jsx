import * as Dialog from "@radix-ui/react-dialog";
import { isModalPortalTarget } from "../../../lib/modalPortalTargets.js";
import { cn } from "../../../lib/utils.js";

export function Modal({ open, onOpenChange, children }) {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			{children}
		</Dialog.Root>
	);
}

export function ModalPortal({ children }) {
	return <Dialog.Portal>{children}</Dialog.Portal>;
}

export function ModalOverlay({ className, ...props }) {
	return (
		<Dialog.Overlay
			className={cn("fixed inset-0 z-[200] bg-black/35 backdrop-blur-[2px]", className)}
			{...props}
		/>
	);
}

export function ModalContent({ className, overlayClassName, children, onEscapeKeyDown, onInteractOutside, ...props }) {
	const handleInteractOutside = (event) => {
		const originalTarget = event?.detail?.originalEvent?.target;
		const shouldKeepOpen =
			isModalPortalTarget(event?.target) || isModalPortalTarget(originalTarget);

		if (shouldKeepOpen) {
			event.preventDefault();
			return;
		}

		onInteractOutside?.(event);
	};

	return (
		<ModalPortal>
			<ModalOverlay className={overlayClassName} />
			<Dialog.Content
				className={cn(
					"fixed left-1/2 top-1/2 z-[201] w-[min(92vw,920px)] max-h-[92dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain focus-visible:outline-none",
					className,
				)}
				onEscapeKeyDown={onEscapeKeyDown}
				onPointerDownOutside={handleInteractOutside}
				onFocusOutside={handleInteractOutside}
				onInteractOutside={handleInteractOutside}
				{...props}
			>
				{children}
			</Dialog.Content>
		</ModalPortal>
	);
}

export function ModalHeader({ className, ...props }) {
	return <div className={cn("px-6 py-5", className)} {...props} />;
}

export function ModalTitle({ className, ...props }) {
  return <Dialog.Title className={cn("text-lg font-semibold text-gray-900", className)} {...props} />;
}

export function ModalDescription({ className, ...props }) {
  return <Dialog.Description className={cn("text-sm text-gray-500", className)} {...props} />;
}

export function ModalBody({ className, ...props }) {
	return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function ModalFooter({ className, ...props }) {
	return <div className={cn("flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end", className)} {...props} />;
}

export const ModalClose = Dialog.Close;

export default Modal;

