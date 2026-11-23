(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Thème clair / sombre ---------- */
  var root = document.documentElement;
  var themeBtn = $("#themeToggle");
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  setTheme(saved || (prefersDark ? "dark" : "light"));
  themeBtn.addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- Menu mobile ---------- */
  var burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    burger.textContent = open ? "✕" : "☰";
  });
  $$("a", nav).forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      burger.textContent = "☰";
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Scroll : barre de progression, header, lien actif ---------- */
  var progress = $("#progress"), header = $("#header");
  var sections = $$("main section[id]");
  var links = $$("a", nav);
  function onScroll() {
    var h = document.documentElement;
    var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progress.style.width = pct + "%";
    header.classList.toggle("scrolled", h.scrollTop > 20);
    var current = "";
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= 120) current = s.id;
    });
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current && !a.classList.contains("nav-cta"));
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Apparition au scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Effet machine à écrire ---------- */
  var phrases = [
    "Technicien supérieur en Génie Électrique & Informatique",
    "Spécialiste IoT & Systèmes embarqués",
    "Concepteur de PCB & Data Scientist",
    "Co-fondateur & COO de BlodoCar"
  ];
  var typed = $("#typed"), p = 0, c = 0, deleting = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function type() {
    var text = phrases[p];
    if (reduce) { typed.textContent = text; return; }
    typed.textContent = text.slice(0, deleting ? --c : ++c);
    var delay = deleting ? 25 : 55;
    if (!deleting && c === text.length) { delay = 1800; deleting = true; }
    else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 400; }
    setTimeout(type, delay);
  }
  type();

  /* ---------- Compteurs animés ---------- */
  var counters = $$("[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals || "0", 10);
    var pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      var val = (target * eased).toFixed(dec).replace(".", ",");
      el.textContent = pre + val + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Onglets Parcours ---------- */
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tab").forEach(function (t) { t.classList.remove("active"); });
      $$(".tabpanel").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var panel = $("#tab-" + tab.dataset.tab);
      panel.classList.add("active");
      $$(".reveal", panel).forEach(function (el) { el.classList.add("visible"); });
    });
  });

  /* ---------- Filtre des certifications ---------- */
  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".filter").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.dataset.filter;
      $$(".cert").forEach(function (card) {
        card.classList.toggle("hide", f !== "all" && card.dataset.cat !== f);
      });
    });
  });

  /* ---------- Formulaire de contact (envoi via Mailjet, fonction /api/send) ---------- */
  var form = $("#contactForm"), msg = $("#formMsg");
  var sending = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    var name = $("#name").value.trim();
    var email = $("#email").value.trim();
    var text = $("#message").value.trim();
    var trap = $("#website").value;
    var btn = $("button[type=submit]", form);
    msg.className = "form-msg";
    if (!name || !text || !/^\S+@\S+\.\S+$/.test(email)) {
      msg.textContent = "Merci de renseigner un nom, un email valide et un message.";
      msg.classList.add("error");
      return;
    }
    sending = true;
    btn.disabled = true;
    btn.textContent = "Envoi en cours…";
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, message: text, website: trap })
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      msg.textContent = "Merci " + name + " ! Votre message a bien été envoyé.";
      msg.classList.add("ok");
      form.reset();
    }).catch(function () {
      msg.textContent = "Échec de l'envoi. Écrivez-moi directement à justekocou21@gmail.com.";
      msg.classList.add("error");
    }).finally(function () {
      sending = false;
      btn.disabled = false;
      btn.textContent = "Envoyer le message";
    });
  });

  /* ---------- Année du pied de page ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
