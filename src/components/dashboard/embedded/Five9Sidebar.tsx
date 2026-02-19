import { Phone, Mail, MessageSquare, Clock, Users } from "lucide-react";

const navItems = [
  { icon: Phone, label: "Calls", active: true },
  { icon: Mail, label: "Email", active: false },
  { icon: MessageSquare, label: "Chat", active: false },
  { icon: Clock, label: "History", active: false },
  { icon: Users, label: "Supervisor", active: false },
];

export function Five9Sidebar() {
  return (
    <div className="w-14 five9-sidebar flex flex-col items-center py-3 gap-1 shrink-0">
      {navItems.map((item) => (
        <button
          key={item.label}
          title={item.label}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
            item.active
              ? "bg-white/15 text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/10"
          }`}
        >
          <item.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
