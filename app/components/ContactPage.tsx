"use client";

import { useState } from "react";
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
    const body = `${f.message}\n\n— ${f.name} (${f.email})`;
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(f.subject || "Hulu Ganga dashboard enquiry")}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const items = [
    { k: "Team", v: c.name },
    { k: "Organisation", v: c.organisation },
    { k: "Email", v: c.email, href: `mailto:${c.email}` },
    { k: "Phone", v: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    { k: "Address", v: c.address },
    { k: "Office hours", v: c.hours },
  ];

  return (
    <div className="doc">
      <section className="about-hero">
        <span className="eyebrow">Contact</span>
        <h2>Get in touch</h2>
        <p>
          Questions about the models, data or this dashboard? Send a message, or
          report a problem with a map or table.
        </p>
      </section>

      <div className="doc-grid contact-grid">
        <section className="card">
          <h3>Details</h3>
          <dl className="dl-list">
            {items.map((i) => (
              <div key={i.k}>
                <dt>{i.k}</dt>
                <dd>{i.href ? <a href={i.href}>{i.v}</a> : i.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card">
          <h3>Send a message</h3>
          <form className="form" onSubmit={submit}>
            <label>
              Your name
              <input
                required
                value={f.name}
                onChange={up("name")}
                autoComplete="name"
              />
            </label>
            <label>
              Your email
              <input
                required
                type="email"
                value={f.email}
                onChange={up("email")}
                autoComplete="email"
              />
            </label>
            <label>
              Subject
              <input value={f.subject} onChange={up("subject")} />
            </label>
            <label>
              Message
              <textarea
                required
                rows={5}
                value={f.message}
                onChange={up("message")}
              />
            </label>
            <button className="btn primary" type="submit">
              Send message
            </button>
            {sent && (
              <p className="note">
                Your email app should have opened with the message ready to
                send.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
