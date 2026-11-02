/* UTC Advertising & Events — site behaviour */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Theme (light default, dark option) ---------- */
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("utc-theme", next); } catch (e) {}
      toggle.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  }

  /* ---------- Header: shadow line + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { header && header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    navToggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !navToggle.contains(e.target)) setOpen(false);
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Page transitions: fallback where View Transitions aren't supported ---------- */
  if (root.classList.contains("no-vt") && !reduceMotion) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === "_blank" || a.hasAttribute("download") || a.origin !== location.origin) return;
      if (a.pathname === location.pathname && a.hash) return;
      e.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(function () { location.href = a.href; }, 240);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) root.classList.remove("is-leaving"); });
  }

  /* ---------- Tag elements for scroll & image animations ---------- */
  var tag = function (els, opts) {
    els.forEach(function (el, i) {
      if (opts.img) el.classList.add("img-reveal");
      else el.classList.add("reveal");
      if (opts.dir && !el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", typeof opts.dir === "function" ? opts.dir(el, i) : opts.dir);
      if (opts.stagger) el.style.setProperty("--d", (i * opts.stagger) + "ms");
    });
  };
  // Section headings
  $$(".section-head").forEach(function (h) { tag($$(":scope > *", h), { stagger: 90 }); });
  // Card grids, process steps, photo strips — staggered
  $$(".grid, .steps, .photo-strip").forEach(function (g) { tag($$(":scope > *", g), { stagger: 110 }); });
  // Split layouts slide in from opposite sides
  $$(".split").forEach(function (s) { var k = $$(":scope > *", s); tag(k.slice(0, 1), { dir: "left" }); tag(k.slice(1), { dir: "right", stagger: 120 }); });
  $$(".service-row").forEach(function (row, i) {
    row.classList.remove("reveal");
    tag($$(".service-copy", row), { dir: i % 2 ? "left" : "right" });
  });
  $$(".info-item").forEach(function (t, i) { t.classList.add("reveal"); t.setAttribute("data-reveal", "right"); t.style.setProperty("--d", (i * 90) + "ms"); });
  // Images: wipe + zoom-settle
  $$(".hero-media figure").forEach(function (f, i) { f.classList.add("img-reveal"); f.style.setProperty("--d", (250 + i * 180) + "ms"); });
  tag($$(".card-media, .service-media, .split-media > img, .photo-strip figure, .map"), { img: true });
  // Image reveals inherit their card's stagger delay
  $$(".card-media").forEach(function (m) { var c = m.closest(".card"); if (c && c.style.getPropertyValue("--d")) m.style.setProperty("--d", c.style.getPropertyValue("--d")); });

  // Hero accent words: split into letters for the wave, each coloured along the brand gradient
  var accentWords = $$(".hero h1 .aw");
  var accentLetters = accentWords.reduce(function (n, w) { return n + w.textContent.length; }, 0);
  var ci = 0;
  accentWords.forEach(function (w) {
    var text = w.textContent;
    w.textContent = "";
    text.split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "ch"; span.textContent = ch;
      span.style.setProperty("--c", ci);
      span.style.setProperty("--t", (ci / Math.max(accentLetters - 1, 1)).toFixed(3));
      span.setAttribute("aria-hidden", "true");
      w.appendChild(span); ci++;
    });
    w.classList.add("split");
  });
  // Letters are aria-hidden, so give the heading its words back
  var heroH1 = document.querySelector(".hero h1");
  if (heroH1 && accentWords.length) heroH1.setAttribute("aria-label", heroH1.textContent.replace(/\s+/g, " ").trim());

  // Headings: split into words that rise in one after another
  $$(".section-head h2, .split h2").forEach(function (h) {
    var i = 0;
    $$("*", h).concat([h]).forEach(function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (t) {
        if (t.nodeType !== 3 || !t.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        t.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement("span"), inner = document.createElement("span");
          w.className = "w"; inner.textContent = part; inner.style.setProperty("--wi", i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        node.replaceChild(frag, t);
      });
    });
    h.classList.add("split-words", "reveal");
    h.setAttribute("data-reveal", "words");
  });
  $$(".section-head .lead, .page-hero .lead").forEach(function (l) { if (!l.closest(".page-hero")) { l.classList.add("reveal"); l.setAttribute("data-reveal", "blur"); } });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal, .img-reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Scroll progress + parallax ---------- */
  var progress = document.querySelector(".scroll-progress");
  var parallax = reduceMotion ? [] : [
    [".hero .arc-1", -0.25], [".hero .arc-2", 0.15],
    [".page-hero .arc-1", -0.3], [".page-hero .arc-2", 0.2],
    [".hero-media figure:nth-child(1)", -0.06], [".hero-media figure:nth-child(2)", -0.14], [".hero-media figure:nth-child(3)", -0.03],
    [".split-media .inset", -0.12], [".cta-band .arc", -0.12], [".vm-card .arc", -0.08], [".site-footer .arc", -0.1]
  ].reduce(function (list, p) {
    $$(p[0]).forEach(function (el) { list.push({ el: el, speed: p[1] }); });
    return list;
  }, []);
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var road = document.querySelector(".road-wrap");
  var roadSteps = road ? $$(".road-step", road) : [];
  var marqueeRows = $$(".marquee-row");
  var cta = reduceMotion ? null : document.querySelector(".cta-band");
  if (cta) cta.classList.remove("reveal"); // its scroll-linked zoom replaces the fade-up
  var proc = document.querySelector(".process");
  var procItems = proc ? $$(".process-item", proc) : [];
  var roadTimer;

  var ticking = false;
  var update = function () {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.setProperty("--progress", max > 0 ? (scrollY / max).toFixed(4) : 0);

    // Roadmap line draws with scroll; milestones light up as the line reaches them
    if (road) {
      var rr = road.getBoundingClientRect();
      var p = reduceMotion ? 1 : clamp((innerHeight * 0.95 - rr.top) / (rr.height + innerHeight * 0.35));
      road.style.setProperty("--road", p.toFixed(4));
      roadSteps.forEach(function (s, i) { s.classList.toggle("lit", p >= i / (roadSteps.length - 1) - 0.001); });
      road.classList.add("moving");
      clearTimeout(roadTimer);
      roadTimer = setTimeout(function () { road.classList.remove("moving"); }, p >= 1 ? 0 : 600);
    }

    // Client marquee rows drift in opposite directions with scroll
    marqueeRows.forEach(function (row) {
      if (reduceMotion) return;
      var r = row.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var off = (r.top + r.height / 2 - innerHeight / 2) * 0.35 * Number(row.getAttribute("data-dir"));
      row.style.translate = off.toFixed(1) + "px 0";
    });

    // CTA band zooms to full size as it arrives
    if (cta) {
      var cr = cta.getBoundingClientRect();
      cta.style.setProperty("--z", (0.9 + 0.1 * clamp((innerHeight - cr.top) / (innerHeight * 0.6))).toFixed(4));
    }

    // Process spine fills as its middle passes the viewport centre; steps activate as the fill reaches them
    if (proc) {
      var pr = proc.getBoundingClientRect();
      var pp = reduceMotion ? 1 : clamp((innerHeight * 0.6 - pr.top) / pr.height);
      proc.style.setProperty("--proc", pp.toFixed(4));
      procItems.forEach(function (it) {
        var ir = it.getBoundingClientRect();
        it.classList.toggle("active", reduceMotion || ir.top + ir.height / 2 <= pr.top + pp * pr.height + 1);
      });
    }

    parallax.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      var offset = (r.top + r.height / 2 - innerHeight / 2) * p.speed;
      p.el.style.translate = "0 " + offset.toFixed(1) + "px";
    });
  };
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();

  /* ---------- Project card tilt (mouse only) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".project-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
        card.classList.add("tilting");
      });
      card.addEventListener("pointerleave", function () { card.classList.remove("tilting"); });
    });
  }

  /* ---------- Custom cursor: dot + trailing ring (mouse only) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot); document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100, started = false;
    var loop = function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(loop);
    };
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      if (!started) { started = true; rx = mx; ry = my; root.classList.add("has-cursor"); requestAnimationFrame(loop); }
      cursorState(e.target);
    });
    // Content moves under a still mouse while scrolling, so re-check what the cursor is over
    window.addEventListener("scroll", function () { if (started) cursorState(document.elementFromPoint(mx, my)); }, { passive: true });
    function cursorState(t) {
      var hit = function (sel) { return !!(t && t.closest && t.closest(sel)); };
      root.classList.toggle("cursor-hidden", hit("input, textarea, select, iframe"));
      root.classList.toggle("cursor-hover", hit("a, button, .card, label, .marquee-track li"));
    }
    document.addEventListener("pointerdown", function () { root.classList.add("cursor-down"); });
    document.addEventListener("pointerup", function () { root.classList.remove("cursor-down"); });
    document.documentElement.addEventListener("mouseleave", function () { root.classList.add("cursor-hidden"); });
    document.documentElement.addEventListener("mouseenter", function () { root.classList.remove("cursor-hidden"); });

    // Spotlight that follows the cursor across the hero and CTA band
    $$(".hero, .cta-band").forEach(function (el) {
      el.classList.add("spotlight");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
        el.classList.add("lit-up");
      });
      el.addEventListener("pointerleave", function () { el.classList.remove("lit-up"); });
    });
  }

  /* ---------- Services dropdown ---------- */
  $$(".has-menu").forEach(function (item) {
    var btn = item.querySelector(".submenu-toggle");
    var set = function (open) { item.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
    btn.addEventListener("click", function (e) { e.stopPropagation(); set(!item.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  });

  /* ---------- Home: show more services ---------- */
  var moreBtn = document.querySelector(".more-services");
  if (moreBtn) {
    var grid = document.getElementById(moreBtn.getAttribute("aria-controls"));
    var label = moreBtn.querySelector(".more-label");
    var extra = $$(".is-extra", grid).length;
    moreBtn.addEventListener("click", function () {
      var open = !grid.classList.contains("show-all");
      grid.classList.toggle("show-all", open);
      moreBtn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Show fewer services" : "Show " + extra + " more services";
      if (!open) grid.scrollIntoView({ block: "nearest" });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Gallery: filter ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projects = document.querySelectorAll(".project-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      projects.forEach(function (card) {
        var cats = (card.getAttribute("data-cat") || "").split(" ");
        card.hidden = !(f === "all" || cats.indexOf(f) !== -1);
      });
    });
  });

  /* ---------- Gallery: lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb && projects.length) {
    var lbImg = lb.querySelector("img");
    var lbTitle = lb.querySelector("figcaption b");
    var lbSub = lb.querySelector("figcaption span");
    var images = [], index = 0, title = "", lastFocus = null;

    var show = function () {
      lbImg.classList.remove("swap");
      void lbImg.offsetWidth; // restart the swap animation
      lbImg.classList.add("swap");
      lbImg.src = images[index];
      lbImg.alt = title + " — photo " + (index + 1) + " of " + images.length;
      lbTitle.textContent = title;
      lbSub.textContent = (index + 1) + " / " + images.length;
    };
    var open = function (card) {
      images = card.getAttribute("data-images").split(",");
      title = card.getAttribute("data-title");
      index = 0; lastFocus = card;
      show();
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    };
    var close = function () {
      lb.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    var step = function (d) { index = (index + d + images.length) % images.length; show(); };

    projects.forEach(function (card) { card.addEventListener("click", function () { open(card); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- Quote form ---------- */
  var form = document.getElementById("quote-form");
  if (form) {
    // Pre-select a service when arriving from "Ask about this service"
    var params = new URLSearchParams(window.location.search);
    var svc = params.get("service");
    if (svc) {
      var select = form.querySelector("#service");
      Array.prototype.forEach.call(select.options, function (o) { if (o.value === svc) select.value = svc; });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.value.trim() !== "" && (input.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        field.classList.toggle("invalid", !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;

      // No form backend yet: hand the enquiry to the visitor's email app.
      var v = function (id) { return form.querySelector("#" + id).value.trim(); };
      var subject = "Quote request — " + (v("service") || "General enquiry");
      var body = [
        "Name: " + v("first-name") + " " + v("last-name"),
        "Company: " + v("company"),
        "Email: " + v("email"),
        "Phone: " + v("phone"),
        "Service: " + v("service"),
        "",
        v("message")
      ].join("\n");
      window.location.href = "mailto:info@utcae-qatar.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      form.querySelector(".form-status").classList.add("show");
    });

    form.querySelectorAll("input, select").forEach(function (input) {
      input.addEventListener("input", function () { input.closest(".field").classList.remove("invalid"); });
    });
  }
})();
