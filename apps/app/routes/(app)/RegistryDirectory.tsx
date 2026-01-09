import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Gamepad2, 
  Link, 
  Bot, 
  Wrench, 
  Layers, 
  Search,
  ExternalLink,
  Github,
  CheckCircle2,
  DollarSign,
  Unlock,
  Box,
  Sparkles,
  X,
  MessageSquare,
  Send,
  Loader2,
  Star,
  ArrowRightLeft,
  Check,
  Plus,
  Lightbulb,
  Trash2,
  Microscope,
  FileCode,
  LayoutTemplate
} from 'lucide-react';

const categories = [
  { id: 'all', label: 'All Registries', icon: Layers },
  { id: 'creative', label: 'Creative & Animated', icon: Palette },
  { id: 'retro', label: 'Retro & Stylized', icon: Gamepad2 },
  { id: 'crypto', label: 'Crypto & Web3', icon: Link },
  { id: 'ai', label: 'AI & Chat', icon: Bot },
  { id: 'functional', label: 'Functional & Editors', icon: Wrench },
  { id: 'general', label: 'General Purpose', icon: Layers },
];

// Helper to infer category from text
const inferCategory = (title, desc) => {
  const t = (title + " " + desc).toLowerCase();
  if (t.includes('retro') || t.includes('8-bit') || t.includes('pixel') || t.includes('brutalist')) return 'retro';
  if (t.includes('crypto') || t.includes('web3') || t.includes('lens protocol')) return 'crypto';
  if (t.includes('ai ') || t.includes('agent') || t.includes('llm') || t.includes('chat') || t.includes('bot')) return 'ai';
  if (t.includes('motion') || t.includes('animate') || t.includes('3d') || t.includes('glass') || t.includes('creative') || t.includes('effects')) return 'creative';
  if (t.includes('editor') || t.includes('upload') || t.includes('form') || t.includes('map') || t.includes('billing') || t.includes('chart') || t.includes('grid') || t.includes('hook') || t.includes('auth')) return 'functional';
  return 'general';
};

// Helper to infer count from description (naive)
const inferCount = (desc) => {
  const match = desc.match(/(\d+)\+/);
  return match ? match[0] : "Unknown";
};

// Helper to infer license
const inferLicense = (desc) => {
  if (desc.toLowerCase().includes('premium') || desc.toLowerCase().includes('paid')) return 'Freemium';
  return 'Open Source';
};

// Helper to generate a quality rating based on reputation heuristics
const inferRating = (title, desc) => {
  const t = title.toLowerCase();
  
  // Tier S: The Titans (Widely used, highly polished)
  if (t.includes('magicui') || t.includes('aceternity') || t.includes('origin-ui')) return "5.0";
  
  // Tier A: High Quality / Specialized (Very popular)
  if (t.includes('cult-ui') || t.includes('eldoraui') || t.includes('shadcnblocks') || t.includes('plate') || t.includes('shadcn-studio')) return "4.9";
  if (t.includes('clerk') || t.includes('supabase') || t.includes('shadcn-editor') || t.includes('react-bits')) return "4.8";
  
  // Tier B: Solid / niche (Good implementation)
  if (t.includes('kokonut') || t.includes('retro') || t.includes('anim') || t.includes('motion') || t.includes('formcn')) return "4.7";
  if (t.includes('assistant') || t.includes('ai-') || t.includes('agent')) return "4.6";
  
  // Tier C: Standard / Newer (Base rating + variance based on description length as proxy for effort)
  const baseRating = 4.0;
  const variance = Math.min(0.5, desc.length / 300);
  return (baseRating + variance).toFixed(1);
};

