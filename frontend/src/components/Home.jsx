import { useState, useEffect } from "react";

/* ── icons ── */
const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── data ── */
const features = [
  { emoji: "🤝", title: "Smart Matching",     desc: "Paired with someone whose goals are the mirror of yours — always mutual, always balanced." },
  { emoji: "💬", title: "Real-Time Chat",     desc: "Text, voice notes, gentle corrections. Everything in one clean thread." },
  { emoji: "🎥", title: "HD Video Calls",     desc: "Face-to-face practice. Pronunciation, expression, and tone — all at once." },
  { emoji: "🌿", title: "Cultural Exchange",  desc: "Share what makes your world distinct. Language is the door; culture is the room inside." },
];

const steps = [
  { n: "01", title: "Build your profile",  desc: "Your native language, your learning goal, a few words about yourself." },
  { n: "02", title: "Get matched",         desc: "We find someone whose goals mirror yours — usually within seconds." },
  { n: "03", title: "Start exchanging",    desc: "Half the session in your language, half in theirs. Equal, always." },
  { n: "04", title: "Grow together",       desc: "Build habits, track progress, turn a language partner into a real friend." },
];

const testimonials = [
  { initials: "SM", name: "Sofia M.", from: "Germany",  learning: "Spanish",  quote: "I matched with someone from Bogotá. Three months later she's one of my closest friends." },
  { initials: "KN", name: "Kenji N.", from: "Japan",    learning: "English",  quote: "I practice every morning before work. My confidence has changed completely." },
  { initials: "AD", name: "Amara D.", from: "Senegal",  learning: "Mandarin", quote: "Learning Mandarin felt impossible — until I found a native speaker learning Wolof." },
];

const stats  = [
  { value: "4.2M", label: "learners"     },
  { value: "120+", label: "languages"    },
  { value: "190",  label: "countries"    },
  { value: "98%",  label: "satisfaction" },
];

const langs  = ["🇪🇸 Spanish","🇫🇷 French","🇩🇪 German","🇯🇵 Japanese","🇰🇷 Korean","🇧🇷 Portuguese","🇨🇳 Mandarin","🇮🇳 Hindi","🇮🇹 Italian","🇷🇺 Russian","🇸🇦 Arabic","🇳🇱 Dutch"];
const chatSeed = [
  { side: "them", text: "Hola! ¿Practicamos hoy?",              meta: "Carlos · 🇪🇸" },
  { side: "me",   text: "¡Claro! Let's start in Spanish 😊",    meta: "You · 🇺🇸"    },
  { side: "them", text: "Tu español suena muy natural ya 👏",    meta: "Carlos · 🇪🇸" },
  { side: "me",   text: "And your English is so confident now!", meta: "You · 🇺🇸"    },
];

