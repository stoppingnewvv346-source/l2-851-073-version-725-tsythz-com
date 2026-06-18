document.addEventListener("DOMContentLoaded", function () {
  var navToggle = document.querySelector("[data-nav-toggle]");
  var siteNav = document.querySelector("[data-site-nav]");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      siteNav.classList.toggle("is-open");
    });
  }

  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var previous = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    if (previous) {
      previous.addEventListener("click", function () {
        showSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        showSlide(dotIndex);
        restart();
      });
    });

    showSlide(0);
    restart();
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-filter-root]")).forEach(function (root) {
    var keyword = root.querySelector("[data-filter-keyword]");
    var year = root.querySelector("[data-filter-year]");
    var type = root.querySelector("[data-filter-type]");
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-search-card]"));

    function applyFilter() {
      var q = keyword ? keyword.value.trim().toLowerCase() : "";
      var y = year ? year.value : "";
      var t = type ? type.value : "";

      cards.forEach(function (card) {
        var text = [
          card.dataset.title || "",
          card.dataset.region || "",
          card.dataset.type || "",
          card.dataset.year || "",
          card.dataset.genre || "",
          card.textContent || ""
        ].join(" ").toLowerCase();
        var matchKeyword = !q || text.indexOf(q) !== -1;
        var matchYear = !y || card.dataset.year === y;
        var matchType = !t || card.dataset.type === t;
        card.hidden = !(matchKeyword && matchYear && matchType);
      });
    }

    if (keyword) {
      var params = new URLSearchParams(window.location.search);
      var initial = params.get("q");
      if (initial) {
        keyword.value = initial;
      }
      keyword.addEventListener("input", applyFilter);
    }
    if (year) {
      year.addEventListener("change", applyFilter);
    }
    if (type) {
      type.addEventListener("change", applyFilter);
    }
    applyFilter();
  });
});