const rawData = [
    {
        "svg_link": "inline-svg",
        "item_title": "@8bitcn",
        "item_description": "A set of 8-bit styled retro components. Works with your favorite frameworks. Open Source. Open Code.",
        "item_actions": [ "https://www.8bitcn.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@8starlabs-ui",
        "item_description": "A set of beautifully designed components designed for developers who want niche, high-utility UI elements that you won't find in standard libraries.",
        "item_actions": [ "https://ui.8starlabs.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@abui",
        "item_description": "A shadcn-compatible registry of reusable components, blocks, and utilities conforming to Vercel's components.build specification",
        "item_actions": [ "https://abui.io/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@abstract",
        "item_description": "A collection of React components for the most common crypto patterns",
        "item_actions": [ "https://build.abs.xyz/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@aceternity",
        "item_description": "A modern component library built with Tailwind CSS and Motion for React, Aceternity UI contains unique and interactive components that can make your landing pages look 100x better.",
        "item_actions": [ "https://ui.aceternity.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@agents-ui",
        "item_description": "This is a shadcn/ui component registry that distributes copy-paste React components for building LiveKit AI Agent interfaces.",
        "item_actions": [ "https://livekit.io/ui?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@aevr",
        "item_description": "A small collection of focused, production‑ready components and primitives for React/Next.js projects—built on shadcn/ui and complementary libraries.",
        "item_actions": [ "https://ui.aevr.space/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@ai-blocks",
        "item_description": "AI components for the web. No server. No API keys. Built on WebLLM.",
        "item_actions": [ "https://webllm.org/blocks?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@ai-elements",
        "item_description": "Pre-built components like conversations, messages and more to help you build AI-native applications faster.",
        "item_actions": [ "https://ai-sdk.dev/elements?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@algolia",
        "item_description": "Enterprises and developers use Algolia's AI search infrastructure to understand users and show them what they're looking for.",
        "item_actions": [ "https://sitesearch.algolia.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@aliimam",
        "item_description": "I create digital experiences that connect and inspire. I build apps, websites, brands, and products end-to-end.",
        "item_actions": [ "https://aliimam.in/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@animate-ui",
        "item_description": "A fully animated, open-source React component distribution. Browse a list of animated primitives, components and icons you can install and use in your projects.",
        "item_actions": [ "https://animate-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@assistant-ui",
        "item_description": "Radix-style React primitives for AI chat with adapters for AI SDK, LangGraph, Mastra, and custom backends.",
        "item_actions": [ "https://www.assistant-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@better-upload",
        "item_description": "Simple and easy file uploads for React. Upload directly to any S3-compatible service with minimal setup.",
        "item_actions": [ "https://better-upload.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@basecn",
        "item_description": "Beautifully crafted shadcn/ui components powered by Base UI",
        "item_actions": [ "https://basecn.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@billingsdk",
        "item_description": "BillingSDK is an open-source React and Next.js component library for SaaS billing and payments. It offers ready-to-use, customizable components for subscriptions, invoices, usage-based pricing and billing - fully compatible with Dodo Payments and Stripe.",
        "item_actions": [ "https://billingsdk.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@blocks",
        "item_description": "A set of clean, modern application building blocks for you in your applications. Free and Open Source",
        "item_actions": [ "https://blocks.so/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@bundui",
        "item_description": "A collection of 150+ handcrafted UI components built with Tailwind CSS and shadcn/ui, covering marketing, e-commerce, dashboards, real estate, and more.",
        "item_actions": [ "https://bundui.io/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@cardcn",
        "item_description": "A set of beautifully-designed shadcn card components",
        "item_actions": [ "https://cardcn.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@clerk",
        "item_description": "The easiest way to add authentication and user management to your application. Purpose-built for React, Next.js, Remix, and The Modern Web.",
        "item_actions": [ "https://clerk.com/docs/guides/development/shadcn-cli?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@commercn",
        "item_description": "Shadcn UI Blocks for Ecommerce websites",
        "item_actions": [ "https://commercn.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@coss",
        "item_description": "A new, modern UI component library built on top of Base UI. Built for developers and AI.",
        "item_actions": [ "https://coss.com/ui?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@creative-tim",
        "item_description": "A collection of open-source UI components, blocks and AI Agents. Integrate them in v0, Lovable, Claude or in your application.",
        "item_actions": [ "https://www.creative-tim.com/ui?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@cult-ui",
        "item_description": "Cult UI is a rare, curated set of shadcn-compatible, headless and composable components—tastefully animated with Framer Motion.",
        "item_actions": [ "https://www.cult-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@diceui",
        "item_description": "Accessible shadcn/ui components built with React, TypeScript, and Tailwind CSS. Copy-paste ready, and customizable.",
        "item_actions": [ "https://www.diceui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@doras-ui",
        "item_description": "A collection of beautiful, reusable component blocks built with React",
        "item_actions": [ "https://ui.doras.to/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@elements",
        "item_description": "Full-stack shadcn/ui components that go beyond UI. Add auth, monetization, uploads, and AI to your app in seconds.",
        "item_actions": [ "https://www.tryelements.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@elevenlabs-ui",
        "item_description": "A collection of Open Source agent and audio components that you can customize and extend.",
        "item_actions": [ "https://ui.elevenlabs.io/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@efferd",
        "item_description": "A collection of beautifully crafted Shadcn/UI blocks, designed to help developers build modern websites with ease.",
        "item_actions": [ "https://efferd.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@einui",
        "item_description": "Beautiful, responsive Shadcn components with frosted glass morphism. Built for modern web applications with full dark mode support.",
        "item_actions": [ "https://ui.eindev.ir/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@eldoraui",
        "item_description": "An open-source, modern UI component library for React, built with TypeScript, Tailwind CSS, and Framer Motion. Eldora UI offers beautifully crafted, reusable components designed for performance and elegance.",
        "item_actions": [ "https://eldoraui.site/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@formcn",
        "item_description": "Build production-ready forms with a few clicks using shadcn components and modern tools.",
        "item_actions": [ "https://formcn.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@gaia",
        "item_description": "Production-ready UI components designed for building beautiful AI assistants and conversational interfaces, from the team behind GAIA.",
        "item_actions": [ "https://ui.heygaia.io/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@glass-ui",
        "item_description": "A shadcn-ui compatible registry distributing 40+ glassmorphic React/TypeScript components with Apple-inspired design. Components include enhanced visual effects (glow, shimmer, ripple), theme support, and customizable glassmorphism styling.",
        "item_actions": [ "https://glass-ui.crenspire.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@ha-components",
        "item_description": "A collection of customisable components to build Home Assistant dashboards.",
        "item_actions": [ "https://hacomponents.keshuac.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@hextaui",
        "item_description": "Ready-to-use foundation components/blocks built on top of shadcn/ui.",
        "item_actions": [ "https://hextaui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@hooks",
        "item_description": "A comprehensive React Hooks Collection built with Shadcn.",
        "item_actions": [ "https://shadcn-hooks.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@intentui",
        "item_description": "Accessible React component library to copy, customize, and own your UI.",
        "item_actions": [ "https://intentui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@kibo-ui",
        "item_description": "Kibo UI is a custom registry of composable, accessible and open source components designed for use with shadcn/ui.",
        "item_actions": [ "https://www.kibo-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@kanpeki",
        "item_description": "A set of perfect-designed components built on top of React Aria and Motion.",
        "item_actions": [ "https://kanpeki.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@kokonutui",
        "item_description": "Collection of stunning components built with Tailwind CSS, shadcn/ui and Motion to use on your websites.",
        "item_actions": [ "https://kokonutui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@lens-blocks",
        "item_description": "A collection of social media components for use with Lens Social Protocol.",
        "item_actions": [ "https://lensblocks.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@limeplay",
        "item_description": "Modern UI Library for building media players in React. Powered by Shaka Player.",
        "item_actions": [ "https://limeplay.winoffrg.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@lucide-animated",
        "item_description": "An open-source collection of smooth animated lucide icons for your projects",
        "item_actions": [ "https://lucide-animated.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@lytenyte",
        "item_description": "LyteNyte Grid is a high performance, light weight, headless, React data grid. Our registry provides LyteNyte Grid themed using Tailwind and the Shadcn theme variables.",
        "item_actions": [ "https://www.1771technologies.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@magicui",
        "item_description": "UI Library for Design Engineers. 150+ free and open-source animated components and effects built with React, Typescript, Tailwind CSS, and Motion. Perfect companion for shadcn/ui.",
        "item_actions": [ "https://magicui.design/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@manifest",
        "item_description": "Agentic UI toolkit for building MCP Apps. Open-source components and blocks ready to use within your chat app.",
        "item_actions": [ "https://ui.manifest.build/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@mui-treasury",
        "item_description": "A collection of hand-crafted interfaces built on top of MUI components",
        "item_actions": [ "https://www.mui-treasury.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@moleculeui",
        "item_description": "A modern React component library focused on intuitive interactions and seamless user experiences.",
        "item_actions": [ "https://www.moleculeui.design/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@motion-primitives",
        "item_description": "Beautifully designed motions components. Easy copy-paste. Customizable. Open Source. Built for engineers and designers.",
        "item_actions": [ "https://www.motion-primitives.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@ncdai",
        "item_description": "A collection of reusable components.",
        "item_actions": [ "https://chanhdai.com/components?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@nuqs",
        "item_description": "Custom parsers, adapters and utilities from the community for type-safe URL state management.",
        "item_actions": [ "https://nuqs.dev/registry?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@nexus-elements",
        "item_description": "Ready-made React components for almost any use case. Use as is or customise and go to market fast",
        "item_actions": [ "https://elements.nexus.availproject.org/docs/view-components?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@optics",
        "item_description": "A design system that distributes re-styled components, utilities, and hooks ready to use.",
        "item_actions": [ "https://optics.agusmayol.com.ar/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@oui",
        "item_description": "React Aria Components with shadcn characteristics.Copy-and-paste react aria components that run side-by-side with shadcn components.",
        "item_actions": [ "https://oui.mw10013.workers.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@paceui",
        "item_description": "Animated components and building blocks built for smooth interaction and rich detail. Copy, customise, and create without the extra setup.",
        "item_actions": [ "https://ui.paceui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@paykit-sdk",
        "item_description": "Unified payments SDK for builders — handle checkout, billing, and webhooks across Stripe, PayPal, Adyen, and regional gateways with a single integration.",
        "item_actions": [ "https://www.usepaykit.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@plate",
        "item_description": "AI-powered rich text editor for React.",
        "item_actions": [ "https://platejs.org/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@prompt-kit",
        "item_description": "Core building blocks for AI apps. High-quality, accessible, and customizable components for AI interfaces.",
        "item_actions": [ "https://www.prompt-kit.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@prosekit",
        "item_description": "Powerful and flexible rich text editor for React, Vue, Preact, Svelte, and SolidJS.",
        "item_actions": [ "https://prosekit.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@phucbm",
        "item_description": "A collection of modern React UI components with GSAP animations.",
        "item_actions": [ "https://phucbm.com/components?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@react-aria",
        "item_description": "Customizable Tailwind and Vanilla CSS components with adaptive interactions, top-tier accessibility, and internationalization.",
        "item_actions": [ "https://react-aria.adobe.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@react-bits",
        "item_description": "A large collection of animated, interactive & fully customizable React components for building memorable websites. From smooth text animations all the way to eye-catching backgrounds, you can find it here.",
        "item_actions": [ "https://reactbits.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@retroui",
        "item_description": "A Neobrutalism styled React + TailwindCSS UI library for building bold, modern web apps. Perfect for any project using Shadcn/ui.",
        "item_actions": [ "https://retroui.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@reui",
        "item_description": "Open-source collection of UI components and animated effects built with React, Typescript, Tailwind CSS, and Motion. Pairs beautifully with shadcn/ui.",
        "item_actions": [ "https://reui.io/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@scrollxui",
        "item_description": "ScrollX UI is an open-source React and shadcn-compatible component library for animated, interactive, and customizable user interfaces. It offers motion-driven components that blend seamlessly with modern ShadCN setups.",
        "item_actions": [ "https://www.scrollxui.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@square-ui",
        "item_description": "Collection of beautifully crafted open-source layouts UI built with shadcn/ui.",
        "item_actions": [ "https://square.lndev.me/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@systaliko-ui",
        "item_description": "UI component library, Designed for flexibility, built for customization, and crafted to scale across variants and use cases.",
        "item_actions": [ "https://systaliko-ui.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@roiui",
        "item_description": "Roi UI is a library that offers UI components and blocks built with Base UI primitives. Some blocks and components use motion (framer). Everything is open-source and will be forever.",
        "item_actions": [ "https://roiui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@solaceui",
        "item_description": "Production-ready and tastefully crafted sections, animated components, and full-page templates for Next.js, Tailwind CSS & Motion",
        "item_actions": [ "https://www.solaceui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcnblocks",
        "item_description": "A registry with hundreds of extra blocks for shadcn ui.",
        "item_actions": [ "https://shadcnblocks.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcndesign",
        "item_description": "A growing collection of high-quality blocks and themes for shadcn/ui.",
        "item_actions": [ "https://www.shadcndesign.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcn-map",
        "item_description": "A map component for shadcn/ui. Built with Leaflet and React Leaflet.",
        "item_actions": [ "https://shadcn-map.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcn-studio",
        "item_description": "An open-source set of shadcn/ui components, blocks, and templates with a powerful theme generator.",
        "item_actions": [ "https://shadcnstudio.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcn-editor",
        "item_description": "Accessible, Customizable, Rich Text Editor. Made with Lexical and Shadcn/UI. Open Source. Open Code.",
        "item_actions": [ "https://shadcn-editor.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcnui-blocks",
        "item_description": "A collection of premium, production-ready shadcn/ui blocks, components and templates.",
        "item_actions": [ "https://shadcnui-blocks.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@shadcraft",
        "item_description": "A collection of polished shadcn/ui components and marketing blocks built to production standards. Fast to use, easy to extend, and ready for any modern web project.",
        "item_actions": [ "https://shadcraft-free.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@smoothui",
        "item_description": "A collection of beautifully crafted motion components built with React, Framer Motion, and TailwindCSS. Designed to elevate microinteractions, each component focuses on smooth animations, subtle feedback, and delightful UX. Perfect for designers and developers who want to add refined motion to their interfaces — copy, paste, and make your UI come alive.",
        "item_actions": [ "https://smoothui.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@spectrumui",
        "item_description": "A modern component library built with shadcn/ui and Tailwind CSS. Spectrum UI offers elegant, responsive components and smooth animations designed for high-quality interfaces.",
        "item_actions": [ "https://ui.spectrumhq.in/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@supabase",
        "item_description": "A collection of React components and blocks built on the shadcn/ui library that connect your front-end to your Supabase back-end via a single command.",
        "item_actions": [ "https://supabase.com/ui?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@svgl",
        "item_description": "A beautiful library with SVG logos.",
        "item_actions": [ "https://svgl.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@tailark",
        "item_description": "Shadcn blocks designed for building modern marketing websites.",
        "item_actions": [ "https://tailark.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@taki",
        "item_description": "Beautifully designed, accessible components that you can copy and paste into your apps. Made with React Aria Components and Shadcn tokens.",
        "item_actions": [ "https://taki-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@tour",
        "item_description": "A component for building onboarding tours. Designed to integrate with shadcn/ui.",
        "item_actions": [ "https://onboarding-tour.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@uitripled",
        "item_description": "An open-source, Production-ready UI components and blocks powered by shadcn/ui and Framer Motion",
        "item_actions": [ "https://ui.tripled.work/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@utilcn",
        "item_description": "Fullstack registry items to start those big features. Utilcn has ChatGPT Apps, file uploading (with progress bars) and downloading, and a way to make your env vars typesafe on the backend.",
        "item_actions": [ "https://utilcn.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@wandry-ui",
        "item_description": "A set of open source fully controlled React Inertia form elements",
        "item_actions": [ "http://ui.wandry.com.ua/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@wigggle-ui",
        "item_description": "A beautiful collection of copy-and-paste widgets for your next project.",
        "item_actions": [ "https://wigggle-ui.vercel.app/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@zippystarter",
        "item_description": "Expertly crafted blocks, components & themes for shadcn/ui.",
        "item_actions": [ "https://zippystarter.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@uicapsule",
        "item_description": "A curated collection of components that spark joy. Featuring interactive concepts, design experiments, and components in the intersection of AI/UI.",
        "item_actions": [ "https://uicapsule.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@ui-layouts",
        "item_description": "UI Layouts offers components, effects, design tools, and ready-made blocks that make building modern interfaces more efficient—built with React, Next.js, Tailwind CSS, and shadcn/ui.",
        "item_actions": [ "https://ui-layouts.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@pureui",
        "item_description": "Pure UI is a curated collection of refined, animated, and accessible components built with Base UI, Tailwind CSS, Motion, and other high-quality open source libraries.",
        "item_actions": [ "https://pure.kam-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@tailwind-builder",
        "item_description": "Tailwind Builder is a collection of free ui blocks and components and provide ai tools to generate production-ready forms, tables, and charts in seconds. Built with React, Next.js, Tailwind & ShadCN.",
        "item_actions": [ "https://tailwindbuilder.ai/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@tailwind-admin",
        "item_description": "Tailwind Builder provides free tailwind admin dashboard templates, components and ui-blocks built with React, Next.js, Tailwind CSS, and shadcn/ui to help you build admin panels quickly and efficiently.",
        "item_actions": [ "https://tailwind-admin.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@skiper-ui",
        "item_description": "Brand new uncommon components for your Next.js project. Use with ease through shadcn CLI 3.0, featuring fast-growing components and collections that are easy to edit and use.",
        "item_actions": [ "https://skiper-ui.com/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    },
    {
        "svg_link": "inline-svg",
        "item_title": "@animbits",
        "item_description": "AnimBits is a collection animated UI components for React that use Framer Motion. The components provided include buttons, cards, text, icons, lists, loaders, and page transitions, animation hooks all of which have general-purpose effects that are not flashy and easy on the eyes, making them easy to use.",
        "item_actions": [ "https://animbits.dev/?utm_source=ui.shadcn.com&utm_medium=referral&utm_campaign=directory" ]
    }
];

const registries = rawData.map(item => ({
  title: item.item_title,
  category: inferCategory(item.item_title, item.item_description),
  count: inferCount(item.item_description),
  license: inferLicense(item.item_description),
  rating: inferRating(item.item_title, item.item_description),
  description: item.item_description,
  url: item.item_actions[0],
  featured: ['@origin-ui', '@magicui', '@aceternity'].includes(item.item_title)
}));

const RatingBadge = ({ rating }) => {
  const numRating = parseFloat(rating);
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  
  if (numRating >= 4.9) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
  else if (numRating >= 4.7) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  else if (numRating >= 4.5) colorClass = "bg-orange-50 text-orange-700 border-orange-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colorClass}`}>
      <Star size={12} className={`mr-1.5 ${numRating >= 4.9 ? "fill-yellow-500 text-yellow-500" : "fill-current opacity-50"}`} />
      {rating}
    </span>
  );
};

const LicenseBadge = ({ type }) => {
  const styles = {
    "Open Source": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Freemium": "bg-purple-100 text-purple-700 border-purple-200",
    "Paid": "bg-amber-100 text-amber-700 border-amber-200"
  };

  const icons = {
    "Open Source": <CheckCircle2 size={12} className="mr-1.5" />,
    "Freemium": <Unlock size={12} className="mr-1.5" />,
    "Paid": <DollarSign size={12} className="mr-1.5" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[type] || styles["Open Source"]}`}>
      {icons[type]}
      {type}
    </span>
  );
};

const ComponentCountBadge = ({ count }) => {
  const displayCount = count === "Unknown" ? "??" : count;
  
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200">
      <Box size={12} className="mr-1.5 text-slate-500" />
      {displayCount}
    </span>
  );
};

// --- Gemini API Logic ---
const callGemini = async (prompt, systemInstruction) => {
  const apiKey = ""; // Provided by environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const delays = [1000, 2000, 4000, 8000, 16000];
  
  for (let i = 0; i < delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (i === delays.length - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

const AiAdvisorModal = ({ isOpen, onClose, registries }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);

    const systemPrompt = `
      You are an expert UI/UX advisor for the shadcn/ui ecosystem.
      You have access to the following registry data:
      ${JSON.stringify(registries.map(r => ({ title: r.title, desc: r.description, category: r.category, tags: r.license })))}

      Your goal is to recommend the best registries for the user's project description.
      1. Analyze the user's request (e.g., "retro game", "SaaS dashboard").
      2. Pick the top 1-3 most relevant registries from the provided list.
      3. Explain WHY each one is a good fit in a friendly, concise manner.
      4. If nothing fits perfectly, suggest "@shadcnui-blocks" or "@origin-ui" as a general-purpose fallback.
      
      Format the output as a simple list. Use bolding for registry names. Add emoji where appropriate.
    `;

    try {
      const result = await callGemini(query, systemPrompt);
      setResponse(result);
    } catch (err) {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300" />
              AI Project Advisor
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Describe your project, and I'll recommend the best registries.
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!response && !loading && (
             <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm mb-4">
               <strong>Try asking:</strong>
               <ul className="mt-2 space-y-1 list-disc list-inside opacity-80">
                 <li>"I'm building a cyberpunk-themed crypto exchange."</li>
                 <li>"I need a clean, animated landing page for a startup."</li>
                 <li>"A brutalist personal portfolio with bold borders."</li>
               </ul>
             </div>
          )}

          <div className="relative">
            <textarea
              className="w-full border border-slate-200 rounded-xl p-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-slate-50 min-h-[100px]"
              placeholder="Describe what you are building..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {response && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="prose prose-sm prose-slate max-w-none">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
                  <Bot size={16} />
                  <span>Recommendation</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {response}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompareModal = ({ isOpen, onClose, selectedItems }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && selectedItems.length > 0) {
      generateComparison();
    } else {
      setContent('');
    }
  }, [isOpen]);

  const generateComparison = async () => {
    setLoading(true);
    setError(null);
    const systemPrompt = "You are a senior UI Engineer helping a developer choose a component library. Be critical, concise, and structured.";
    
    const prompt = `Compare the following UI registries: ${selectedItems.map(i => i.title).join(', ')}. 
    
    Context Data for each:
    ${selectedItems.map(i => `${i.title}: ${i.description} (Category: ${i.category})`).join('\n')}
    
    Task:
    Output a comparison in Markdown format.
    1. A brief "At a Glance" summary of how they differ.
    2. A comparison table with columns: 'Feature', ${selectedItems.map(i => `'`+i.title+`'`).join(', ')}. Rows to include: 'Core Aesthetic', 'Best Use Case', 'Complexity', 'Unique Strength'.
    3. A 'Verdict' section explaining specifically when to choose which over the other.
    
    Keep it practical for a developer.`;

    try {
      const result = await callGemini(prompt, systemPrompt);
      setContent(result);
    } catch (err) {
      setError("Failed to generate comparison. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-indigo-400" />
            Registry Comparison
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto grow">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-48 space-y-4">
               <Loader2 size={32} className="animate-spin text-indigo-600" />
               <p className="text-slate-500 animate-pulse">Analyzing registries with Gemini...</p>
             </div>
          ) : error ? (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg text-center">
              {error}
              <button onClick={generateComparison} className="block mx-auto mt-2 text-sm underline">Retry</button>
            </div>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none">
               <div className="whitespace-pre-wrap leading-relaxed text-slate-800">
                  {content}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IdeaSparkModal = ({ isOpen, onClose, registryTitle }) => {
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && registryTitle) {
      generateIdea();
    }
  }, [isOpen, registryTitle]);

  const generateIdea = async () => {
    setLoading(true);
    const systemPrompt = "You are a creative coding mentor.";
    const prompt = `Give me ONE unique, exciting, and specific project idea that uses the '${registryTitle}' shadcn registry. 
    Keep it to 2-3 sentences. Focus on what makes this specific registry unique. 
    Start with an emoji suitable for the idea.`;

    try {
      const result = await callGemini(prompt, systemPrompt);
      setIdea(result);
    } catch (e) {
      setIdea("Failed to spark an idea. Try again!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-indigo-100 p-6 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
             <Lightbulb size={24} className={loading ? "animate-pulse" : ""} />
          </div>
          {loading ? (
            <p className="text-slate-500">Sparking a brilliant idea...</p>
          ) : (
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Project Idea for {registryTitle}</h3>
              <p className="text-slate-700 leading-relaxed">{idea}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UxResearcherModal = ({ isOpen, onClose, registries }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [step, setStep] = useState(0); // 0: Input, 1: Analyzing, 2: Report

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!context.trim() && !repoUrl.trim()) return;
    
    setLoading(true);
    setStep(1);

    const systemPrompt = `
      You are a Senior Product Manager and Lead UX Researcher.
      Your goal is to analyze a codebase's backend structure to derive user intent, user stories, and a complete frontend architecture.
      
      You have access to the following 'shadcn' component registries which you MUST use in your recommendations:
      ${JSON.stringify(registries.map(r => ({ title: r.title, desc: r.description, tags: r.category })))}
    `;

    const prompt = `
      I have a backend/repo. 
      Repo URL: ${repoUrl || "Not provided"}
      
      CODE / SCHEMA / CONTEXT:
      ${context}

      Please generate a "UX Research & Architecture Report" in Markdown.
      Structure it exactly as follows:

      # 🔬 UX Research Findings
      
      ## 1. User Intentionality & Context
      - **Target Audience:** Who is this for?
      - **Core Problem:** What backend logic solves which user pain point?
      - **Context:** Is this internal tooling, B2C app, SaaS, etc?

      ## 2. User Stories (Mapped to Backend)
      (List 3-5 key user stories. Format: "As a [User], I want to [Action] so that [Benefit] -> Powered by [Specific DB Model/API Route]")

      ## 3. Wireframe Specifications
      (List 3-4 critical screens. For each screen, list the UI zones and mapping data to backend)

      ## 4. 🎨 Recommended Registry Stack
      (Select 3-4 SPECIFIC registries from the provided list that fit the vibe and functionality. Explain WHY.)
      - **Core UI:** [Registry Name]
      - **Special Feature:** [Registry Name]
      
      ## 5. 🤖 Coding Agent Prompts
      (Provide 2 specific, complex prompts I can copy-paste to a coding agent to build the scaffolding. One for "Setup & Theme", one for "Feature Implementation".)
    `;

    try {
      const result = await callGemini(prompt, systemPrompt);
      setReport(result);
      setStep(2);
    } catch (e) {
      console.error(e);
      // Fallback/Error state handled by simple alert for now
      alert("Analysis failed. Please try with less text or check API key.");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Microscope size={24} className="text-emerald-400" />
              UX Researcher & Architect
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Deep analysis of your backend to generate frontend specs, stories, and wireframes.
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto bg-slate-50 p-6">
          {step === 0 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Github size={16} /> GitHub Repo URL (Optional)
                </label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                />
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <FileCode size={16} /> Repository Context (Required)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Paste your <code>README.md</code>, <code>schema.prisma</code>, API routes, or backend logic here. 
                  The more context, the better the architecture report.
                </p>
                <textarea 
                  className="w-full h-64 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                  placeholder="Paste code or documentation here..."
                  value={context}
                  onChange={e => setContext(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={!context.trim()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Microscope size={20} />
                Analyze & Architect
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
                <Microscope size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Analyzing Architecture...</h3>
                <p className="text-slate-500">Deriving user stories from backend logic...</p>
                <p className="text-slate-500 text-sm">Mapping database schemas to wireframes...</p>
                <p className="text-slate-500 text-sm">Selecting optimal shadcn components...</p>
              </div>
            </div>
          )}

          {step === 2 && report && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="prose prose-slate max-w-none">
                 <div className="whitespace-pre-wrap leading-relaxed">
                   {report}
                 </div>
               </div>
               <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                   onClick={() => setStep(0)}
                   className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                 >
                   Start Over
                 </button>
                 <button 
                   onClick={() => { navigator.clipboard.writeText(report); alert('Report copied to clipboard!'); }}
                   className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                 >
                   Copy Report
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RegistryDirectory() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isResearcherOpen, setIsResearcherOpen] = useState(false);
  
  // Idea Spark State
  const [sparkRegistry, setSparkRegistry] = useState(null);

  const filteredRegistries = registries.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleCompare = (registry) => {
    setCompareList(prev => {
      const exists = prev.find(r => r.title === registry.title);
      if (exists) {
        return prev.filter(r => r.title !== registry.title);
      }
      if (prev.length >= 3) {
        // Simple alert replacement or just ignore
        return prev; 
      }
      return [...prev, registry];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative pb-24">
      <AiAdvisorModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        registries={registries} 
      />
      
      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        selectedItems={compareList} 
      />

      <IdeaSparkModal 
        isOpen={!!sparkRegistry} 
        onClose={() => setSparkRegistry(null)} 
        registryTitle={sparkRegistry} 
      />

      <UxResearcherModal 
        isOpen={isResearcherOpen} 
        onClose={() => setIsResearcherOpen(false)} 
        registries={registries} 
      />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Community Registry Directory
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mt-2">
              Discover community registries for shadcn/ui components. 
              Add them simply using <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">npx shadcn add @registry/component</code>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search registries..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* UX Researcher Button */}
            <button 
              onClick={() => setIsResearcherOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg font-medium shadow-md hover:shadow-lg hover:bg-slate-800 transition-all transform hover:-translate-y-0.5"
              title="Analyze backend repo & generate frontend specs"
            >
              <Microscope size={16} className="text-emerald-400" />
              UX Researcher
            </button>

            {/* AI Advisor Button */}
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles size={16} className="text-yellow-300" />
              Find Perfect Registry
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-md transform scale-105' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'}
                  `}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegistries.length > 0 ? (
            filteredRegistries.map((registry, index) => {
              const isSelected = compareList.some(r => r.title === registry.title);
              
              return (
                <div 
                  key={index} 
                  className={`group relative bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col
                    ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSparkRegistry(registry.title); }}
                      className="p-1.5 text-amber-400 hover:bg-amber-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Spark an idea with Gemini"
                    >
                      <Lightbulb size={18} />
                    </button>
                    <button 
                      onClick={() => toggleCompare(registry)}
                      className={`
                        p-1.5 rounded-md transition-all
                        ${isSelected 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}
                      `}
                      title={isSelected ? "Remove from comparison" : "Select to compare"}
                    >
                      {isSelected ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>

                  {/* Card Header Section */}
                  <div className="mb-4 pr-16">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2 leading-tight">
                        {registry.title}
                        {registry.featured && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Featured / Popular"></span>
                        )}
                      </h3>
                    </div>
                    
                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2">
                      <LicenseBadge type={registry.license} />
                      <ComponentCountBadge count={registry.count} />
                      <RatingBadge rating={registry.rating} />
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm flex-grow leading-relaxed mb-6">
                    {registry.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                     <div className="flex gap-2">
                        <a href={registry.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer" title="View Documentation">
                          <ExternalLink size={16} />
                        </a>
                        <div className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer" title="View on GitHub">
                          <Github size={16} />
                        </div>
                     </div>
                     <button className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1">
                       Install
                       <span className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-500">npx...</span>
                     </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                <Search className="h-full w-full" />
              </div>
              <p>No registries found matching your criteria.</p>
              <button 
                onClick={() => {setActiveCategory('all'); setSearchTerm('');}}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
           <div className="text-sm font-medium text-slate-600">
             <span className="text-indigo-600 font-bold">{compareList.length}</span> selected
           </div>
           
           <div className="h-4 w-px bg-slate-200"></div>
           
           <button 
             onClick={() => setCompareList([])}
             className="text-slate-400 hover:text-slate-600 transition-colors"
             title="Clear selection"
           >
             <Trash2 size={16} />
           </button>
           
           <button 
             onClick={() => setIsCompareModalOpen(true)}
             disabled={compareList.length < 2}
             className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             <Sparkles size={14} className="text-indigo-200" />
             Compare with AI
           </button>
        </div>
      )}

    </div>
  );
}
