import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageSquare, Smartphone, Send } from "lucide-react";
import { toast } from "sonner";

type Channel = "email" | "sms" | "whatsapp" | "push";

const CHANNELS: { id: Channel; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "email", label: "Email", icon: Mail, desc: "Onboarding link + credentials" },
  { id: "sms", label: "SMS", icon: Smartphone, desc: "DLT-approved template" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, desc: "Business API · rich card" },
  { id: "push", label: "App Push", icon: Send, desc: "If app already installed" },
];

export function InviteDialog({
  trigger, title = "Invite Parent", recipientLabel = "Parent",
  defaultName = "", defaultPhone = "", defaultEmail = "",
}: {
  trigger: React.ReactNode;
  title?: string;
  recipientLabel?: string;
  defaultName?: string; defaultPhone?: string; defaultEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    email: true, sms: true, whatsapp: false, push: false,
  });
  const [message, setMessage] = useState(
    "Hello, welcome to Edureon. Please use the secure link below to activate your parent portal account and link your child's profile.",
  );

  const toggle = (c: Channel) => setChannels((p) => ({ ...p, [c]: !p[c] }));
  const selected = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const send = () => {
    if (!name) return toast.error("Recipient name required");
    if (selected.length === 0) return toast.error("Pick at least one channel");
    if (channels.email && !email) return toast.error("Email required for email channel");
    if ((channels.sms || channels.whatsapp) && !phone) return toast.error("Phone required for SMS/WhatsApp");
    toast.success(`Invite sent to ${name}`, { description: `via ${selected.join(", ").toUpperCase()}` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>Send a portal activation invite with your own message across one or more channels.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">{recipientLabel} name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mobile</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Delivery channels *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CHANNELS.map((c) => (
                <label key={c.id} className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${channels[c.id] ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  <Checkbox checked={channels[c.id]} onCheckedChange={() => toggle(c.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium"><c.icon className="h-3.5 w-3.5" />{c.label}</div>
                    <div className="text-[10px] text-muted-foreground">{c.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="text-[10px] text-muted-foreground text-right">{message.length} / 500</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={send}><Send className="h-4 w-4" />Send Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
