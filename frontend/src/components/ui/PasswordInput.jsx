import { useState } from "react";
import { Eye, EyeOff, Lock } from "../icons.jsx";

// Champ mot de passe avec bouton « afficher / masquer »
export default function PasswordInput({ value, onChange, autoComplete = "current-password", minLength, required = true, placeholder, autoFocus, id, withIcon = true }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {withIcon && <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />}
      <input
        id={id}
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        className={`input pr-10 ${withIcon ? "pl-10" : ""}`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/40 hover:text-ink"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
