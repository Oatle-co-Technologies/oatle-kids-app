import { useState } from "react";

export default function PasswordField({ id, label, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-password-field">
      <label htmlFor={id}>{label}</label>
      <div className="login-password-input">
        <input {...inputProps} id={id} type={visible ? "text" : "password"} />
        <button
          className="login-password-toggle"
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible(value => !value)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
