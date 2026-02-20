import { useState } from "react";
import { CheckCircle, AlertTriangle, X, Calendar, MapPin, Star, Clock, ArrowRight, Stethoscope, Building2, FileText, Phone } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo-pink.png";

export function CostTransparencyPanel() {
  const [appointmentFlow, setAppointmentFlow] = useState(false);
  const [appointmentStep, setAppointmentStep] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const startAppointment = () => {
    setAppointmentFlow(true);
    setAppointmentStep(0);
  };

  const nextAppointmentStep = () => {
    if (appointmentStep < 3) {
      setAppointmentStep((s) => s + 1);
    } else {
      setAppointmentStep(4); // confirmation
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Cost Transparency & Provider Search</h2>
        <p className="text-[10px] text-muted-foreground">Total Knee Replacement — Procedure Comparison</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* In-Network */}
        <div className="rounded-2xl border-2 border-[hsl(var(--opyn-green)/0.4)] bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[hsl(var(--opyn-green))] bg-[hsl(var(--opyn-green-light))] px-2 py-0.5 rounded-full">In-Network</span>
            <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-green))]" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">$35,562</p>
            <p className="text-[10px] text-muted-foreground">Facility + Surgeon + Anesthesia</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground">Your Estimated Cost</p>
            <p className="text-lg font-bold text-[hsl(var(--opyn-green))] font-mono">$8,000</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <img src={penguinLogo} alt="" className="h-4 w-4 object-contain" />
            <span className="text-[9px] font-medium text-[hsl(var(--opyn-purple))]">AI Recommended Provider</span>
          </div>
          <button
            onClick={startAppointment}
            className="w-full py-2 text-[11px] font-semibold rounded-lg bg-[hsl(var(--opyn-green))] text-white hover:opacity-90 transition-opacity"
          >
            Schedule Appointment
          </button>
        </div>

        {/* Out-of-Network */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 opacity-80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)] px-2 py-0.5 rounded-full">Out-of-Network</span>
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">$54,232</p>
            <p className="text-[10px] text-muted-foreground">Facility + Surgeon + Anesthesia</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground">Your Estimated Cost</p>
            <p className="text-lg font-bold text-[hsl(var(--accent))] font-mono">$44,502</p>
          </div>
          <div className="pt-1">
            <span className="text-[9px] text-muted-foreground">Higher out-of-pocket expense</span>
          </div>
          <button
            onClick={() => setDetailsOpen(true)}
            className="w-full py-2 text-[11px] font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <img src={penguinLogo} alt="" className="h-3 w-3 object-contain opacity-60" />
        <span className="text-[9px] text-muted-foreground">Orchestrated by Penguin AI</span>
      </div>

      {/* Schedule Appointment Flow */}
      {appointmentFlow && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAppointmentFlow(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[hsl(var(--opyn-green))]" />
                <h3 className="text-sm font-semibold">Schedule Appointment</h3>
              </div>
              <button onClick={() => setAppointmentFlow(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-1">
              {["Provider", "Date & Time", "Details", "Confirm"].map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full transition-colors ${appointmentStep >= i ? "bg-[hsl(var(--opyn-green))]" : "bg-border"}`} />
                  <span className={`text-[8px] ${appointmentStep >= i ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s}</span>
                </div>
              ))}
            </div>

            {/* Step content */}
            {appointmentStep === 0 && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">AI-recommended providers for Total Knee Replacement:</p>
                {[
                  { name: "Dr. Sarah Martinez", facility: "Valley Orthopedic Center", rating: 4.8, distance: "3.2 mi", cost: "$35,562" },
                  { name: "Dr. James Kim", facility: "Regional Medical Center", rating: 4.6, distance: "5.8 mi", cost: "$37,100" },
                  { name: "Dr. Lisa Chen", facility: "University Hospital", rating: 4.9, distance: "8.1 mi", cost: "$39,450" },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl border border-border p-3 flex items-center justify-between hover:border-[hsl(var(--opyn-green)/0.5)] cursor-pointer transition-colors" onClick={nextAppointmentStep}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[hsl(var(--opyn-green-light))] flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-[hsl(var(--opyn-green))]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{p.facility}</span>
                          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />{p.rating}</span>
                          <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.distance}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-[hsl(var(--opyn-green))]">{p.cost}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {appointmentStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px]">
                  <Stethoscope className="h-3.5 w-3.5 text-[hsl(var(--opyn-green))]" />
                  <span className="font-semibold">Dr. Sarah Martinez</span>
                  <span className="text-muted-foreground">• Valley Orthopedic Center</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Available time slots:</p>
                <div className="grid grid-cols-3 gap-2">
                  {["Mon, Mar 3", "Wed, Mar 5", "Thu, Mar 6", "Mon, Mar 10", "Tue, Mar 11", "Fri, Mar 14"].map((d) => (
                    <button key={d} onClick={nextAppointmentStep} className="rounded-lg border border-border p-2 text-center hover:border-[hsl(var(--opyn-green)/0.5)] hover:bg-[hsl(var(--opyn-green-light))] transition-colors">
                      <p className="text-[10px] font-semibold">{d}</p>
                      <p className="text-[9px] text-muted-foreground">9:00 AM</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {appointmentStep === 2 && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">Review & confirm details:</p>
                <div className="rounded-xl border border-border p-3 space-y-2">
                  {[
                    { icon: Stethoscope, label: "Provider", value: "Dr. Sarah Martinez" },
                    { icon: Building2, label: "Facility", value: "Valley Orthopedic Center" },
                    { icon: Calendar, label: "Date", value: "Mon, March 3, 2026 at 9:00 AM" },
                    { icon: FileText, label: "Procedure", value: "Total Knee Replacement (CPT 27447)" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-2 text-[10px]">
                      <r.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-16">{r.label}</span>
                      <span className="font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[hsl(var(--opyn-green)/0.3)] bg-[hsl(var(--opyn-green-light))] p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-[hsl(var(--opyn-green))]">Estimated Cost Summary</p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Procedure Cost</span><span className="font-semibold">$35,562</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Insurance Covers</span><span className="font-semibold text-[hsl(var(--opyn-green))]">-$27,562</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-[hsl(var(--opyn-green)/0.2)]">
                    <span className="font-semibold">Your Estimated Cost</span><span className="font-bold text-[hsl(var(--opyn-green))]">$8,000</span>
                  </div>
                </div>
                <button onClick={nextAppointmentStep} className="w-full py-2.5 text-[11px] font-semibold rounded-lg bg-[hsl(var(--opyn-green))] text-white hover:opacity-90 transition-opacity">
                  Confirm Appointment
                </button>
              </div>
            )}

            {appointmentStep === 3 && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">Processing your appointment…</p>
                <AppointmentProcessing onDone={nextAppointmentStep} />
              </div>
            )}

            {appointmentStep === 4 && (
              <div className="text-center space-y-3 py-4">
                <div className="h-12 w-12 rounded-full bg-[hsl(var(--opyn-green-light))] flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-[hsl(var(--opyn-green))]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Appointment Confirmed!</p>
                  <p className="text-[10px] text-muted-foreground">Dr. Sarah Martinez • Mon, March 3 at 9:00 AM</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-left space-y-1.5">
                  <p className="text-[9px] font-semibold text-muted-foreground">AUTOMATED ACTIONS</p>
                  {["Prior Authorization submitted (PA-44822)", "Referral request sent to PCP", "Pre-op checklist emailed to member", "Calendar invite sent", "Transportation assistance offered"].map((a) => (
                    <div key={a} className="flex items-center gap-1.5 text-[10px]">
                      <CheckCircle className="h-3 w-3 text-[hsl(var(--opyn-green))]" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <img src={penguinLogo} alt="" className="h-3 w-3 object-contain" />
                  <span className="text-[9px] text-muted-foreground">Fully orchestrated by Penguin AI</span>
                </div>
                <button onClick={() => setAppointmentFlow(false)} className="mt-2 px-4 py-1.5 text-[10px] font-medium rounded-lg border border-border hover:bg-secondary transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetailsOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--accent))]" />
                Out-of-Network Cost Breakdown
              </h3>
              <button onClick={() => setDetailsOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-2">
              {[
                { label: "Facility Fee", value: "$32,100" },
                { label: "Surgeon Fee", value: "$15,800" },
                { label: "Anesthesia", value: "$4,200" },
                { label: "Lab / Imaging", value: "$2,132" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-[11px] py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold font-mono">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] pt-2 font-bold">
                <span>Total Billed</span><span className="font-mono">$54,232</span>
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.05)] p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-[hsl(var(--accent))]">⚠ Out-of-Network Impact</p>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Plan Pays (60% UCR)</span><span className="font-semibold">$9,730</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Balance Billing Risk</span><span className="font-semibold text-[hsl(var(--accent))]">$22,402</span></div>
                <div className="flex justify-between pt-1 border-t border-[hsl(var(--accent)/0.2)]"><span className="font-semibold">Your Total Cost</span><span className="font-bold text-[hsl(var(--accent))]">$44,502</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--opyn-green)/0.3)] bg-[hsl(var(--opyn-green-light))] p-3">
              <div className="flex items-center gap-2">
                <img src={penguinLogo} alt="" className="h-4 w-4 object-contain" />
                <div>
                  <p className="text-[10px] font-semibold text-[hsl(var(--opyn-green))]">AI Recommendation</p>
                  <p className="text-[9px] text-muted-foreground">Choosing in-network saves you <span className="font-bold">$36,502</span>. Want to schedule with Dr. Martinez instead?</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setDetailsOpen(false)} className="flex-1 py-2 text-[11px] font-medium rounded-lg border border-border hover:bg-secondary transition-colors">
                Close
              </button>
              <button onClick={() => { setDetailsOpen(false); }} className="flex-1 py-2 text-[11px] font-semibold rounded-lg bg-[hsl(var(--opyn-green))] text-white hover:opacity-90 transition-opacity">
                Switch to In-Network
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentProcessing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Verifying insurance coverage…",
    "Checking prior authorization requirements…",
    "Reserving appointment slot…",
    "Generating pre-op instructions…",
    "Finalizing booking…",
  ];

  useState(() => {
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setStep(s);
      if (s >= steps.length) {
        clearInterval(iv);
        setTimeout(onDone, 600);
      }
    }, 800);
  });

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center gap-2 text-[10px] transition-opacity duration-300 ${step >= i ? "opacity-100" : "opacity-30"}`}>
          {step > i ? (
            <CheckCircle className="h-3 w-3 text-[hsl(var(--opyn-green))]" />
          ) : step === i ? (
            <div className="h-3 w-3 rounded-full border-2 border-[hsl(var(--opyn-purple))] border-t-transparent animate-spin" />
          ) : (
            <div className="h-3 w-3 rounded-full border border-border" />
          )}
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}
