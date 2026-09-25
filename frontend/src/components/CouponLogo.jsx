import React, { useState } from "react";
import { detectBrand } from "../utils/brandLogos";

export default function CouponLogo({ title = "", sourceApp = "", description = "", size = 44, className = "" }) {
  const brand = detectBrand(title, sourceApp, description);
  const [imgError, setImgError] = useState(false);

  // If no brand recognized at all, show generic coupon ticket icon
  if (!brand) {
    return (
      <div
        className={`d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          backgroundColor: "#f1f3f5",
          color: "#495057",
          fontSize: Math.max(12, Math.floor(size * 0.45)),
          fontWeight: "bold",
          border: "1px solid #dee2e6"
        }}
        title="Coupon"
      >
        🎟️
      </div>
    );
  }

  // Primary: Logo image from Google Favicon High-Res service (reliable, always up-to-date)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`;

  return (
    <div
      className={`d-inline-flex align-items-center justify-content-center rounded-3 overflow-hidden shadow-sm position-relative ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: brand.badgeBg || "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        padding: 3
      }}
      title={brand.name}
    >
      {!imgError ? (
        <img
          src={faviconUrl}
          alt={brand.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 4
          }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : brand.svg ? (
        brand.svg
      ) : (
        <span
          style={{
            color: brand.badgeColor || "#ffffff",
            fontWeight: "700",
            fontSize: Math.max(10, Math.floor(size * 0.32)),
            textAlign: "center",
            lineHeight: 1,
            textTransform: "uppercase"
          }}
        >
          {brand.iconText || brand.name.slice(0, 3)}
        </span>
      )}
    </div>
  );
}
