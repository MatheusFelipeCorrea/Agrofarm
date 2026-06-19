import { DEFAULT_ADMIN_RESET_PASSWORD } from "../../constants/passwordDefaults.js";

export default function TemporaryPasswordNotice({ className = "" }) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className}`.trim()}
      role="status"
    >
      <p className="font-medium">Senha temporária</p>
      <p className="mt-1 font-mono text-base tracking-wide">{DEFAULT_ADMIN_RESET_PASSWORD}</p>
      <p className="mt-2 text-amber-900/90">
        Repasse essa senha ao usuário por um canal seguro. No primeiro acesso ele será obrigado a definir uma nova
        senha.
      </p>
    </div>
  );
}