/* ── styles ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --cream:#f6f3ee;
  --paper:#fdfbf7;
  --ink:#1b2a1d;
  --muted:#6b7c6d;
  --border:#dde6de;
  --green:#2d6a4f;
  --gl:#52b788;
  --serif:'Lora',Georgia,serif;
  --sans:'DM Sans',system-ui,sans-serif;
}

body{background:var(--cream);color:var(--ink);font-family:var(--sans);font-weight:300;-webkit-font-smoothing:antialiased;line-height:1.6}

/* ── nav ── */
.nav{position:fixed;inset:0 0 auto;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:1.1rem 2rem;transition:background .4s,box-shadow .4s}
.nav.s{background:rgba(246,243,238,.9);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--border)}
.logo{font-family:var(--serif);font-size:1.2rem;color:var(--ink)}
.logo span{color:var(--green)}
.nav-links{display:flex;gap:2rem;list-style:none}
.nav-links a{font-size:.85rem;color:var(--muted);text-decoration:none;transition:color .2s}
.nav-links a:hover{color:var(--ink)}
.nav-cta{font-family:var(--sans);font-size:.85rem;font-weight:500;color:#fff;background:var(--green);border:none;border-radius:99px;padding:.55rem 1.25rem;cursor:pointer;transition:opacity .2s,transform .15s}
.nav-cta:hover{opacity:.85;transform:translateY(-1px)}
@media(max-width:600px){.nav-links{display:none}.nav{padding:1rem 1.25rem}}

/* ── hero ── */
.hero{min-height:100svh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:8rem 1.5rem 5rem;background:var(--paper);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% -5%,rgba(82,183,136,.14) 0%,transparent 70%);pointer-events:none}
.eyebrow{font-size:.73rem;letter-spacing:.13em;text-transform:uppercase;color:var(--green);margin-bottom:1.4rem}
.h1{font-family:var(--serif);font-size:clamp(2.6rem,6vw,5.2rem);line-height:1.08;color:var(--ink);max-width:14ch;margin:0 auto .1em}
.h1 em{font-style:italic;color:var(--green)}
.hero-sub{font-size:1rem;color:var(--muted);max-width:38ch;margin:1.3rem auto 2.2rem;line-height:1.75}
.btns{display:flex;gap:.7rem;justify-content:center;flex-wrap:wrap}
.btn-p{font-family:var(--sans);font-size:.88rem;font-weight:500;color:#fff;background:var(--green);border:none;border-radius:99px;padding:.72rem 1.7rem;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem;transition:opacity .2s,transform .15s}
.btn-p:hover{opacity:.85;transform:translateY(-1px)}
.btn-g{font-family:var(--sans);font-size:.88rem;color:var(--muted);background:none;border:1px solid var(--border);border-radius:99px;padding:.72rem 1.5rem;cursor:pointer;transition:border-color .2s,color .2s}
.btn-g:hover{border-color:var(--green);color:var(--green)}
.pills{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center;margin-top:3.5rem}
.pill{font-size:.75rem;color:var(--muted);background:var(--cream);border:1px solid var(--border);border-radius:99px;padding:.32rem .85rem}

/* ── sections ── */
section{padding:5.5rem 1.5rem}
.inner{max-width:70rem;margin:0 auto}
.sl{font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;color:var(--green);margin-bottom:.9rem}
.sh{font-family:var(--serif);font-size:clamp(1.75rem,3.5vw,2.7rem);line-height:1.2;color:var(--ink);max-width:22ch}
.ss{font-size:.92rem;color:var(--muted);max-width:40ch;line-height:1.75;margin-top:.65rem}

/* ── features ── */
.ft-bg{background:var(--cream)}
.ft-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1.1rem;margin-top:2.8rem}
.fc{background:var(--paper);border:1px solid var(--border);border-radius:16px;padding:1.65rem;transition:box-shadow .25s,transform .25s}
.fc:hover{box-shadow:0 8px 28px rgba(45,106,79,.07);transform:translateY(-3px)}
.fe{font-size:1.5rem;margin-bottom:.9rem}
.ft{font-family:var(--serif);font-size:1rem;color:var(--ink);margin-bottom:.45rem}
.fd{font-size:.85rem;color:var(--muted);line-height:1.7}

/* ── steps ── */
.st-bg{background:var(--paper)}
.st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:2.5rem;margin-top:2.8rem}
.sn{font-family:var(--serif);font-size:3rem;color:var(--border);line-height:1;margin-bottom:.4rem}
.stitle{font-size:.93rem;font-weight:500;color:var(--ink);margin-bottom:.35rem}
.sdesc{font-size:.83rem;color:var(--muted);line-height:1.7}

