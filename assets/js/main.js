(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (prefersReducedMotion || !finePointer) {
    document.body.classList.add("no-custom-cursor");
  }

  // Mobile nav
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("nav-open")) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-nav]") || target.closest("[data-nav-toggle]")) return;
      nav.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!nav.classList.contains("nav-open")) return;
      nav.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    });
  }

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const splitEls = Array.from(document.querySelectorAll("[data-split]"));
  for (const el of splitEls) {
    const text = el.textContent || "";
    el.textContent = "";
    let i = 0;
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = ch === " " ? "char space" : "char";
      span.style.setProperty("--i", String(i));
      span.textContent = ch === " " ? "\u00A0" : ch;
      el.appendChild(span);
      i += 1;
    }
  }

  // Projects filters
  const filterBar = document.querySelector("[data-project-filters]");
  const projectCards = Array.from(document.querySelectorAll("[data-project][data-tags]"));
  if (filterBar && projectCards.length) {
    const filterButtons = Array.from(filterBar.querySelectorAll("button[data-filter]"));

    const setActive = (active) => {
      for (const btn of filterButtons) {
        const isActive = btn.getAttribute("data-filter") === active;
        btn.setAttribute("aria-pressed", String(isActive));
      }
    };

    const applyFilter = (active) => {
      for (const card of projectCards) {
        const tags = (card.getAttribute("data-tags") || "").toLowerCase();
        const match = active === "all" ? true : tags.split(/\s+/).includes(active);
        card.hidden = !match;
      }
    };

    filterBar.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest("button[data-filter]");
      if (!(btn instanceof HTMLButtonElement)) return;
      const active = (btn.getAttribute("data-filter") || "all").toLowerCase();
      setActive(active);
      applyFilter(active);
    });

    // Default state
    setActive("all");
    applyFilter("all");
  }

  // Custom cursor (fine pointers only)
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");

  if (dot && ring && finePointer && !prefersReducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;

    const set = (el, px, py) => {
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    };

    window.addEventListener(
      "mousemove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    const hoverables = "a, button, input, textarea, select, [data-magnetic]";
    document.addEventListener(
      "mouseover",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (t.closest(hoverables)) document.body.classList.add("cursor-hover");
      },
      { passive: true }
    );

    document.addEventListener(
      "mouseout",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (t.closest(hoverables)) document.body.classList.remove("cursor-hover");
      },
      { passive: true }
    );

    const tick = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;

      set(dot, x - 3, y - 3);
      set(ring, x - 16, y - 16);

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // Magnetic buttons (subtle)
  const magneticEls = Array.from(document.querySelectorAll("[data-magnetic]"));
  for (const el of magneticEls) {
    let rect;

    const onMove = (e) => {
      rect = rect || el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const x = (relX - rect.width / 2) * 0.18;
      const y = (relY - rect.height / 2) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };

    const onLeave = () => {
      rect = undefined;
      el.style.transform = "";
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseenter", onEnter, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
  }

  // YouTube page: show videos from playlist, with fallback to embed
  const videoContainers = Array.from(document.querySelectorAll("[data-random-videos]"));
  if (videoContainers.length) {
    const PLAYLIST_EMBED_URL = "https://www.youtube.com/embed/videoseries?si=ngb-iYa7Fet8mL-e&list=PL30meFIBzqZ0WoAvls6u9Bqqd6tHJJusg";
    const PLAYLIST_RSS_URL = "https://www.youtube.com/feeds/videos.xml?playlist_id=PL30meFIBzqZ0WoAvls6u9Bqqd6tHJJusg";

    const makeCard = ({ url, title, desc }) => {
      // Extract video ID from YouTube URL for thumbnail
      const m = url.match(/v=([^&]+)/);
      const videoId = m ? m[1] : "";
      const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";

      const article = document.createElement("article");
      article.className = "card video-card";

      const aThumb = document.createElement("a");
      aThumb.className = "video-thumb";
      aThumb.href = url;
      aThumb.target = "_blank";
      aThumb.rel = "noopener";
      aThumb.setAttribute("aria-label", `Watch ${title}`);

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = thumb;
      img.alt = "Video thumbnail";

      aThumb.appendChild(img);

      const h3 = document.createElement("h3");
      h3.className = "video-title";
      h3.textContent = title;

      const p = document.createElement("p");
      p.className = "video-desc";
      p.textContent = desc;

      const actions = document.createElement("div");
      actions.className = "actions";

      const watch = document.createElement("a");
      watch.className = "btn";
      watch.href = url;
      watch.target = "_blank";
      watch.rel = "noopener";
      watch.setAttribute("data-magnetic", "");
      watch.textContent = "Watch";

      actions.appendChild(watch);

      article.appendChild(aThumb);
      article.appendChild(h3);
      article.appendChild(p);
      article.appendChild(actions);
      return article;
    };

    const makePlaylistEmbed = () => {
      const iframe = document.createElement("iframe");
      iframe.src = PLAYLIST_EMBED_URL;
      iframe.className = "video-frame";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      return iframe;
    };

    const parseRssVideos = (xmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, "application/xml");
      const entries = Array.from(doc.querySelectorAll("entry"));
      return entries.map((entry) => {
        const link = entry.querySelector("link[rel='alternate']");
        const url = link?.href || "";
        const title = entry.querySelector("title")?.textContent || "";
        const desc = entry.querySelector("media\\:description")?.textContent?.slice(0, 120) || "";
        return { url, title, desc: desc + (desc.length >= 120 ? "…" : "") };
      });
    };

    (async () => {
      for (const container of videoContainers) {
        const count = Math.max(2, Math.min(3, Number(container.getAttribute("data-count") || "3") || 3));
        try {
          const r = await fetch(PLAYLIST_RSS_URL);
          if (!r.ok) throw new Error(`Playlist RSS fetch failed: ${r.status}`);
          const xmlText = await r.text();
          const videos = parseRssVideos(xmlText);
          const latest = videos.slice(0, Math.min(count, videos.length));
          container.innerHTML = "";
          if (latest.length === 0) {
            // Fallback to embed if no videos
            container.appendChild(makePlaylistEmbed());
          } else {
            latest.forEach((v) => {
              if (v.url) container.appendChild(makeCard(v));
            });
          }
        } catch (e) {
          // Fallback to playlist embed if RSS fails
          container.innerHTML = "";
          container.appendChild(makePlaylistEmbed());
        }
      }
    })();
  }

  // Scroll reveal
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  if (revealEls.length) {
    if (prefersReducedMotion) {
      for (const el of revealEls) el.classList.add("is-visible");
    } else {
      const revealOne = (el) => {
        el.classList.add("is-visible");

        const meters = el.querySelectorAll?.("[data-level]");
        if (meters && meters.length) {
          meters.forEach((m) => {
            const level = m.getAttribute("data-level") || "0";
            const bar = m.querySelector("span");
            if (bar) bar.style.width = `${level}%`;
          });
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            revealOne(entry.target);
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
      );

      for (const el of revealEls) {
        const r = el.getBoundingClientRect();
        const inView = r.top <= window.innerHeight * 0.92 && r.bottom >= 0;
        if (inView) {
          revealOne(el);
        } else {
          io.observe(el);
        }
      }
    }
  }

  // Milestone counters (homepage)
  const counters = Array.from(document.querySelectorAll("[data-counter='true'][data-count-to]"));
  if (counters.length) {
    const animateCounter = (el) => {
      const to = Number(el.getAttribute("data-count-to") || "0");
      if (!Number.isFinite(to)) return;

      if (prefersReducedMotion) {
        el.textContent = String(to);
        return;
      }

      const from = 0;
      const duration = 700;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(from + (to - from) * eased);
        el.textContent = String(value);
        if (t < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    if (prefersReducedMotion) {
      counters.forEach(animateCounter);
    } else {
      const cio = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        },
        { threshold: 0.35 }
      );

      counters.forEach((c) => cio.observe(c));
    }
  }

  // Subtle depth (not parallax-heavy)
  const depthEls = Array.from(document.querySelectorAll("[data-depth]"));
  if (depthEls.length && finePointer && !prefersReducedMotion) {
    let raf = 0;
    let mx = 0;
    let my = 0;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const apply = () => {
      raf = 0;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (mx - cx) / cx;
      const dy = (my - cy) / cy;

      for (const el of depthEls) {
        const depth = Number(el.getAttribute("data-depth") || "0");
        const x = clamp(dx * depth * 0.5, -10, 10);
        const y = clamp(dy * depth * 0.35, -8, 8);
        el.style.setProperty("--parallax-x", `${x}px`);
        el.style.setProperty("--parallax-y", `${y}px`);
      }
    };

    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      },
      { passive: true }
    );

    window.addEventListener(
      "mouseleave",
      () => {
        for (const el of depthEls) {
          el.style.setProperty("--parallax-x", "0px");
          el.style.setProperty("--parallax-y", "0px");
        }
      },
      { passive: true }
    );
  }

  // Contact form validation
  const form = document.querySelector("[data-contact-form]");
  if (form instanceof HTMLFormElement) {
    const status = document.getElementById("formStatus");

    const setError = (input, msg) => {
      input.setAttribute("aria-invalid", "true");
      const id = input.getAttribute("aria-describedby");
      if (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
      }
    };

    const clearError = (input) => {
      input.setAttribute("aria-invalid", "false");
      const id = input.getAttribute("aria-describedby");
      if (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
      }
    };

    const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    form.addEventListener("submit", (e) => {
      const name = form.querySelector("#name");
      const email = form.querySelector("#email");
      const message = form.querySelector("#message");

      if (!(name instanceof HTMLInputElement)) return;
      if (!(email instanceof HTMLInputElement)) return;
      if (!(message instanceof HTMLTextAreaElement)) return;

      let ok = true;

      if (name.value.trim().length < 2) {
        ok = false;
        setError(name, "Your name is required.");
      } else {
        clearError(name);
      }

      if (!isEmail(email.value.trim())) {
        ok = false;
        setError(email, "Enter a valid email address.");
      } else {
        clearError(email);
      }

      if (message.value.trim().length < 12) {
        ok = false;
        setError(message, "Write a message (at least 12 characters).");
      } else {
        clearError(message);
      }

      if (!ok) {
        e.preventDefault();
        if (status) status.textContent = "Fix the highlighted fields.";
        return;
      }

      const action = (form.getAttribute("action") || "").trim();
      const hasEndpoint = action.length > 0 && action !== "#";

      if (status) {
        status.textContent = hasEndpoint
          ? "Sending..."
          : "Message validated. Connect a backend endpoint when you’re ready.";
      }

      if (!hasEndpoint) {
        e.preventDefault();
        form.reset();
      }
    });
  }

  // Modal preview (certificates / images)
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  const modalFrame = document.getElementById("modalFrame");
  const modalTitle = document.getElementById("modalTitle");
  const modalDownload = document.querySelector("[data-modal-download]");
  const modalClose = document.querySelector("[data-modal-close]");
  const modalBackdrop = document.querySelector("[data-modal-backdrop]");

  if (modal && modalImg && modalTitle) {
    let lastFocus = null;

    const isPdf = (src) => /\.pdf(\?|#|$)/i.test(src || "");

    const openModal = ({ src, title, alt }) => {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const showPdf = isPdf(src);

      if (modalDownload instanceof HTMLAnchorElement) {
        modalDownload.href = src || "#";
        modalDownload.setAttribute("aria-disabled", src ? "false" : "true");
      }

      if (showPdf && modalFrame instanceof HTMLIFrameElement) {
        modalImg.hidden = true;
        modalImg.setAttribute("src", "");
        modalFrame.hidden = false;
        modalFrame.setAttribute("src", src);
      } else {
        if (modalFrame instanceof HTMLIFrameElement) {
          modalFrame.hidden = true;
          modalFrame.setAttribute("src", "");
        }
        modalImg.hidden = false;
        modalImg.setAttribute("src", src);
        modalImg.setAttribute("alt", alt || title || "Preview");
      }

      modalTitle.textContent = title || "Preview";
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      (modalClose instanceof HTMLElement ? modalClose : modal).focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      modalImg.setAttribute("src", "");
      if (modalFrame instanceof HTMLIFrameElement) {
        modalFrame.setAttribute("src", "");
        modalFrame.hidden = true;
      }
      modalImg.hidden = false;
      if (modalDownload instanceof HTMLAnchorElement) modalDownload.href = "#";
      if (lastFocus) lastFocus.focus();
      lastFocus = null;
    };

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      const trigger = t.closest("[data-modal-open]");
      if (trigger) {
        const src = trigger.getAttribute("data-modal-src");
        const title = trigger.getAttribute("data-modal-alt") || trigger.textContent || "Preview";
        const alt = trigger.getAttribute("data-modal-alt") || "Preview";
        if (src) openModal({ src, title, alt });
      }
    });

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key !== "Tab") return;
      const focusables = modal.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const list = Array.from(focusables).filter((el) => el instanceof HTMLElement);
      if (!list.length) return;

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
})();
