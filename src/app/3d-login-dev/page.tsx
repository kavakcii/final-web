"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ThreeDLoginDev() {
  const [zoomProgress, setZoomProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const animRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  // Camera zoom animation - approaches the building
  useEffect(() => {
    const duration = 8000; // 8 seconds to reach the door

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setZoomProgress(eased);

      if (eased > 0.75 && !showForm) {
        setShowForm(true);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  // Zoom: 1x -> 3.5x, focused on the entrance door area
  const scale = 1 + zoomProgress * 2.5;
  // Subtle vertical shift to focus on the door as we zoom
  const translateY = zoomProgress * 8;
  // Slight brightness increase as we approach
  const brightness = 1 + zoomProgress * 0.15;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "#0a1628",
    }}>
      {/* === ANIMATED STORE IMAGE === */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('/store-building.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 45%",
          backgroundRepeat: "no-repeat",
          transform: `scale(${scale}) translateY(${translateY}%)`,
          transformOrigin: "center 55%",
          filter: `brightness(${brightness})`,
          transition: "filter 0.5s ease",
          willChange: "transform",
        }}
      />

      {/* === AMBIENT PARTICLES (floating lights) === */}
      <ParticleOverlay />

      {/* === VIGNETTE OVERLAY === */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        background: `radial-gradient(ellipse at center, transparent 30%, rgba(5,10,25,${0.3 + zoomProgress * 0.3}) 100%)`,
        pointerEvents: "none",
        zIndex: 5,
      }} />

      {/* === GLOW EFFECT AT DOOR === */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "300px", height: "400px",
        transform: "translate(-50%, -40%)",
        background: "radial-gradient(ellipse, rgba(34,211,238,0.15), transparent 70%)",
        opacity: zoomProgress > 0.5 ? (zoomProgress - 0.5) * 4 : 0,
        transition: "opacity 1s ease",
        pointerEvents: "none",
        zIndex: 6,
      }} />

      {/* === NEON SCAN LINE EFFECT === */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(34,211,238,0.02) 3px,
          rgba(34,211,238,0.02) 4px
        )`,
        opacity: zoomProgress * 0.6,
        pointerEvents: "none",
        zIndex: 7,
      }} />

      {/* === LOGIN FORM === */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 20,
        pointerEvents: showForm ? "auto" : "none",
        opacity: showForm ? 1 : 0,
        transition: "opacity 1.5s ease",
      }}>
        <div style={{
          width: 380, padding: 40, borderRadius: 24,
          background: "rgba(5, 12, 28, 0.88)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(34,211,238,0.2)",
          boxShadow: `
            0 0 100px rgba(34,211,238,0.12),
            0 30px 60px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `,
          transform: showForm ? "translateY(0) scale(1)" : "translateY(50px) scale(0.9)",
          transition: "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s ease",
          opacity: showForm ? 1 : 0,
        }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -1.5 }}>
              Fin<span style={{
                background: "linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>AL</span>
            </h1>
          </div>
          <p style={{
            textAlign: "center", color: "rgba(255,255,255,0.5)",
            fontSize: 14, marginBottom: 30, fontWeight: 300,
          }}>
            {isLogin ? "Tekrar hoşgeldiniz" : "Yeni hesap oluşturun"}
          </p>

          <form onSubmit={handleSubmit}>
            <InputField
              type="email" placeholder="E-posta adresiniz"
              value={email} onChange={setEmail}
            />
            <InputField
              type="password" placeholder="Şifreniz"
              value={password} onChange={setPassword}
            />
            {!isLogin && (
              <InputField type="password" placeholder="Şifre tekrar" value="" onChange={() => { }} />
            )}

            <button type="submit" disabled={isLoading} style={{
              width: "100%", padding: 15, marginTop: 10,
              background: "linear-gradient(135deg, #0891b2, #06b6d4, #22d3ee)",
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              position: "relative", overflow: "hidden",
            }}>
              {isLoading ? (
                <div style={{
                  width: 20, height: 20,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : (isLogin ? "Giriş Yap →" : "Kayıt Ol →")}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2, fontWeight: 500 }}>VEYA</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Social */}
          <div style={{ display: "flex", gap: 12 }}>
            {["Google", "GitHub"].map((n) => (
              <button key={n} style={{
                flex: 1, padding: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, color: "#fff", fontSize: 13,
                fontWeight: 500, cursor: "pointer", transition: "all 0.3s",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >{n}</button>
            ))}
          </div>

          {/* Toggle */}
          <p style={{
            textAlign: "center", color: "rgba(255,255,255,0.4)",
            fontSize: 13, marginTop: 24,
          }}>
            {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button onClick={() => setIsLogin(!isLogin)} style={{
              background: "none", border: "none", color: "#22d3ee",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              textDecoration: "underline", textUnderlineOffset: 3,
            }}>
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </p>
        </div>
      </div>

      {/* === SKIP BUTTON === */}
      {!showForm && (
        <button
          onClick={() => { setZoomProgress(1); setShowForm(true); }}
          style={{
            position: "absolute", bottom: 30, right: 30, zIndex: 30,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12, color: "rgba(255,255,255,0.6)",
            padding: "10px 22px", fontSize: 13, cursor: "pointer",
            backdropFilter: "blur(10px)", transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          Atla →
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// =============================================
// INPUT FIELD COMPONENT
// =============================================
function InputField({ type, placeholder, value, onChange }: {
  type: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{
          width: "100%", padding: "14px 16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, color: "#fff", fontSize: 14,
          outline: "none", boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "rgba(34,211,238,0.5)";
          e.target.style.boxShadow = "0 0 25px rgba(34,211,238,0.12)";
          e.target.style.background = "rgba(34,211,238,0.05)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.1)";
          e.target.style.boxShadow = "none";
          e.target.style.background = "rgba(255,255,255,0.05)";
        }}
      />
    </div>
  );
}

// =============================================
// FLOATING PARTICLES OVERLAY
// =============================================
function ParticleOverlay() {
  const particles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.4,
  }));

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 4, overflow: "hidden",
    }}>
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute",
          bottom: "-10px",
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          background: `rgba(34, 211, 238, ${p.opacity})`,
          boxShadow: `0 0 ${p.size * 2}px rgba(34, 211, 238, ${p.opacity * 0.5})`,
          animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}
