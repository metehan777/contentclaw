import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const COLORS = {
  bg: "#0a0a0f",
  bgGrad1: "#0f0f1a",
  bgGrad2: "#0a0a0f",
  accent: "#6366f1",
  accentLight: "#818cf8",
  accentGlow: "rgba(99, 102, 241, 0.3)",
  green: "#22c55e",
  greenGlow: "rgba(34, 197, 94, 0.2)",
  yellow: "#eab308",
  cyan: "#06b6d4",
  text: "#f8fafc",
  textDim: "#94a3b8",
  surface: "#1e1e2e",
  border: "#2e2e3e",
};

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const monoFont = '"SF Mono", "Fira Code", "Consolas", monospace';

// Scene 1: Logo + Tagline Intro (0-90 frames = 0-3s)
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateRight: "clamp",
  });
  const byLineOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  const glowPulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bgGrad1}, ${COLORS.bgGrad2})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${COLORS.border}44 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}44 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />

      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlow}, transparent 70%)`,
          opacity: glowPulse * 0.6,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Logo text */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: -3,
            textShadow: `0 0 60px ${COLORS.accentGlow}`,
          }}
        >
          Content
          <span style={{ color: COLORS.accent }}>Claw</span>
        </div>

        {/* Claw emoji */}
        <div style={{ fontSize: 64, marginTop: -10 }}>🦞</div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontSize: 36,
            color: COLORS.textDim,
            fontWeight: 400,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Universal Content Engine
        </div>

        {/* By line */}
        <div
          style={{
            opacity: byLineOpacity,
            fontSize: 22,
            color: COLORS.accent,
            fontWeight: 500,
          }}
        >
          by metehan.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Problem Statement (90-165 = 3s-5.5s)
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    "Creating 100+ content pages manually?",
    "Copy-pasting into your CMS one by one?",
    "No internal links, no structure, no strategy?",
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1a0a0a, ${COLORS.bg})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {lines.map((line, i) => {
          const lineFrame = frame - i * 20;
          const opacity = interpolate(lineFrame, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = interpolate(lineFrame, [0, 15], [-60, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                fontSize: 42,
                color: COLORS.text,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <span style={{ color: "#ef4444", fontSize: 36 }}>✗</span>
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Solution - CLI Demo (165-255 = 5.5s-8.5s)
const CLIScene: React.FC = () => {
  const frame = useCurrentFrame();

  const terminalScale = spring({
    frame,
    fps: 30,
    config: { damping: 14, mass: 0.6 },
  });

  const lines = [
    { text: "$ npm install -g contentclaw", delay: 10, color: COLORS.green },
    { text: "$ contentclaw init", delay: 25, color: COLORS.green },
    { text: '$ contentclaw generate "technical seo"', delay: 40, color: COLORS.cyan },
    { text: "", delay: 50, color: COLORS.textDim },
    { text: "  ✔ Planned 22 pages for \"technical seo\"", delay: 55, color: COLORS.green },
    { text: "  ✔ [1/22] [glossary] What is Crawl Budget -> /what-is-crawl-budget", delay: 62, color: COLORS.text },
    { text: "  ✔ [2/22] [comparison] Screaming Frog vs Sitebulb -> /screaming-frog-vs-sitebulb", delay: 68, color: COLORS.text },
    { text: "  ✔ [3/22] [listicle] 9 Best Technical SEO Tools -> /best-technical-seo-tools", delay: 74, color: COLORS.text },
    { text: "  ✔ [4/22] [how-to] How to Fix Crawl Errors -> /how-to-fix-crawl-errors", delay: 80, color: COLORS.text },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${COLORS.bgGrad1}, ${COLORS.bgGrad2})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: monoFont,
      }}
    >
      <div
        style={{
          transform: `scale(${terminalScale})`,
          width: 1500,
          background: "#0d0d1a",
          borderRadius: 20,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          boxShadow: `0 40px 100px rgba(0,0,0,0.5), 0 0 60px ${COLORS.accentGlow}`,
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            background: "#161625",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS.yellow }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS.green }} />
          <span style={{ color: COLORS.textDim, fontSize: 14, marginLeft: 12 }}>
            Terminal - contentclaw
          </span>
        </div>

        {/* Terminal body */}
        <div style={{ padding: "24px 28px", minHeight: 380 }}>
          {lines.map((line, i) => {
            const lineOpacity = interpolate(frame, [line.delay, line.delay + 5], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity: lineOpacity,
                  fontSize: 22,
                  color: line.color,
                  lineHeight: 1.8,
                  whiteSpace: "nowrap",
                }}
              >
                {line.text || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Features Grid (255-345 = 8.5s-11.5s)
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const features = [
    { icon: "🤖", title: "6 AI Providers", desc: "OpenAI, Gemini, Anthropic, xAI, Qwen, Ollama" },
    { icon: "📄", title: "9 Content Types", desc: "Blog, glossary, comparison, listicle, how-to, review..." },
    { icon: "🔗", title: "Smart Linking", desc: "Internal links validated, external links web-grounded" },
    { icon: "⚡", title: "Parallel Gen", desc: "Rate-limited batch processing, 5000+ pages" },
    { icon: "🎯", title: "Competitor Analysis", desc: "Crawl sitemaps, find gaps, beat their content" },
    { icon: "🌐", title: "Universal API", desc: "REST API for any CMS - WordPress, Webflow, Framer" },
  ];

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.08), transparent 60%), ${COLORS.bg}`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
        <div
          style={{
            opacity: titleOpacity,
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: -1,
          }}
        >
          Everything You Need
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            width: 1500,
          }}
        >
          {features.map((f, i) => {
            const cardFrame = frame - 10 - i * 8;
            const cardScale = spring({
              frame: Math.max(0, cardFrame),
              fps: 30,
              config: { damping: 12, mass: 0.5 },
            });
            const cardOpacity = interpolate(cardFrame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 40 }}>{f.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 19, color: COLORS.textDim, lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Content Types Showcase (345-405 = 11.5s-13.5s)
const ContentTypesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const types = [
    { type: "blog", color: "#6366f1" },
    { type: "glossary", color: "#8b5cf6" },
    { type: "comparison", color: "#06b6d4" },
    { type: "listicle", color: "#22c55e" },
    { type: "how-to", color: "#eab308" },
    { type: "alternatives", color: "#f97316" },
    { type: "review", color: "#ef4444" },
    { type: "landing", color: "#ec4899" },
    { type: "hub", color: "#14b8a6" },
  ];

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
        <div style={{ opacity: titleOpacity, fontSize: 52, fontWeight: 800, color: COLORS.text }}>
          9 Content Types. One Command.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 1400 }}>
          {types.map((t, i) => {
            const pillFrame = frame - 12 - i * 4;
            const pillScale = spring({
              frame: Math.max(0, pillFrame),
              fps: 30,
              config: { damping: 10, mass: 0.4 },
            });

            return (
              <div
                key={i}
                style={{
                  transform: `scale(${pillScale})`,
                  background: `${t.color}20`,
                  border: `2px solid ${t.color}`,
                  borderRadius: 50,
                  padding: "16px 36px",
                  fontSize: 28,
                  fontWeight: 700,
                  color: t.color,
                  letterSpacing: 0.5,
                }}
              >
                {t.type}
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: interpolate(frame, [40, 50], [0, 1], { extrapolateRight: "clamp" }),
            fontSize: 30,
            color: COLORS.textDim,
          }}
        >
          Or let AI plan your entire content strategy with{" "}
          <span style={{ color: COLORS.accent, fontWeight: 700 }}>auto</span> mode
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: CTA / Outro (405-450 = 13.5s-15s)
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainScale = spring({ frame, fps, config: { damping: 10, mass: 0.6 } });
  const cmdOpacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" });
  const linksOpacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });

  const glowPulse = Math.sin(frame * 0.12) * 0.4 + 0.6;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.15), ${COLORS.bg})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlow}, transparent 70%)`,
          opacity: glowPulse * 0.4,
          filter: "blur(100px)",
        }}
      />

      <div
        style={{
          transform: `scale(${mainScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, color: COLORS.text, letterSpacing: -2 }}>
          Start Building <span style={{ color: COLORS.accent }}>Now</span>
        </div>

        <div
          style={{
            opacity: cmdOpacity,
            background: "#0d0d1a",
            border: `2px solid ${COLORS.accent}`,
            borderRadius: 16,
            padding: "20px 48px",
            fontSize: 32,
            fontFamily: monoFont,
            color: COLORS.green,
            boxShadow: `0 0 40px ${COLORS.accentGlow}`,
          }}
        >
          $ npm install -g contentclaw
        </div>

        <div
          style={{
            opacity: linksOpacity,
            display: "flex",
            gap: 40,
            fontSize: 24,
            color: COLORS.textDim,
            marginTop: 16,
          }}
        >
          <span>
            npmjs.com/package/<span style={{ color: COLORS.accent }}>contentclaw</span>
          </span>
          <span style={{ color: COLORS.border }}>|</span>
          <span>
            github.com/metehan777/<span style={{ color: COLORS.accent }}>contentclaw</span>
          </span>
        </div>

        <div
          style={{
            opacity: linksOpacity,
            fontSize: 22,
            color: COLORS.accent,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          by metehan.ai
        </div>

        {/* Google disclaimer */}
        <div
          style={{
            opacity: interpolate(frame, [60, 75], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            marginTop: 32,
            maxWidth: 900,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            background: "rgba(234, 179, 8, 0.06)",
            border: `1px solid rgba(234, 179, 8, 0.2)`,
            borderRadius: 12,
            padding: "16px 28px",
          }}
        >
          <div style={{ fontSize: 18, color: COLORS.yellow, fontWeight: 600 }}>
            Disclaimer
          </div>
          <div
            style={{
              fontSize: 15,
              color: COLORS.textDim,
              lineHeight: 1.6,
            }}
          >
            Publishing large volumes of AI-generated content at once may trigger
            Google quality filters or algorithm penalties. Always review, edit,
            and add unique value before publishing. Drip-feed pages gradually
            and monitor Google Search Console.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={180}>
        <IntroScene />
      </Sequence>

      <Sequence from={180} durationInFrames={165}>
        <ProblemScene />
      </Sequence>

      <Sequence from={345} durationInFrames={180}>
        <CLIScene />
      </Sequence>

      <Sequence from={525} durationInFrames={180}>
        <FeaturesScene />
      </Sequence>

      <Sequence from={705} durationInFrames={150}>
        <ContentTypesScene />
      </Sequence>

      <Sequence from={855} durationInFrames={135}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
