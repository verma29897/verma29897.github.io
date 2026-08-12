/* ============================================================
   Resume viewer — zoom, in-page search, section navigation.
   Standalone: script.js is not loaded on this page (it binds to
   #contact-form and other portfolio-only nodes).
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var paper = document.getElementById("resume-doc");
  var sections = Array.prototype.slice.call(
    document.querySelectorAll(".rz-section[data-label]")
  );

  /* ---------------------------- zoom ---------------------------- */

  var STEPS = [0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8];
  var DEFAULT_STEP = STEPS.indexOf(1);
  var STORE_KEY = "kkv-resume-zoom";

  var zoomLevelBtn = document.getElementById("zoomLevel");
  var zoomInBtn = document.getElementById("zoomIn");
  var zoomOutBtn = document.getElementById("zoomOut");
  var step = DEFAULT_STEP;

  function readStoredZoom() {
    try {
      var saved = STEPS.indexOf(parseFloat(localStorage.getItem(STORE_KEY)));
      return saved === -1 ? DEFAULT_STEP : saved;
    } catch (e) {
      return DEFAULT_STEP;
    }
  }

  function applyZoom(persist) {
    var value = STEPS[step];
    doc.style.setProperty("--rz-zoom", value);
    zoomLevelBtn.textContent = Math.round(value * 100) + "%";
    zoomOutBtn.disabled = step === 0;
    zoomInBtn.disabled = step === STEPS.length - 1;
    if (persist) {
      try {
        localStorage.setItem(STORE_KEY, String(value));
      } catch (e) {
        /* storage blocked — zoom still applies for this visit */
      }
    }
  }

  function setZoom(next) {
    step = Math.max(0, Math.min(STEPS.length - 1, next));
    applyZoom(true);
  }

  zoomInBtn.addEventListener("click", function () {
    setZoom(step + 1);
  });
  zoomOutBtn.addEventListener("click", function () {
    setZoom(step - 1);
  });
  zoomLevelBtn.addEventListener("click", function () {
    setZoom(DEFAULT_STEP);
  });

  step = readStoredZoom();
  applyZoom(false);

  /* ------------------------ section navigation ------------------------ */

  var railList = document.getElementById("railList");
  var select = document.getElementById("sectionSelect");
  var railLinks = [];
  var current = -1; // -1 so the first setCurrent(0) is not swallowed by its no-op guard

  sections.forEach(function (section, i) {
    var label = section.getAttribute("data-label");

    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + section.id;
    a.textContent = i + 1 + ". " + label;
    li.appendChild(a);
    railList.appendChild(li);
    railLinks.push(a);

    var option = document.createElement("option");
    option.value = section.id;
    option.textContent = label;
    select.appendChild(option);
  });

  function scrollToSection(index) {
    var section = sections[index];
    if (!section) return;
    var top =
      section.getBoundingClientRect().top +
      window.pageYOffset -
      toolbarHeight() -
      16;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  railLinks.forEach(function (link, i) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToSection(i);
    });
  });

  select.addEventListener("change", function () {
    var index = sections.findIndex(function (s) {
      return s.id === select.value;
    });
    if (index > -1) scrollToSection(index);
  });

  var prevBtn = document.getElementById("prevSection");
  var nextBtn = document.getElementById("nextSection");

  prevBtn.addEventListener("click", function () {
    scrollToSection(current - 1);
  });
  nextBtn.addEventListener("click", function () {
    scrollToSection(current + 1);
  });

  function setCurrent(index) {
    if (index === current) return;
    current = index;
    railLinks.forEach(function (link, i) {
      link.classList.toggle("active", i === index);
    });
    select.value = sections[index].id;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === sections.length - 1;
  }

  /* ------------------- toolbar height + scroll state ------------------- */

  var toolbar = document.getElementById("toolbar");
  var progressBar = document.getElementById("progressBar");

  function toolbarHeight() {
    return toolbar.offsetHeight;
  }

  function syncToolbarHeight() {
    doc.style.setProperty("--rz-bar-h", toolbarHeight() + "px");
  }

  function onScroll() {
    var offset = toolbarHeight() + 40;
    var active = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= offset) active = i;
    }
    // at the very bottom the last section wins, however short it is
    if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 4) {
      active = sections.length - 1;
    }
    setCurrent(active);

    var scrollable = doc.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? (window.pageYOffset / scrollable) * 100 : 100;
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  var ticking = false;
  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", function () {
    syncToolbarHeight();
    requestScrollUpdate();
  });

  syncToolbarHeight();
  setCurrent(0);
  onScroll();

  /* ---------------------------- search ---------------------------- */

  var searchInput = document.getElementById("searchInput");
  var searchCount = document.getElementById("searchCount");
  var searchPrev = document.getElementById("searchPrev");
  var searchNext = document.getElementById("searchNext");
  var hits = [];
  var hitIndex = -1;

  function clearHighlights() {
    var marks = paper.querySelectorAll("mark[data-rz-hit]");
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    }
    hits = [];
    hitIndex = -1;
  }

  function collectTextNodes() {
    var walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        var tag = node.parentNode && node.parentNode.nodeName;
        if (tag === "SCRIPT" || tag === "STYLE") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function highlight(term) {
    var needle = term.toLowerCase();
    collectTextNodes().forEach(function (node) {
      var text = node.nodeValue;
      var lower = text.toLowerCase();
      var index = lower.indexOf(needle);
      if (index === -1) return;

      var fragment = document.createDocumentFragment();
      var from = 0;
      while (index !== -1) {
        if (index > from) {
          fragment.appendChild(
            document.createTextNode(text.slice(from, index))
          );
        }
        var mark = document.createElement("mark");
        mark.setAttribute("data-rz-hit", "");
        mark.textContent = text.slice(index, index + needle.length);
        fragment.appendChild(mark);
        from = index + needle.length;
        index = lower.indexOf(needle, from);
      }
      if (from < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(from)));
      }
      node.parentNode.replaceChild(fragment, node);
    });

    hits = Array.prototype.slice.call(paper.querySelectorAll("mark[data-rz-hit]"));
  }

  function focusHit(index) {
    if (!hits.length) return;
    if (hitIndex > -1 && hits[hitIndex]) {
      hits[hitIndex].classList.remove("rz-hit-active");
    }
    hitIndex = (index + hits.length) % hits.length;
    var hit = hits[hitIndex];
    hit.classList.add("rz-hit-active");

    var top =
      hit.getBoundingClientRect().top +
      window.pageYOffset -
      toolbarHeight() -
      window.innerHeight / 3;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    updateCount();
  }

  function updateCount() {
    if (!searchInput.value.trim()) {
      searchCount.textContent = "";
    } else if (!hits.length) {
      searchCount.textContent = "0 results";
    } else {
      searchCount.textContent = hitIndex + 1 + " / " + hits.length;
    }
    var idle = hits.length === 0;
    searchPrev.disabled = idle;
    searchNext.disabled = idle;
  }

  function runSearch() {
    var term = searchInput.value.trim();
    clearHighlights();
    if (term.length < 2) {
      updateCount();
      if (term.length === 1) searchCount.textContent = "2+ chars";
      return;
    }
    highlight(term);
    if (hits.length) focusHit(0);
    else updateCount();
  }

  var debounce;
  searchInput.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(runSearch, 200);
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounce);
      if (!hits.length) runSearch();
      else focusHit(hitIndex + (e.shiftKey ? -1 : 1));
    } else if (e.key === "Escape") {
      searchInput.value = "";
      clearHighlights();
      updateCount();
      searchInput.blur();
    }
  });

  searchNext.addEventListener("click", function () {
    focusHit(hitIndex + 1);
  });
  searchPrev.addEventListener("click", function () {
    focusHit(hitIndex - 1);
  });

  updateCount();

  /* ---------------------------- actions ---------------------------- */

  document.getElementById("printBtn").addEventListener("click", function () {
    clearHighlights();
    updateCount();
    window.print();
  });

  // Returning by history keeps the visitor's scroll position in the portfolio;
  // the href is the fallback for direct hits on /resume.
  document.getElementById("backBtn").addEventListener("click", function (e) {
    var referrer = document.referrer;
    if (
      referrer &&
      referrer.indexOf(window.location.origin) === 0 &&
      referrer.indexOf("/resume") === -1 &&
      window.history.length > 1
    ) {
      e.preventDefault();
      window.history.back();
    }
  });

  /* -------------------------- keyboard shortcuts -------------------------- */

  document.addEventListener("keydown", function (e) {
    var typing =
      e.target &&
      (e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT");

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+F is left to the browser: the resume is real text, so native find works.
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom(step + 1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom(step - 1);
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(DEFAULT_STEP);
      }
      return;
    }

    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      scrollToSection(current + 1);
      return;
    }
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      scrollToSection(current - 1);
      return;
    }

    if (typing) return;

    if (e.key === "/") {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === "Escape") {
      searchInput.value = "";
      clearHighlights();
      updateCount();
    }
  });

  // Web fonts land after first paint: the toolbar can re-wrap and every section
  // shifts down, so re-measure once the late layout settles.
  function remeasure() {
    syncToolbarHeight();
    onScroll();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasure);
  }
  window.addEventListener("load", remeasure);
})();
