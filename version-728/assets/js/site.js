(function() {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector(".menu-button");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function() {
      var opened = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function initHero() {
    var hero = document.querySelector(".hero-stage");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector(".hero-prev");
    var next = hero.querySelector(".hero-next");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        var active = i === index;
        slide.classList.toggle("active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function() {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function() {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        show(Number(dot.getAttribute("data-slide")) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function createText(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    node.textContent = text || "";
    return node;
  }

  function renderSearchResults() {
    var results = document.getElementById("searchResults");
    var title = document.getElementById("searchTitle");
    var input = document.getElementById("searchInput");
    if (!results || !window.MOVIE_SEARCH_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var keyword = (params.get("q") || "").trim();
    if (input) {
      input.value = keyword;
    }
    if (!keyword) {
      return;
    }
    var lower = keyword.toLowerCase();
    var matches = window.MOVIE_SEARCH_INDEX.filter(function(item) {
      var text = [item.title, item.year, item.region, item.type, item.genre, item.tags, item.oneLine].join(" ").toLowerCase();
      return text.indexOf(lower) !== -1;
    });
    results.innerHTML = "";
    if (title) {
      title.innerHTML = "";
      var wrap = document.createElement("div");
      wrap.appendChild(createText("span", "section-kicker", "搜索结果"));
      wrap.appendChild(createText("h2", "", keyword));
      wrap.appendChild(createText("p", "", matches.length ? "为你找到相关影片" : "暂未找到匹配影片"));
      title.appendChild(wrap);
    }
    matches.slice(0, 120).forEach(function(item) {
      var link = document.createElement("a");
      link.className = "movie-card";
      link.href = item.url;

      var poster = document.createElement("span");
      poster.className = "poster-wrap";
      var img = document.createElement("img");
      img.src = item.cover;
      img.alt = item.title;
      img.loading = "lazy";
      var shade = document.createElement("span");
      shade.className = "poster-shade";
      var play = document.createElement("span");
      play.className = "play-dot";
      play.textContent = "▶";
      shade.appendChild(play);
      poster.appendChild(img);
      poster.appendChild(shade);

      var body = document.createElement("span");
      body.className = "movie-card-body";
      body.appendChild(createText("strong", "", item.title));
      body.appendChild(createText("span", "movie-meta", [item.year, item.region, item.type].join(" · ")));
      body.appendChild(createText("span", "movie-line", item.oneLine));
      var tagRow = document.createElement("span");
      tagRow.className = "tag-row";
      String(item.tags || "").split(",").slice(0, 3).forEach(function(tag) {
        if (tag.trim()) {
          tagRow.appendChild(createText("span", "", tag.trim()));
        }
      });
      body.appendChild(tagRow);
      link.appendChild(poster);
      link.appendChild(body);
      results.appendChild(link);
    });
  }

  window.initPlayer = function(source) {
    var video = document.getElementById("mainVideo");
    var cover = document.getElementById("playStart");
    if (!video || !source) {
      return;
    }
    var started = false;

    function hideCover() {
      if (cover) {
        cover.classList.add("hide");
      }
    }

    function playVideo() {
      hideCover();
      if (!started) {
        started = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.play().catch(function() {});
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(function() {});
          });
        } else {
          video.src = source;
          video.play().catch(function() {});
        }
      } else {
        video.play().catch(function() {});
      }
    }

    if (cover) {
      cover.addEventListener("click", playVideo);
    }
    video.addEventListener("click", function() {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener("play", hideCover);
  };

  ready(function() {
    initMenu();
    initHero();
    renderSearchResults();
  });
})();