/* ── chat preview ── */
.pv-bg{background:var(--cream)}
.pv-wrap{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;margin-top:2.8rem}
@media(max-width:700px){.pv-wrap{grid-template-columns:1fr}}
.cw{background:var(--paper);border:1px solid var(--border);border-radius:18px;overflow:hidden}
.ch{display:flex;align-items:center;gap:.7rem;padding:1rem 1.2rem;border-bottom:1px solid var(--border)}
.av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gl),var(--green));display:flex;align-items:center;justify-content:center;color:#fff;font-size:.72rem;font-weight:600;flex-shrink:0}
.cn{font-size:.85rem;font-weight:500;color:var(--ink)}
.ol{font-size:.7rem;color:var(--green);display:flex;align-items:center;gap:.3rem}
.dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.msgs{padding:1.2rem;display:flex;flex-direction:column;gap:.7rem;min-height:190px}
.msg{max-width:76%}
.msg.them{align-self:flex-start}
.msg.me{align-self:flex-end}
.bbl{font-size:.83rem;line-height:1.55;padding:.62rem .95rem;border-radius:14px}
.msg.them .bbl{background:var(--cream);color:var(--ink);border-bottom-left-radius:3px}
.msg.me   .bbl{background:var(--green);color:#fff;border-bottom-right-radius:3px}
.mm{font-size:.67rem;color:var(--muted);margin-top:.22rem}
.msg.me .mm{text-align:right}
.ci{display:flex;gap:.5rem;padding:.9rem 1.2rem;border-top:1px solid var(--border)}
.ci input{flex:1;font-family:var(--sans);font-size:.83rem;border:1px solid var(--border);border-radius:99px;padding:.52rem .95rem;background:var(--cream);color:var(--ink);outline:none;transition:border-color .2s}
.ci input:focus{border-color:var(--gl)}
.sb{width:34px;height:34px;border-radius:50%;background:var(--green);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s}
.sb:hover{opacity:.82}
.pc p{font-size:.88rem;color:var(--muted);line-height:1.75;margin-bottom:1.4rem}
.pl{list-style:none;display:flex;flex-direction:column;gap:.6rem}
.pl li{display:flex;align-items:center;gap:.55rem;font-size:.85rem;color:var(--ink)}
.ci-icon{width:20px;height:20px;border-radius:50%;background:rgba(45,106,79,.1);display:flex;align-items:center;justify-content:center;color:var(--green);flex-shrink:0}

/* ── stats ── */
.stats-bg{background:var(--green)}
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:1.8rem}
@media(max-width:560px){.sg{grid-template-columns:repeat(2,1fr)}}
.sv{font-family:var(--serif);font-size:2.7rem;color:#fff;line-height:1}
.slb{font-size:.75rem;color:rgba(255,255,255,.55);margin-top:.3rem;letter-spacing:.06em;text-transform:uppercase}

/* ── testimonials ── */
.ts-bg{background:var(--paper)}
.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.1rem;margin-top:2.8rem}
.tc{border:1px solid var(--border);border-radius:16px;padding:1.65rem}
.tq{font-family:var(--serif);font-style:italic;font-size:.92rem;color:var(--ink);line-height:1.72;margin-bottom:1.4rem}
.tm{display:flex;align-items:center;gap:.7rem}
.tn{font-size:.83rem;font-weight:500;color:var(--ink)}
.td{font-size:.73rem;color:var(--muted)}

