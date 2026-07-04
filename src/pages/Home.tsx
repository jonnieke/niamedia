import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Logo from "../components/ui/Logo"
import { trackEvent } from '../lib/analytics'
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Film,
  Maximize2,
  MessageSquare,
  Music,
  Play,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Volume2,
} from "lucide-react";

const NiaAgent = lazy(() => import("../components/NiaAgent"));

export default function Home() {
  const [showAssistant, setShowAssistant] = useState(false);
  const [params] = useSearchParams();
  const location = useLocation();
  useEffect(() => {
    if (params.get("assistant") === "1") setShowAssistant(true);
  }, [params]);
  useEffect(() => {
    if (!location.hash) return;
    requestAnimationFrame(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);
  const packages = [
    {
      title: "Quick Promo",
      price: "KES 3,500 - 5,000",
      intro: "Perfect for simple offers and quick promotions.",
      features: [
        "15-20 sec video",
        "Basic script",
        "AI visuals & music",
        "9:16 vertical format",
        "1 revision",
        "WhatsApp caption",
      ],
      color: "#11996a",
      bg: "#f1fbf7",
    },
    {
      title: "Social Commercial",
      price: "KES 7,500 - 12,000",
      intro: "Best for social media ads that get attention.",
      features: [
        "30 sec video",
        "Creative concept",
        "Voiceover & music",
        "Captions & subtitles",
        "9:16 & 1:1 formats",
        "2 revisions",
        "Social captions",
      ],
      color: "#2949df",
      bg: "#f2f5ff",
      popular: true,
    },
    {
      title: "Brand Campaign Video",
      price: "KES 15,000 - 25,000",
      intro: "Ideal for brands and serious marketing campaigns.",
      features: [
        "45-60 sec video",
        "Campaign strategy",
        "Voiceover & music",
        "Multiple formats",
        "Poster copy & messages",
        "3 revisions",
        "Human creative direction",
      ],
      color: "#f47613",
      bg: "#fff8ef",
    },
    {
      title: "Premium Commercial",
      price: "KES 35,000 - 60,000",
      intro: "For businesses that want the very best.",
      features: [
        "60-90 sec video",
        "Full concept development",
        "Advanced script & scenes",
        "Multi-platform versions",
        "Campaign copy pack",
        "3-4 revisions",
        "Strategy call",
      ],
      color: "#8c21b7",
      bg: "#faf4ff",
    },
  ];
  const steps = [
    {
      icon: Copy,
      title: "Submit Your Brief",
      desc: "Tell us about your business, offer, target audience and preferred style.",
      color: "#7c3aed",
    },
    {
      icon: Bot,
      title: "Nia Sharpens the Idea",
      desc: "Our AI assistant helps you create a strong hook, script and video concept.",
      color: "#3347e8",
    },
    {
      icon: ShoppingBag,
      title: "Choose Your Package",
      desc: "Pick the package that fits your goals, budget and timeline.",
      color: "#ec4899",
    },
    {
      icon: Film,
      title: "We Produce the Video",
      desc: "AI-assisted production with human creative direction brings your video to life.",
      color: "#f97316",
    },
    {
      icon: CheckCircle2,
      title: "Review & Publish",
      desc: "Review, request changes and publish your ad with confidence.",
      color: "#22a447",
    },
  ];
  const featureBadges = [
    [Film, "Video ads from", "KES 3,500"],
    [Clock, "24-72 hour", "delivery"],
    [Sparkles, "AI-assisted", "production"],
    [Target, "Human creative", "direction"],
    [Star, "Ready for all", "social platforms"],
    [Music, "Scripts, voiceover,", "music, captions"],
  ] as const;
  const niaFeatures = [
    "Campaign ideas",
    "Instagram & TikTok captions",
    "Video scripts",
    "Poster copy",
    "Hooks & concepts",
    "Creative direction",
    "WhatsApp messages",
    "Package recommendations",
  ];
  const trustedBusinesses = [
    { initials: "NG", name: "Ndovu Group", label: "Corporate" },
    { initials: "PF", name: "PesaFlix", label: "Fintech" },
    { initials: "SC", name: "Shekel Coin", label: "Web3" },
    { initials: "OM", name: "Onfon Media", label: "Media" },
    { initials: "AM", name: "Adiel Media", label: "Agency" },
    { initials: "NC", name: "NCBA", label: "Banking" },
  ];
  const gradient =
    "linear-gradient(100deg,#ff5f65 0%,#ec4899 48%,#8b32ff 100%)";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {" "}
      <section className="relative overflow-hidden bg-[#03040d] pb-20 text-white">
        {" "}
        <div className="absolute -bottom-44 left-1/2 h-96 w-[80%] -translate-x-1/2 bg-purple-700/25 blur-[100px]" />{" "}
        <header className="relative z-20 mx-auto flex h-[84px] max-w-[1450px] items-center justify-between px-5 lg:px-10">
          {" "}
          <Link to="/">
            <Logo size="lg" />
          </Link>{" "}
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-white/90 xl:flex">
            {" "}
            <Link to="/">Home</Link>
            <Link to="/quote">Video Commercials</Link>
            <Link to="/pricing">Pricing</Link>{" "}
            <a href="#how-it-works">How It Works</a>
            <Link to="/portfolio">Portfolio</Link>
            <a href="#industries">Industries</a>
            <a href="#about">About Us</a>{" "}
          </nav>{" "}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold sm:block"
            >
              Login
            </Link>
            <Link
              to="/quote"
              className="rounded-xl px-5 py-3 text-sm font-bold"
              style={{ background: gradient }}
            >
              Request a Video
            </Link>
          </div>{" "}
        </header>{" "}
        <div className="relative mx-auto grid max-w-[1380px] gap-10 px-6 pb-3 pt-9 lg:grid-cols-[.93fr_1.07fr] lg:px-10">
          {" "}
          <div className="flex flex-col justify-center">
            {" "}
            <h1 className="text-[clamp(43px,4.4vw,69px)] font-black leading-[1.05] tracking-[-.045em] text-white">
              Affordable AI
              <br />
              <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
                Video Commercials
              </span>
              <br />
              for Your Business
            </h1>{" "}
            <p className="mt-5 max-w-[575px] text-[16px] leading-[1.55] text-white/90">
              Nia Media helps SMEs create professional, AI-assisted video ads
              fast. From idea to final video - scripts, voiceover, music,
              captions and more. Ready for WhatsApp, Instagram, TikTok, Facebook
              and YouTube.
            </p>{" "}
            <div className="mt-7 flex flex-wrap gap-4">
              {" "}
              <Link
                to="/quote"
                className="inline-flex items-center gap-3 rounded-xl px-7 py-4 text-[15px] font-bold text-white shadow-lg"
                style={{ background: gradient }}
              >
                Request a Video Commercial <ArrowRight size={18} />
              </Link>{" "}
              <button
                onClick={() => { trackEvent('nia_assistant_open', { cta_location: 'home_page' }); setShowAssistant(true) }}
                className="inline-flex items-center gap-3 rounded-xl border border-white/45 bg-white/[.03] px-7 py-4 text-[15px] font-bold"
              >
                <MessageSquare size={20} /> Talk to Nia Assistant
              </button>{" "}
            </div>{" "}
          </div>{" "}
          <div className="relative aspect-[1.34/1] overflow-hidden rounded-[22px] border border-white/35 bg-black shadow-2xl">
            {" "}
            <img
              src="/images/nia-cafe-owner.png"
              alt="Kenyan cafe business owner"
              className="absolute inset-0 h-full w-full object-cover"
            />{" "}
            <div className="absolute left-[7%] top-[13%] max-w-[44%]">
              {" "}
              <p className="text-[clamp(28px,3vw,50px)] font-black leading-[.85]">
                GROW
              </p>
              <p className="mt-2 text-[clamp(23px,2.7vw,44px)] font-black italic leading-[.86] text-amber-400">
                YOUR BUSINESS
              </p>{" "}
              <p className="mt-5 text-[clamp(14px,1.4vw,23px)] font-semibold leading-tight">
                with videos that
                <br />
                bring customers
                <br />
                <span className="text-fuchsia-400">to you.</span>
              </p>{" "}
              <p className="mt-7 rotate-[-4deg] text-[clamp(12px,1.2vw,19px)] italic leading-none">
                Let's create
                <br />
                your next
                <br />
                big ad! <ArrowRight size={30} className="inline -rotate-45 text-fuchsia-400" />
              </p>{" "}
            </div>{" "}
            <div
              aria-hidden="true"
              className="absolute left-[51%] top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white text-white"
            >
              <Play size={34} className="ml-1" fill="currentColor" />
            </div>{" "}
            <div className="absolute inset-x-0 bottom-0 flex h-11 items-center gap-3 bg-black/80 px-5 text-[10px]">
              <Play size={12} fill="currentColor" />
              <span>0:00 / 0:30</span>
              <div className="h-1 flex-1 rounded bg-white/70">
                <div className="h-full w-[58%] bg-gradient-to-r from-pink-500 to-purple-500" />
              </div>
              <Volume2 size={12} />
              <Maximize2 size={12} />
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="relative mx-auto mt-5 grid max-w-[1380px] grid-cols-2 gap-y-4 px-6 sm:grid-cols-3 lg:grid-cols-6 lg:px-10">
          {" "}
          {featureBadges.map(([Icon, a, b]) => (
            <div
              key={a}
              className="flex items-center gap-3 text-[11px] leading-tight text-white/85"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-500/15 text-purple-300">
                <Icon size={19} />
              </span>
              <span>
                {a}
                <br />
                <b>{b}</b>
              </span>
            </div>
          ))}{" "}
        </div>{" "}
      </section>{" "}
      <div className="relative z-10 mx-auto -mt-10 max-w-[1380px] px-5">
        <div className="rounded-[20px] border border-slate-200 bg-white px-7 py-4 shadow-xl">
          <p className="mb-4 text-center text-base font-bold text-[#121329]">
            Trusted by real Kenyan businesses
          </p>
          <div className="flex items-center justify-between gap-6 overflow-x-auto pb-1">
            {trustedBusinesses.map((business) => (
              <div
                key={business.name}
                className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#111329] text-[11px] font-black tracking-[.15em] text-white">
                  {business.initials}
                </span>
                <span className="leading-none">
                  <b className="block text-[13px] text-[#111329]">{business.name}</b>
                  <small className="text-[9px] uppercase tracking-[.2em] text-slate-500">
                    {business.label}
                  </small>
                </span>
              </div>
            ))}
            <span className="shrink-0 text-xs text-slate-500">and more trusted clients</span>
          </div>
        </div>
      </div>{" "}
      <section
        id="how-it-works"
        className="bg-[radial-gradient(circle_at_center,#f3efff_0,#fbfbff_65%)] px-6 pb-7 pt-10"
      >
        {" "}
        <div className="mx-auto max-w-[1380px]">
          <h2 className="mb-5 text-center text-[32px] font-black text-[#111329]">
            How It Works
          </h2>
          <div className="grid gap-7 md:grid-cols-5">
            {" "}
            {steps.map(({ icon: Icon, color, title, desc }, i) => (
              <div key={title} className="relative text-center">
                {i < 4 && (
                  <div className="absolute left-[70%] top-14 hidden w-[60%] border-t-2 border-dashed border-slate-300 md:block" />
                )}
                <div className="relative mx-auto mb-3 grid h-[100px] w-[100px] place-items-center rounded-full border border-slate-200 bg-white shadow-sm">
                  <Icon size={43} style={{ color }} />
                  <span
                    className="absolute -bottom-2 left-0 grid h-6 w-6 place-items-center rounded-full text-xs font-black text-white"
                    style={{ background: color }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#111329]">
                  {title}
                </h3>
                <p className="mx-auto mt-2 max-w-[190px] text-[12px] leading-[1.45] text-slate-600">
                  {desc}
                </p>
              </div>
            ))}{" "}
          </div>
          <div className="mt-5 text-center">
            <Link
              to="/quote"
              className="inline-flex items-center gap-3 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(90deg,#4f46e5,#d946ef)" }}
            >
              Start Your Video Brief <ArrowRight size={16} />
            </Link>
          </div>
        </div>{" "}
      </section>{" "}
      <section id="services" className="bg-white px-6 py-8">
        <div className="mx-auto max-w-[1380px]">
          <h2 className="mb-5 text-center text-[30px] font-black text-[#111329]">
            Popular Video Packages
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {" "}
            {packages.map((p) => (
              <article
                key={p.title}
                className="relative flex min-h-[405px] flex-col rounded-[16px] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                style={{ background: p.bg, borderColor: p.color + "45" }}
              >
                {p.popular && (
                  <span
                    className="absolute -top-px right-5 rounded-b-lg px-4 py-1.5 text-[10px] font-bold text-white"
                    style={{ background: p.color }}
                  >
                    Most Popular
                  </span>
                )}
                <h3
                  className="text-base font-extrabold"
                  style={{ color: p.color }}
                >
                  {p.title}
                </h3>
                <p
                  className="mt-2 text-xl font-black"
                  style={{ color: p.color }}
                >
                  {p.price}
                </p>
                <p className="mt-3 min-h-10 text-[12px] text-slate-700">
                  {p.intro}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: p.color }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    "/book?service=video&package=" + encodeURIComponent(p.title)
                  }
                  className="mt-5 rounded-lg py-3 text-center text-[11px] font-bold text-white"
                  style={{ background: p.color }}
                >
                  Request {p.title}
                </Link>
              </article>
            ))}{" "}
          </div>
        </div>
      </section>{" "}
      <section className="bg-white px-6 pb-12">
        <div className="relative mx-auto grid min-h-[340px] max-w-[1320px] overflow-hidden rounded-[27px] bg-[radial-gradient(circle_at_35%_30%,#32106c_0,#16063f_45%,#09021c_100%)] text-white lg:grid-cols-[1.6fr_1fr]">
          {" "}
          <div className="relative flex min-h-[350px] items-center pl-[43%] pr-8">
            <img
              src="/images/nia-mascot.png"
              alt="Nia creative assistant"
              className="absolute bottom-0 left-3 h-[96%] max-w-[42%] object-contain object-bottom"
            />
            <div className="relative py-9">
              <h2 className="text-[28px] font-black leading-tight text-white">
                Not Sure What Video to Make?
                <br />
                <span className="text-fuchsia-400">Talk to Nia.</span>
              </h2>
              <p className="mt-4 text-sm text-white/80">
                Your creative assistant for ideas, scripts, hooks, captions and
                more.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2">
                {niaFeatures.map((f) => (
                  <span key={f} className="flex items-center gap-2 text-[11px]">
                    <Check size={13} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>{" "}
          <div className="m-5 flex flex-col rounded-[18px] border border-white/20 bg-[#13072f]/90 p-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-purple-700">
                N
              </span>
              <span>
                <b className="block text-xs">Chat with Nia</b>
                <small className="flex items-center gap-1 text-[9px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</small>
              </span>
            </div>
            <div className="flex-1 space-y-3 py-4">
              <div className="ml-auto max-w-[76%] rounded-2xl rounded-br-sm bg-gradient-to-r from-fuchsia-600 to-violet-700 p-3 text-[10px]">
                Help me create a 30-second video for my restaurant weekend offer
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-white p-3 text-[10px] text-slate-700">
                Great! I have some amazing ideas for your restaurant. What type
                of food do you specialise in?
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[10px] text-white/35">
              Type your message...{" "}
              <Send size={12} className="float-right text-purple-400" />
            </div>
            <button
              onClick={() => { trackEvent('nia_assistant_open', { cta_location: 'home_page' }); setShowAssistant(true) }}
              className="mx-auto mt-3 inline-flex items-center gap-2 rounded-lg px-7 py-2.5 text-xs font-bold text-white"
              style={{ background: gradient }}
            >
              <MessageSquare size={14} /> Talk to Nia Assistant
            </button>
          </div>{" "}
        </div>
      </section>{" "}
      {showAssistant && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 text-white">
              Loading Nia...
            </div>
          }
        >
          <NiaAgent onClose={() => setShowAssistant(false)} />
        </Suspense>
      )}{" "}
    </div>
  );
}

