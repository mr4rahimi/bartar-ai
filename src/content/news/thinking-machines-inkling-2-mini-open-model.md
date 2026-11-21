---
title: Thinking Machines مدل متن باز Inkling 2 Mini را منتشر کرد
description: Thinking Machines مدل متن باز Inkling 2 Mini را با معماری حلقه ای و مجوز Apache 2.0 عرضه کرد؛ مدلی که روی مک های ۳۲ گیگابایتی هم اجرا می شود.
category: open-source
tags:
  - Thinking Machines
  - Inkling 2 Mini
  - متن باز
  - ترنسفورمر حلقه ای
  - Hugging Face
  - کدنویسی عاملی
pubDate: "2026-11-21T12:43:34.221Z"
importance: 6
keyPoints:
  - Thinking Machines مدل متن باز Inkling 2 Mini را با معماری ترنسفورمر حلقه ای و مجوز Apache 2.0 منتشر کرد.
  - مدل ۱۲ لایه از ۲۴ لایه خود را سه بار پشت سرهم اجرا می کند تا بدون تولید متن بیشتر، بیشتر استدلال کند.
  - در آزمون های کدنویسی عاملی، بالاتر از همه مدل های متن باز زیر ۱۰۰ میلیارد پارامتر قرار گرفته است.
  - Inkling 2 Mini روی مک هایی با دست کم ۳۲ گیگابایت حافظه و روی NVIDIA DGX Spark اجرا می شود.
coverText: Inkling 2 Mini
sources:
  - name: The Decoder
    url: https://the-decoder.com/new-open-model-inkling-2-mini-thinks-in-loops-to-solve-problems-with-fewer-words-and-still-runs-on-a-laptop
    title: New open model Inkling 2 Mini thinks in loops to solve problems with fewer words and still runs on a laptop
originalTitle: New open model Inkling 2 Mini thinks in loops to solve problems with fewer words and still runs on a laptop
model: claude-sonnet-5-5
---

شرکت Thinking Machines مدل Inkling 2 Mini را منتشر کرد؛ یک مدل متن باز با معماری «ترنسفورمر حلقه ای» (looped transformer). به گفته این شرکت، مدل با تکرار بخشی از لایه ها می تواند با تعداد توکن کمتری به پاسخ درست برسد. Inkling 2 Mini در آزمون های کدنویسی عاملی در میان مدل های متن باز زیر ۱۰۰ میلیارد پارامتر در صدر قرار گرفته و روی لپ تاپ هم اجرا می شود.

## معماری حلقه ای Inkling 2 Mini

در ترنسفورمر حلقه ای، برخی لایه ها برای هر توکن چندین بار اجرا می شوند. Inkling 2 Mini از میان ۲۴ لایه خود، ۱۲ لایه را سه بار پشت سرهم اجرا می کند. Thinking Machines می گوید این روش به مدل امکان می دهد پیش از ارائه پاسخ، مدت بیشتری در درون خود استدلال کند و برای این کار لازم نباشد متن بیشتری تولید کند.

این مدل از نوع mixture-of-experts است و ۲۶٫۴ میلیارد پارامتر دارد. به گفته شرکت، به دلیل حلقه ها ۵٫۴ میلیارد پارامتر برای هر توکن فعال است. مدل متن و تصویر را پردازش می کند، پنجره زمینه یک میلیون توکنی دارد و با مجوز Apache 2.0 عرضه شده است.

## نتیجه آزمون ها

طبق گزارش، Inkling 2 Mini در آزمون های کدنویسی عاملی از همه مدل های متن باز زیر ۱۰۰ میلیارد پارامتر جلوتر است:

- DeepSWE v1.1: امتیاز ۴۸٫۲ درصد
- Vals Index v2.2: امتیاز ۴۶٫۵ درصد

شرکت Artificial Analysis در شاخص هوش (Intelligence Index) خود به این مدل ۲۰ امتیاز داده است. این امتیاز با Qwen3.8 27B (در حالت xhigh) و Nanbeige4.3-33B برابر است. بر اساس این ارزیابی، Inkling 2 Mini با هزینه ای حدود شش برابر کمتر و سرعتی چهار برابر بیشتر به امتیاز Qwen3.8 27B رسیده است. تعداد پارامترهای فعال آن بسیار کمتر است و در نمودار مقایسه کارایی روی مرز پارتو قرار می گیرد.

## دسترسی و اجرای محلی

Inkling 2 Mini روی مک هایی با دست کم ۳۲ گیگابایت حافظه و روی NVIDIA DGX Spark اجرا می شود. کاربران می توانند وزن های مدل را از Hugging Face دریافت کنند. در همان جا نسخه پژوهشی با تعداد حلقه متغیر هم در دسترس است. امکان آزمودن مدل در Tinker Playground نیز وجود دارد.

## چرا این خبر مهم است؟

انتشار Inkling 2 Mini نشان می دهد افزایش «تفکر» مدل لزوماً به تولید متن بیشتر یا مدل بزرگ تر نیاز ندارد. تکرار لایه ها راهی دیگر برای بالا بردن توان استدلال است و در این مدل با هزینه و سرعت بهتر همراه بوده است.

برای توسعه دهندگان، ترکیب مجوز Apache 2.0، امکان اجرا روی سخت افزار شخصی و نتایج قوی در کدنویسی عاملی اهمیت دارد. برای رقبای متن باز هم این مدل معیار تازه ای در مقایسه کیفیت با هزینه و سرعت است.
