(function () {
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }

  var slider = document.querySelector("[data-hero-slider]");
  if (slider) {
    var slides = Array.prototype.slice.call(
      slider.querySelectorAll(".hero-slide"),
    );
    var dots = Array.prototype.slice.call(
      slider.querySelectorAll("[data-hero-dot]"),
    );
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function setSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === current);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === current);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        setSlide(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        setSlide(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        setSlide(current + 1);
        start();
      });
    }

    start();
  }

  var pageSearch = document.querySelector("[data-page-search]");
  var params = new URLSearchParams(window.location.search);
  var query = params.get("q") || "";
  if (pageSearch && query) {
    pageSearch.value = query;
  }

  var grid = document.querySelector("[data-filterable-grid]");
  if (grid) {
    var filterInput = document.querySelector("[data-filter-input]");
    var sortSelect = document.querySelector("[data-sort-select]");
    var chips = Array.prototype.slice.call(
      document.querySelectorAll("[data-filter-chip]"),
    );
    var cards = Array.prototype.slice.call(
      grid.querySelectorAll(".movie-card"),
    );
    var activeChip = "";

    if (filterInput && query) {
      filterInput.value = query;
    }

    function cardText(card) {
      return [
        card.getAttribute("data-title") || "",
        card.getAttribute("data-genre") || "",
        card.getAttribute("data-tags") || "",
        card.getAttribute("data-year") || "",
        card.getAttribute("data-region") || "",
      ]
        .join(" ")
        .toLowerCase();
    }

    function applyFilters() {
      var term = filterInput ? filterInput.value.trim().toLowerCase() : "";
      cards.forEach(function (card) {
        var text = cardText(card);
        var passTerm = !term || text.indexOf(term) !== -1;
        var passChip =
          !activeChip || text.indexOf(activeChip.toLowerCase()) !== -1;
        card.classList.toggle("is-filter-hidden", !(passTerm && passChip));
      });
    }

    function applySort() {
      var mode = sortSelect ? sortSelect.value : "default";
      var sorted = cards.slice();
      if (mode === "views") {
        sorted.sort(function (a, b) {
          return (
            Number(b.getAttribute("data-views") || 0) -
            Number(a.getAttribute("data-views") || 0)
          );
        });
      } else if (mode === "year") {
        sorted.sort(function (a, b) {
          return (
            Number(b.getAttribute("data-year") || 0) -
            Number(a.getAttribute("data-year") || 0)
          );
        });
      } else if (mode === "title") {
        sorted.sort(function (a, b) {
          return (a.getAttribute("data-title") || "").localeCompare(
            b.getAttribute("data-title") || "",
            "zh-Hans-CN",
          );
        });
      }
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
      cards = sorted;
      applyFilters();
    }

    if (filterInput) {
      filterInput.addEventListener("input", applyFilters);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", applySort);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.getAttribute("data-filter-chip") || "";
        activeChip = activeChip === value ? "" : value;
        chips.forEach(function (item) {
          item.classList.toggle(
            "is-active",
            item === chip && activeChip === value,
          );
        });
        applyFilters();
      });
    });

    applyFilters();
  }

  function bootPlayer(player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".player-overlay");
    var streamUrl = player.getAttribute("data-m3u8");
    var loaded = false;

    function loadVideo() {
      if (!video || !streamUrl) {
        return;
      }
      if (!loaded) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
        loaded = true;
      }
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          video.controls = true;
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", loadVideo);
    }

    if (video) {
      video.addEventListener("click", function () {
        if (!loaded) {
          loadVideo();
        }
      });
      video.addEventListener("play", function () {
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
      });
    }
  }

  Array.prototype.slice
    .call(document.querySelectorAll(".movie-player"))
    .forEach(bootPlayer);
})();
