"use client";

import { useState } from "react";
import { Building2, Clock, Mail, MapPinned, Phone, Send } from "lucide-react";
import { SITE } from "../siteConfig";

export default function ContactPage() {
  const c = SITE.contact;
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const up =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  // There is no server in this prototype, so the form opens the visitor's email app with the message filled in.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Name: ${f.name}\nEmail: ${f.email}\n\n${f.message}`;
    setSent(true);
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(f.subject || "Hulu Ganga HydroGIS enquiry")}&body=${encodeURIComponent(body)}`;
  };

  const items = [
    { icon: Mail, k: "Email", v: c.email, href: `mailto:${c.email}` },
    {
      icon: Phone,
      k: "Phone",
      v: c.phone,
      href: `tel:${c.phone.replace(/\s/g, "")}`,
    },
    { icon: Building2, k: "Organisation", v: `${c.name} · ${c.organisation}` },
    { icon: MapPinned, k: "Address", v: c.address },
    { icon: Clock, k: "Office hours", v: c.hours },
  ];

  return (
    <div className="info contact">
      <div className="info-in c-grid">
        <div>
          <span className="eyebrow">Contact</span>
          <h1>Let&apos;s discuss the research</h1>
          <p className="lead">
            Get in touch about data collaboration, model methodology, dashboard
            development, or applications for catchment and mini-hydropower
            planning.
          </p>
          <div className="c-list">
            {items.map(({ icon: Icon, k, v, href }) => {
              const body = (
                <>
                  <span className="dcard-ic sm">
                    <Icon size={16} />
                  </span>
                  <span>
                    <small>{k}</small>
                    <b>{v}</b>
                  </span>
                </>
              );
              return href ? (
                <a key={k} href={href} className="c-item">
                  {body}
                </a>
              ) : (
                <div key={k} className="c-item">
                  {body}
                </div>
              );
            })}
          </div>
        </div>

        <form className="c-form" onSubmit={submit}>
          <div className="two">
            <label>
              Your name
              <input
                required
                value={f.name}
                onChange={up("name")}
                placeholder="Full name"
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                required
                type="email"
                value={f.email}
                onChange={up("email")}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          <label>
            Subject
            <input
              required
              value={f.subject}
              onChange={up("subject")}
              placeholder="How can we help?"
            />
          </label>
          <label>
            Message
            <textarea
              required
              rows={6}
              value={f.message}
              onChange={up("message")}
              placeholder="Tell us about your enquiry..."
            />
          </label>
          <button className="send" type="submit">
            <Send size={16} />{" "}
            {sent ? "Opening your email app…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