/* ── cta ── */
.cta-bg{background:var(--cream)}
.cb{background:var(--ink);border-radius:22px;padding:4rem 2rem;text-align:center}
.ch2{font-family:var(--serif);font-size:clamp(1.8rem,4vw,3rem);color:#fff;line-height:1.2;margin-bottom:.9rem}
.ch2 em{font-style:italic;color:var(--gl)}
.cs{font-size:.92rem;color:rgba(255,255,255,.45);max-width:36ch;margin:0 auto 2.4rem;line-height:1.75}
.btn-pl{font-family:var(--sans);font-size:.88rem;font-weight:500;color:var(--ink);background:#fff;border:none;border-radius:99px;padding:.72rem 1.7rem;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem;transition:opacity .2s,transform .15s}
.btn-pl:hover{opacity:.88;transform:translateY(-1px)}
.btn-gd{font-family:var(--sans);font-size:.88rem;color:rgba(255,255,255,.45);background:none;border:1px solid rgba(255,255,255,.14);border-radius:99px;padding:.72rem 1.5rem;cursor:pointer;transition:border-color .2s,color .2s}
.btn-gd:hover{border-color:rgba(255,255,255,.35);color:rgba(255,255,255,.8)}

/* ── footer ── */
footer{background:var(--ink);padding:2.2rem 1.5rem}
.fi{max-width:70rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.9rem}
.fl{font-family:var(--serif);color:#fff;font-size:.95rem}
.fl span{color:var(--gl)}
.flinks{display:flex;gap:1.4rem;list-style:none}
.flinks a{font-size:.78rem;color:rgba(255,255,255,.35);text-decoration:none;transition:color .2s}
.flinks a:hover{color:rgba(255,255,255,.75)}
.fc2{font-size:.75rem;color:rgba(255,255,255,.2);width:100%;text-align:center;margin-top:.4rem}

/* ── fade in ── */
@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .65s ease both}
.d1{animation-delay:.08s}.d2{animation-delay:.2s}.d3{animation-delay:.34s}.d4{animation-delay:.48s}
`;

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [typed, setTyped]       = useState("");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? " s" : ""}`}>
        <div className="logo">Eco<span>Meet</span></div>
        <ul className="nav-links">
          {["Features", "How it works", "Stories"].map(l => (
            <li key={l}><a href="#">{l}</a></li>
          ))}
        </ul>
        <button className="nav-cta">Get started</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <p className="eyebrow fu">Language exchange, reimagined</p>
        <h1 className="h1 fu d1">Meet the world through <em>language</em></h1>
        <p className="hero-sub fu d2">
          EcoMeet pairs you with a real person who speaks what you're learning — and wants to learn what you speak. No bots. No courses. Just people.
        </p>
        <div className="btns fu d3">
          <button className="btn-p">Start for free <ArrowRight /></button>
          <button className="btn-g">See how it works</button>
        </div>
        <div className="pills fu d4">
          {langs.map(l => <span className="pill" key={l}>{l}</span>)}
        </div>
      </section>

      {/* FEATURES */}
      <section className="ft-bg">
        <div className="inner">
          <p className="sl">What you get</p>
          <h2 className="sh">Everything you need to actually learn</h2>
          <p className="ss">Built around the one thing that works: talking to a real human being.</p>
          <div className="ft-grid">
            {features.map(f => (
              <div className="fc" key={f.title}>
                <div className="fe">{f.emoji}</div>
                <div className="ft">{f.title}</div>
                <p className="fd">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="st-bg">
        <div className="inner">
          <p className="sl">How it works</p>
          <h2 className="sh">Up and talking in four steps</h2>
          <div className="st-grid">
            {steps.map(s => (
              <div key={s.n}>
                <div className="sn">{s.n}</div>
                <div className="stitle">{s.title}</div>
                <p className="sdesc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHAT PREVIEW */}
      <section className="pv-bg">
        <div className="inner">
          <p className="sl">Live preview</p>
          <h2 className="sh">A conversation worth having</h2>
          <div className="pv-wrap">
            <div className="cw">
              <div className="ch">
                <div className="av">C</div>
                <div>
                  <div className="cn">Carlos · 🇪🇸 Barcelona</div>
                  <div className="ol"><span className="dot" /> Online now</div>
                </div>
              </div>
              <div className="msgs">
                {chatSeed.map((m, i) => (
                  <div className={`msg ${m.side}`} key={i}>
                    <div className="bbl">{m.text}</div>
                    <div className="mm">{m.meta}</div>
                  </div>
                ))}
              </div>
              <div className="ci">
                <input
                  placeholder="Type in any language…"
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setTyped("")}
                />
                <button className="sb" onClick={() => setTyped("")}><ArrowRight /></button>
              </div>
            </div>

            <div className="pc">
              <p>Every session is split evenly — half in your partner's language, half in yours. Real conversation, real progress.</p>
              <ul className="pl">
                {["Inline translation hints as you type","Voice notes for pronunciation","HD video calls, zero plugins","Progress tracked automatically"].map(item => (
                  <li key={item}><span className="ci-icon"><Check /></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-bg">
        <div className="inner">
          <p style={{fontSize:".72rem",letterSpacing:".13em",textTransform:"uppercase",color:"rgba(255,255,255,.45)"}}>By the numbers</p>
          <div className="sg">
            {stats.map(s => (
              <div key={s.label}>
                <div className="sv">{s.value}</div>
                <div className="slb">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="ts-bg">
        <div className="inner">
          <p className="sl">Real stories</p>
          <h2 className="sh">Words people have found</h2>
          <div className="tg">
            {testimonials.map(t => (
              <div className="tc" key={t.name}>
                <p className="tq">"{t.quote}"</p>
                <div className="tm">
                  <div className="av" style={{width:36,height:36,fontSize:".76rem"}}>{t.initials}</div>
                  <div>
                    <div className="tn">{t.name}</div>
                    <div className="td">{t.from} · learning {t.learning}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-bg">
        <div className="inner">
          <div className="cb">
            <h2 className="ch2">Your next conversation<br />is <em>waiting</em></h2>
            <p className="cs">Join 4.2 million people who turned language practice into real connection.</p>
            <div className="btns">
              <button className="btn-pl">Create free account <ArrowRight /></button>
              <button className="btn-gd">Explore languages</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="fi">
          <div className="fl">Eco<span>Meet</span></div>
          <ul className="flinks">
            {["Privacy","Terms","About","Contact"].map(l => <li key={l}><a href="#">{l}</a></li>)}
          </ul>
          <p className="fc2">© 2025 EcoMeet. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
