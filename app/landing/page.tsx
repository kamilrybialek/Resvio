'use client';

import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --bg: #0a0a0f;
          --bg-card: #111118;
          --bg-card-hover: #16161f;
          --border: rgba(255,255,255,0.07);
          --border-accent: rgba(99,102,241,0.35);
          --text: #f0f0f5;
          --text-muted: #8b8ba7;
          --text-faint: #4a4a6a;
          --accent: #6366f1;
          --accent2: #818cf8;
          --accent3: #a5b4fc;
          --teal: #2dd4bf;
          --gold: #f59e0b;
          --grad: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%);
          --grad-text: linear-gradient(135deg, #818cf8, #a5b4fc);
          --grad-btn: linear-gradient(135deg, #6366f1, #4f46e5);
          --shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04);
          --shadow-accent: 0 0 40px rgba(99,102,241,0.15);
          --radius: 12px;
          --radius-lg: 20px;
          --font: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ─── NAV ─── */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
          border-bottom: 1px solid transparent;
        }

        .nav.scrolled {
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom-color: var(--border);
        }

        .nav-inner {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: var(--grad);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(99,102,241,0.4);
        }

        .logo-text {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .logo-text span {
          background: var(--grad-text);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        .nav-links a {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--text);
        }

        .nav-cta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          border: none;
          outline: none;
          letter-spacing: -0.1px;
        }

        .btn-primary {
          background: var(--grad-btn);
          color: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.5);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.6);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
        }

        .btn-ghost:hover {
          color: var(--text);
        }

        .btn-lg {
          padding: 13px 28px;
          font-size: 15px;
          border-radius: 10px;
        }

        .btn-outline {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-outline:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.04);
        }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 40%, transparent 70%);
          pointer-events: none;
        }

        .hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(to bottom, transparent, var(--bg));
          pointer-events: none;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          font-size: 12px;
          font-weight: 600;
          color: var(--accent3);
          margin-bottom: 32px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-inner {
          max-width: 800px;
          position: relative;
          z-index: 2;
        }

        .hero h1 {
          font-size: clamp(42px, 7vw, 80px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -2px;
          margin-bottom: 24px;
          color: #fff;
        }

        .hero h1 strong {
          background: var(--grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(16px, 2.5vw, 20px);
          color: var(--text-muted);
          max-width: 580px;
          margin: 0 auto 40px;
          line-height: 1.65;
        }

        .hero-ctas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 72px;
        }

        .hero-ctas .btn-lg {
          min-width: 160px;
        }

        .hero-note {
          font-size: 12px;
          color: var(--text-faint);
          margin-top: -8px;
        }

        /* ─── BROWSER MOCKUP ─── */
        .browser-mockup {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.1);
        }

        .browser-bar {
          background: #1a1a27;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .browser-dots {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .browser-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .browser-dot:nth-child(1) { background: #ff5f57; }
        .browser-dot:nth-child(2) { background: #febc2e; }
        .browser-dot:nth-child(3) { background: #28c840; }

        .browser-url {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 12px;
          color: var(--text-faint);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .browser-url-lock {
          color: #28c840;
          font-size: 10px;
        }

        .browser-body {
          background: #0d0d14;
          padding: 20px;
          min-height: 340px;
        }

        .mock-search-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .mock-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mock-input-icon {
          color: var(--text-faint);
          font-size: 12px;
        }

        .mock-search-btn {
          background: var(--grad-btn);
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .mock-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .mock-filter-tag {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-muted);
        }

        .mock-filter-tag.active {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          color: var(--accent3);
        }

        .mock-jobs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mock-job-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.2s;
        }

        .mock-job-card:hover {
          border-color: rgba(99,102,241,0.3);
        }

        .mock-company-logo {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }

        .mock-job-info {
          flex: 1;
          min-width: 0;
        }

        .mock-job-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mock-job-meta {
          font-size: 11px;
          color: var(--text-faint);
          display: flex;
          gap: 10px;
        }

        .mock-score-badge {
          padding: 4px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .score-high {
          background: rgba(45,212,191,0.15);
          color: #2dd4bf;
          border: 1px solid rgba(45,212,191,0.25);
        }

        .score-med {
          background: rgba(245,158,11,0.12);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.2);
        }

        .mock-source {
          font-size: 10px;
          color: var(--text-faint);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 2px 7px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        /* ─── SECTIONS ─── */
        .section {
          padding: 96px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .section-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }

        .section-title {
          font-size: clamp(30px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.12;
          color: #fff;
          margin-bottom: 16px;
        }

        .section-sub {
          font-size: 17px;
          color: var(--text-muted);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ─── FEATURES ─── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
          cursor: default;
        }

        .feature-card:hover {
          border-color: var(--border-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-accent);
          background: var(--bg-card-hover);
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .feature-card p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ─── HOW IT WORKS ─── */
        .steps-section {
          background: linear-gradient(180deg, transparent, rgba(99,102,241,0.04) 50%, transparent);
          padding: 96px 0;
        }

        .steps-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          position: relative;
        }

        .steps-grid::before {
          content: '';
          position: absolute;
          top: 32px;
          left: calc(16.666% + 16px);
          right: calc(16.666% + 16px);
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(99,102,241,0.4) 30%, rgba(99,102,241,0.4) 70%, transparent);
        }

        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
          .steps-grid::before {
            display: none;
          }
        }

        .step-item {
          text-align: center;
          padding: 0 32px;
          position: relative;
        }

        .step-number {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid rgba(99,102,241,0.4);
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
          margin: 0 auto 24px;
          position: relative;
          z-index: 1;
        }

        .step-item h3 {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .step-item p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ─── PRICING ─── */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin: 0 auto;
          }
        }

        .pricing-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px 28px;
          position: relative;
          transition: transform 0.25s, box-shadow 0.25s;
        }

        .pricing-card.featured {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 20px 60px rgba(99,102,241,0.1);
          transform: scale(1.02);
        }

        @media (max-width: 900px) {
          .pricing-card.featured {
            transform: none;
          }
        }

        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--grad-btn);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .pricing-plan {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .pricing-price {
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -2px;
          line-height: 1;
          margin-bottom: 6px;
        }

        .pricing-price span {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-muted);
          letter-spacing: 0;
        }

        .pricing-desc {
          font-size: 13px;
          color: var(--text-faint);
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }

        .pricing-features {
          list-style: none;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pricing-features li {
          font-size: 14px;
          color: var(--text-muted);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.4;
        }

        .pricing-features li::before {
          content: '';
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          background-image: url("data:image/svg+xml,%3Csvg width='8' height='6' viewBox='0 0 8 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3L3 5L7 1' stroke='%236366f1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
        }

        .pricing-card.featured .pricing-features li::before {
          background-color: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5);
        }

        .pricing-btn {
          display: block;
          width: 100%;
          text-align: center;
          padding: 12px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .pricing-btn-primary {
          background: var(--grad-btn);
          color: #fff;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4);
        }

        .pricing-btn-primary:hover {
          box-shadow: 0 0 20px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.6);
        }

        .pricing-btn-secondary {
          background: rgba(255,255,255,0.04);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .pricing-btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .revenue-callout {
          margin-top: 48px;
          padding: 24px 28px;
          border-radius: var(--radius);
          background: rgba(99,102,241,0.05);
          border: 1px solid rgba(99,102,241,0.15);
          text-align: center;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .revenue-callout-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }

        .revenue-callout p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.7;
          font-style: italic;
        }

        .revenue-callout strong {
          color: var(--accent3);
          font-style: normal;
        }

        /* ─── TESTIMONIALS ─── */
        .testimonials-section {
          padding: 80px 24px;
          overflow: hidden;
        }

        .testimonials-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }

        .testimonial-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          transition: border-color 0.25s, transform 0.25s;
        }

        .testimonial-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }

        .testimonial-stars {
          display: flex;
          gap: 3px;
          margin-bottom: 16px;
        }

        .star {
          color: #f59e0b;
          font-size: 14px;
        }

        .testimonial-text {
          font-size: 15px;
          color: var(--text);
          line-height: 1.65;
          margin-bottom: 24px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .testimonial-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .testimonial-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .testimonial-role {
          font-size: 12px;
          color: var(--text-faint);
          margin-top: 1px;
        }

        /* ─── CTA BANNER ─── */
        .cta-section {
          padding: 80px 24px;
        }

        .cta-inner {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          padding: 64px 48px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.08) 100%);
          border: 1px solid rgba(99,102,241,0.25);
          position: relative;
          overflow: hidden;
        }

        .cta-inner::before {
          content: '';
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cta-inner h2 {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 800;
          letter-spacing: -1.5px;
          color: #fff;
          margin-bottom: 12px;
        }

        .cta-inner p {
          font-size: 16px;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .cta-inner .btn-lg {
          position: relative;
          z-index: 1;
        }

        /* ─── FOOTER ─── */
        .footer {
          border-top: 1px solid var(--border);
          padding: 48px 24px;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .footer-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
        }

        .footer-brand {
          max-width: 240px;
        }

        .footer-tagline {
          font-size: 13px;
          color: var(--text-faint);
          margin-top: 10px;
          line-height: 1.5;
        }

        .footer-links {
          display: flex;
          gap: 28px;
          list-style: none;
          flex-wrap: wrap;
        }

        .footer-links a {
          font-size: 14px;
          color: var(--text-faint);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--text-muted);
        }

        .footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 24px;
          font-size: 13px;
          color: var(--text-faint);
          text-align: center;
        }

        /* ─── MISC ─── */
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, var(--border) 30%, var(--border) 70%, transparent);
          margin: 0 24px;
        }

        /* ─── MOBILE NAV ─── */
        @media (max-width: 640px) {
          .nav-links { display: none; }
          .nav-cta .btn-ghost { display: none; }
        }

        @media (max-width: 480px) {
          .hero h1 { letter-spacing: -1px; }
          .hero-ctas { flex-direction: column; align-items: stretch; }
          .hero-ctas .btn-lg { text-align: center; justify-content: center; }
          .section { padding: 64px 20px; }
          .pricing-card.featured { transform: none; }
          .step-item { padding: 0 16px; }
          .cta-inner { padding: 48px 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="4" y="15" fill="white" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif">A</text>
                <path d="M14 4L16 2M16 2L18 4M16 2V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">Res<span>vio</span></span>
          </a>

          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/auth/login">Login</a></li>
          </ul>

          <div className="nav-cta">
            <a href="/auth/login" className="btn btn-ghost">Login</a>
            <a href="/search" className="btn btn-primary">Start Free</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Now searching 10+ European job boards
          </div>

          <h1>
            Find your next role <strong>faster</strong>,<br />with AI
          </h1>

          <p className="hero-sub">
            Resvio searches LinkedIn, Indeed, JustJoinIT, and 10+ job boards simultaneously.
            AI tailors your CV and writes cover letters for every application.
          </p>

          <div className="hero-ctas">
            <a href="/search" className="btn btn-primary btn-lg">Start for free</a>
            <a href="#features" className="btn btn-outline btn-lg">See how it works →</a>
          </div>

          {/* BROWSER MOCKUP */}
          <div className="browser-mockup">
            <div className="browser-bar">
              <div className="browser-dots">
                <div className="browser-dot" />
                <div className="browser-dot" />
                <div className="browser-dot" />
              </div>
              <div className="browser-url">
                <span className="browser-url-lock">🔒</span>
                resvio.online/search
              </div>
            </div>
            <div className="browser-body">
              <div className="mock-search-bar">
                <div className="mock-input">
                  <span className="mock-input-icon">🔍</span>
                  Senior Frontend Engineer · Remote · Europe
                </div>
                <div className="mock-search-btn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5"/><path d="M9.5 9.5L12.5 12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Search All
                </div>
              </div>

              <div className="mock-filters">
                <div className="mock-filter-tag active">🇸🇪 Sweden</div>
                <div className="mock-filter-tag active">🇵🇱 Poland</div>
                <div className="mock-filter-tag">🇩🇪 Germany</div>
                <div className="mock-filter-tag active">Remote only</div>
                <div className="mock-filter-tag">Full-time</div>
                <div className="mock-filter-tag active">AI Match: 75%+</div>
              </div>

              <div className="mock-jobs">
                <div className="mock-job-card">
                  <div className="mock-company-logo" style={{background: 'linear-gradient(135deg, #6366f1, #4f46e5)'}}>S</div>
                  <div className="mock-job-info">
                    <div className="mock-job-title">Senior Frontend Engineer</div>
                    <div className="mock-job-meta">
                      <span>Spotify · Stockholm</span>
                      <span>Posted 2h ago</span>
                    </div>
                  </div>
                  <div className="mock-score-badge score-high">94% match</div>
                  <div className="mock-source">LinkedIn</div>
                </div>

                <div className="mock-job-card">
                  <div className="mock-company-logo" style={{background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'}}>K</div>
                  <div className="mock-job-info">
                    <div className="mock-job-title">React Developer — Remote First</div>
                    <div className="mock-job-meta">
                      <span>Klarna · Remote</span>
                      <span>Posted 5h ago</span>
                    </div>
                  </div>
                  <div className="mock-score-badge score-high">88% match</div>
                  <div className="mock-source">Indeed</div>
                </div>

                <div className="mock-job-card">
                  <div className="mock-company-logo" style={{background: 'linear-gradient(135deg, #ec4899, #db2777)'}}>A</div>
                  <div className="mock-job-info">
                    <div className="mock-job-title">Mid/Senior React Engineer</div>
                    <div className="mock-job-meta">
                      <span>Allegro · Warsaw</span>
                      <span>Posted 1d ago</span>
                    </div>
                  </div>
                  <div className="mock-score-badge score-med">78% match</div>
                  <div className="mock-source">JustJoinIT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-header">
          <div className="section-tag">Features</div>
          <h2 className="section-title">Everything you need to<br />land the job</h2>
          <p className="section-sub">Built for serious job seekers across Europe. One platform, every market.</p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M3 11H19" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M11 3C11 3 8 7 8 11C8 15 11 19 11 19" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M11 3C11 3 14 7 14 11C14 15 11 19 11 19" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Multi-market search</h3>
            <p>5 European markets, 10+ job boards in a single search. LinkedIn, Indeed, JustJoinIT, Pracuj, Arbetsförmedlingen and more.</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2L13.5 8.5L20 9.3L15.5 13.5L16.9 20L11 16.8L5.1 20L6.5 13.5L2 9.3L8.5 8.5L11 2Z" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>AI match scoring</h3>
            <p>Every job scored against your profile. Focus only on positions where you have 75%+ compatibility. No more guessing.</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="2" width="16" height="18" rx="3" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M7 7H15" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 11H15" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 15H11" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="4" fill="#0d0d14" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M14.5 16L15.5 17L17.5 15" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>CV tailoring</h3>
            <p>One-click AI tailoring adapts your CV to each job description. Highlight the right skills, use the right keywords.</p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H12L8 20V16H4C2.9 16 2 15.1 2 14V6C2 4.9 2.9 4 4 4Z" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 9H15" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 12H12" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Cover letters</h3>
            <p>AI writes persuasive cover letters in the right language — English, Polish, Swedish, or German — matching company tone.</p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="18" height="16" rx="3" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M2 8H20" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M7 3V8" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M15 3V8" stroke="#818cf8" strokeWidth="1.5"/>
                <circle cx="7" cy="13" r="1.5" fill="#818cf8"/>
                <circle cx="11" cy="13" r="1.5" fill="#818cf8" fillOpacity="0.4"/>
                <circle cx="15" cy="13" r="1.5" fill="#818cf8" fillOpacity="0.2"/>
              </svg>
            </div>
            <h3>Application tracker</h3>
            <p>Track every application in one place. Know what you applied to, when, and what stage each is at. Never lose a lead.</p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="7" width="18" height="11" rx="3" stroke="#818cf8" strokeWidth="1.5"/>
                <path d="M7 7V5C7 3.9 7.9 3 9 3H13C14.1 3 15 3.9 15 5V7" stroke="#818cf8" strokeWidth="1.5"/>
                <circle cx="11" cy="13" r="2" stroke="#818cf8" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3>Remote-first</h3>
            <p>Dedicated remote search across all markets simultaneously. Find the best remote roles across Europe without the commute.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* HOW IT WORKS */}
      <div className="steps-section">
        <div className="steps-inner">
          <div className="section-header">
            <div className="section-tag">How it works</div>
            <h2 className="section-title">Three steps to your<br />next opportunity</h2>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Upload your CV</h3>
              <p>Paste your CV or upload a PDF. Our AI parses your skills, experience, and preferences to build your profile.</p>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Search & score</h3>
              <p>Run one search across all markets. Every result is scored against your profile. Filter to your top matches instantly.</p>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Apply with tailored CV</h3>
              <p>One click to tailor your CV and generate a cover letter for any job. Apply in minutes, not hours.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="section-header">
          <div className="section-tag">Pricing</div>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-sub">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card">
            <div className="pricing-plan">Free</div>
            <div className="pricing-price">0 <span>kr/mo</span></div>
            <p className="pricing-desc">For casual job seekers exploring new opportunities</p>
            <ul className="pricing-features">
              <li>3 CV tailorings per month</li>
              <li>Basic job search</li>
              <li>1 market</li>
              <li>Community support</li>
            </ul>
            <a href="/search" className="pricing-btn pricing-btn-secondary">Get started free</a>
          </div>

          {/* Starter — Featured */}
          <div className="pricing-card featured">
            <div className="pricing-badge">⭐ Most Popular</div>
            <div className="pricing-plan">Starter</div>
            <div className="pricing-price">49 <span>kr/mo</span></div>
            <p className="pricing-desc">For active job seekers ready to move fast</p>
            <ul className="pricing-features">
              <li>15 CV tailorings per month</li>
              <li>Cover letters included</li>
              <li>All 5 European markets</li>
              <li>AI match scoring</li>
              <li>Priority support</li>
            </ul>
            <a href="/search" className="pricing-btn pricing-btn-primary">Start Starter →</a>
          </div>

          {/* Pro */}
          <div className="pricing-card">
            <div className="pricing-plan">Pro</div>
            <div className="pricing-price">149 <span>kr/mo</span></div>
            <p className="pricing-desc">For power users and career professionals</p>
            <ul className="pricing-features">
              <li>Unlimited CV tailorings</li>
              <li>Multiple CV profiles</li>
              <li>Advanced analytics</li>
              <li>API access</li>
              <li>All markets + priority indexing</li>
            </ul>
            <a href="/search" className="pricing-btn pricing-btn-secondary">Go Pro</a>
          </div>
        </div>

        <div className="revenue-callout">
          <div className="revenue-callout-title">Market opportunity</div>
          <p>
            Estimated market: 200K+ active job seekers in Scandinavia &amp; Poland.
            At 2% conversion on Starter plan: ~4,000 users × 49 kr =&nbsp;
            <strong>196,000 kr/month revenue potential.</strong>
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* TESTIMONIALS */}
      <div className="testimonials-section">
        <div className="testimonials-inner">
          <div className="section-header">
            <div className="section-tag">Social proof</div>
            <h2 className="section-title">Loved by job seekers<br />across Europe</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="testimonial-text">
                &ldquo;Saved me 10 hours per week on job applications. The multi-market search is a game changer — I had no idea how many remote roles were out there.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{background: 'linear-gradient(135deg, #6366f1, #4f46e5)'}}>MK</div>
                <div>
                  <div className="testimonial-name">M.K.</div>
                  <div className="testimonial-role">Software Engineer · Warsaw</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="testimonial-text">
                &ldquo;The CV tailoring is incredibly accurate. I could immediately see the difference in the quality of responses I was getting from recruiters.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{background: 'linear-gradient(135deg, #2dd4bf, #0d9488)'}}>AN</div>
                <div>
                  <div className="testimonial-name">A.N.</div>
                  <div className="testimonial-role">Product Manager · Stockholm</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <p className="testimonial-text">
                &ldquo;Found my current job through Resvio in just 2 weeks. The AI match scoring meant I only applied to roles where I genuinely had a strong chance.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>PW</div>
                <div>
                  <div className="testimonial-name">P.W.</div>
                  <div className="testimonial-role">DevOps Engineer · Kraków</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to land your next job?</h2>
          <p>Join thousands of job seekers across Europe already using Resvio.</p>
          <a href="/search" className="btn btn-primary btn-lg">
            Start for free — no credit card required
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#" className="logo" style={{display: 'inline-flex', marginBottom: '0'}}>
                <div className="logo-icon" style={{width: '30px', height: '30px', borderRadius: '7px'}}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="4" y="15" fill="white" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif">A</text>
                  </svg>
                </div>
                <span className="logo-text">Res<span>vio</span></span>
              </a>
              <p className="footer-tagline">AI-powered job search for Europe</p>
            </div>

            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </div>

          <div className="footer-bottom">
            © 2025 Resvio. Built for Europe&apos;s job seekers.
          </div>
        </div>
      </footer>
    </>
  );
}
