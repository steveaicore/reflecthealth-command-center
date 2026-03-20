import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import penguinLogo from "@/assets/penguin-logo-pink.png";
import {
  Phone, FileText, Shield, Brain, Globe, TrendingUp, Zap,
  HeartPulse, Pill, Eye, Smile, Plane, Building2, Users,
  ArrowRight, Sun, Moon, LogOut, CheckCircle2, ChevronDown,
  BarChart3, Lock, Workflow, Bot, Layers, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Use-case cards data ── */
const useCaseCategories = [
  {
    title: "Call Center Intelligence",
    icon: Phone,
    color: "from-rose-500 to-orange-400",
    darkColor: "from-rose-400 to-orange-300",
    items: [
      "Eligibility & Benefits Verification",
      "Claims Status & Resolution",
      "Prior Authorization Intake",
      "Denial Explanation & Appeals",
      "Warm Transfer with Context",
    ],
  },
  {
    title: "Insurance Product Lines",
    icon: Layers,
    color: "from-violet-500 to-indigo-400",
    darkColor: "from-violet-400 to-indigo-300",
    items: [
      "Commercial Health & Medicare",
      "Medicaid & Dual Eligible",
      "Workers' Comp & P&C",
      "Dental, Vision & Life",
      "Travel & Specialty Benefits",
    ],
  },
  {
    title: "Organization Types",
    icon: Building2,
    color: "from-emerald-500 to-teal-400",
    darkColor: "from-emerald-400 to-teal-300",
    items: [
      "Payers & Health Plans",
      "TPAs & Employer Plans",
      "MSOs & Provider Groups",
      "BPOs & Contact Centers",
      "PBMs & Pharmacy Benefit",
    ],
  },
  {
    title: "Compliance & Security",
    icon: Shield,
    color: "from-sky-500 to-blue-400",
    darkColor: "from-sky-400 to-blue-300",
    items: [
      "HIPAA PHI Verification (3-point)",
      "Immutable Audit Trail",
      "Section 508 Accessibility",
      "Call Recording Disclosure",
      "Role-Based Access Control",
    ],
  },
  {
    title: "AI Orchestration",
    icon: Brain,
    color: "from-amber-500 to-yellow-400",
    darkColor: "from-amber-400 to-yellow-300",
    items: [
      "Real-time Script Guidance",
      "Entity Extraction (CPT/ICD/NPI)",
      "Resolution Variety Engine",
      "Auto-Play Demo Mode",
      "Scenario Builder for Admins",
    ],
  },
  {
    title: "Financial Impact",
    icon: TrendingUp,
    color: "from-pink-500 to-rose-400",
    darkColor: "from-pink-400 to-rose-300",
    items: [
      "ROI Simulator & Modeling",
      "Cost-per-Call Analytics",
      "AHT & FCR Benchmarks",
      "Call Deflection Tracking",
      "FTE Savings Calculator",
    ],
  },
];

const stats = [
  { value: "50%+", label: "Call Deflection", icon: Zap },
  { value: "<45s", label: "Avg Handle Time", icon: BarChart3 },
  { value: "99.7%", label: "Compliance Rate", icon: Lock },
  { value: "24/7", label: "Availability", icon: Bot },
];

const deploymentModes = [
  { title: "White-Label Command Center", desc: "Full enterprise dashboard with ROI modeling, claims operations, and executive analytics.", icon: Sparkles },
  { title: "Five9 Embedded Agent Desktop", desc: "Live agent assist inside Five9 with scripts, entity capture, warm transfers, and audit logging.", icon: Phone },
  { title: "Opyn Health Portal", desc: "Member-facing benefit assistant with cost transparency, provider search, and plan-aware guidance.", icon: HeartPulse },
];

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[3px]",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={penguinLogo} alt="Penguin AI" className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">Penguin AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 dark:bg-accent/10 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 dark:bg-primary/15 border border-primary/15 dark:border-primary/25 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Healthcare AI Command Center</span>
            </div>
          </RevealSection>

          <RevealSection delay={80}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Intelligent call resolution for healthcare operations
            </h1>
          </RevealSection>

          <RevealSection delay={160}>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty leading-relaxed">
              Penguin AI orchestrates call center workflows across payers, TPAs, MSOs, and BPOs — with compliant scripts, real-time entity capture, and measurable ROI.
            </p>
          </RevealSection>

          <RevealSection delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-12 px-8 text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.97] transition-all"
                onClick={() => navigate("/dashboard")}
              >
                Launch Command Center
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base rounded-xl active:scale-[0.97] transition-all"
                onClick={() => {
                  document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Use Cases
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-6 border-y border-border/50 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <RevealSection key={s.label} delay={i * 80}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/8 dark:bg-primary/15 mb-3 group-hover:scale-105 transition-transform">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold tracking-tight tabular-nums">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Use Cases Grid ── */}
      <section id="use-cases" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Built for every healthcare call workflow
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
                From eligibility checks to pharmacy prior auth — Penguin AI handles the full spectrum of healthcare call operations.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCaseCategories.map((cat, i) => (
              <RevealSection key={cat.title} delay={i * 70}>
                <div className="group relative rounded-2xl border border-border/60 bg-card p-6 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 active:scale-[0.98]">
                  <div className={cn(
                    "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 bg-gradient-to-br",
                    theme === "dark" ? cat.darkColor : cat.color
                  )}>
                    <cat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-3">{cat.title}</h3>
                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deployment Modes ── */}
      <section className="py-24 px-6 bg-muted/30 dark:bg-muted/10 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Three deployment modes, one platform
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
                Choose how Penguin AI integrates with your operations — standalone, embedded, or member-facing.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-5">
            {deploymentModes.map((mode, i) => (
              <RevealSection key={mode.title} delay={i * 100}>
                <div
                  className="group relative rounded-2xl border border-border/60 bg-card p-7 cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] dark:hover:shadow-primary/10 active:scale-[0.97]"
                  onClick={() => navigate("/dashboard")}
                >
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/8 dark:bg-primary/15 mb-5 group-hover:bg-primary/12 transition-colors">
                    <mode.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mode.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Launch <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <RevealSection>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to transform your call center?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 text-pretty">
              See Penguin AI resolve real healthcare calls — from eligibility to appeals — in under 4 minutes.
            </p>
            <Button
              size="lg"
              className="h-12 px-10 text-base rounded-xl shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
              onClick={() => navigate("/dashboard")}
            >
              Enter Live Demo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={penguinLogo} alt="" className="h-6 w-6 opacity-60" />
            <span className="text-sm text-muted-foreground">© 2026 Penguin AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>HIPAA Compliant</span>
            <span>·</span>
            <span>SOC 2 Type II</span>
            <span>·</span>
            <span>Section 508</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
