"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";
  const from = searchParams.get("from") || "/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("from", from);

    const res = await fetch("/api/auth", {
      method: "POST",
      body: fd,
      redirect: "manual",
    });

    if (res.type === "opaqueredirect" || res.ok) {
      window.location.href = from;
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#1e293b",
        padding: "40px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "360px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <div style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}>
            Ashridge Group
          </div>
          <h1 style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
          }}>
            Dashboard
          </h1>
        </div>

        <form onSubmit={handleSubmit} method="POST" action="/api/auth">
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              color: "#94a3b8",
              marginBottom: "6px",
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {hasError && (
            <div style={{
              padding: "10px 12px",
              background: "#7f1d1d",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "16px",
            }}>
              Incorrect password. Try again.
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "11px",
              background: "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
