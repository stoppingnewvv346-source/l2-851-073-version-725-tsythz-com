(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase().trim();
  }

  function setupMobileMenu() {
    var button = $("[data-mobile-toggle]");
    var menu = $("[data-mobile-menu]");
    if (!button || !menu) return;
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      button.textContent = menu.classList.contains("is-open") ? "×" : "☰";
    });
  }

  function setupHero() {
    var slider = $("[data-hero-slider]");
    if (!slider) return;
    var slides = $all(".hero-slide", slider);
    var dots = $all("[data-hero-dot]", slider);
    var index = 0;
    if (slides.length <= 1) return;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
      });
    });

    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupCards() {
    var grids = $all("[data-card-grid]");
    grids.forEach(function (grid) {
      var panel = grid.closest("[data-filter-scope]") || document;
      var search = $("[data-card-search]", panel);
      var category = $("[data-filter-category]", panel);
      var year = $("[data-filter-year]", panel);
      var sort = $("[data-card-sort]", panel);
      var buttons = $all("[data-view-mode]", panel);
      var empty = $("[data-empty-state]", panel);
      var cards = $all("[data-card]", grid);

      function filterCards() {
        var query = normalize(search && search.value);
        var cat = category ? category.value : "";
        var selectedYear = year ? year.value : "";
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search"));
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesCategory = !cat || card.getAttribute("data-category") === cat;
          var matchesYear = !selectedYear || card.getAttribute("data-year") === selectedYear;
          var show = matchesQuery && matchesCategory && matchesYear;
          card.classList.toggle("is-hidden", !show);
          if (show) visible += 1;
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      function sortCards() {
        if (!sort) return;
        var mode = sort.value;
        var sorted = cards.slice().sort(function (a, b) {
          if (mode === "views") {
            return Number(b.getAttribute("data-views")) - Number(a.getAttribute("data-views"));
          }
          if (mode === "year") {
            return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
          }
          if (mode === "title") {
            return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent, "zh-Hans-CN");
          }
          return Number(a.getAttribute("data-views")) - Number(b.getAttribute("data-views"));
        });
        sorted.forEach(function (card) {
          grid.appendChild(card);
        });
      }

      [search, category, year].forEach(function (control) {
        if (control) control.addEventListener("input", filterCards);
        if (control) control.addEventListener("change", filterCards);
      });

      if (sort) {
        sort.addEventListener("change", function () {
          sortCards();
          filterCards();
        });
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(function (item) {
            item.classList.remove("is-active");
          });
          button.classList.add("is-active");
          grid.classList.toggle("is-list", button.getAttribute("data-view-mode") === "list");
        });
      });
    });
  }

  window.initVideoPlayer = function (videoId, sourceUrl, overlayId) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    if (!video || !sourceUrl) return;
    var attached = false;

    function attachSource() {
      if (attached) return;
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
    }

    function startPlayback() {
      attachSource();
      if (overlay) overlay.classList.add("is-hidden");
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          if (overlay) overlay.classList.remove("is-hidden");
        });
      }
    }

    video.addEventListener("play", function () {
      if (overlay) overlay.classList.add("is-hidden");
    });

    video.addEventListener("pause", function () {
      if (overlay && video.currentTime === 0) overlay.classList.remove("is-hidden");
    });

    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });

    if (overlay) {
      overlay.addEventListener("click", startPlayback);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupHero();
    setupCards();
  });
})();
