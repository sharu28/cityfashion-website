# Project Memory

## Purpose

City Fashion is a mobile-first wholesale ladies' wear catalog for Sri Lanka retailers.

This file is the public-safe fact base for the project.

## Stable business facts

- Primary domain: `https://cityfashion.shop`
- GitHub repo: `https://github.com/sharu28/cityfashion-website`
- Deployment: Vercel
- WhatsApp number: `+94742216040`
- Address: `131 Keyzer Street, Colombo 11`
- Main audience: small and mid-sized ladies' wear retailers in Sri Lanka
- Main user flow:
  1. browse category or new arrivals
  2. open product
  3. view all colors
  4. order on WhatsApp

## Product and UX constraints

- Keep the site image-heavy and product-led
- Use simple English
- Show starting price and MOQ
- Do not show stock status
- Keep WhatsApp CTA strong and visible

## Current catalog state

- Current imported starter batch: `29` products
- Current high-confidence categorized style: `4080` -> `embroidered-tops`
- Most newer category assignments are provisional pending business review

## Category slugs

- `frocks`
- `embroidered-tops`
- `top-and-pant-sets`
- `side-open-tops`
- `lungi-sets`
- `leggings`
- `plaza-pants`
- `printed-tops`

## Source and generated locations

- Raw source photos: `C:\Users\sharu\Projects\family-biz\products`
- Starter overrides: `data/product-overrides.json`
- Generated catalog: `data/generated/products.generated.json`
- Website-ready copied images: `public/products`

## Memory contract

- `.memory/PROJECT.md` = stable truth
- `.memory/STATE.md` = latest working context
- `.memory/TODO.md` = running task list
- `.memory/IMPROVEMENTS.md` = backlog and future ideas
- `.memory/SEO_GEO.md` = search visibility memory
- `.memory/EXPERIMENTS.md` = external tool and workflow experiments

## Privacy rule

This folder must stay public-safe.

Do not store:

- secrets
- credentials
- margins
- private supplier notes
- sensitive customer data
