(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var navSearch = document.querySelector('.nav-search');

  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      menu.classList.toggle('open');
      if (navSearch) {
        navSearch.classList.toggle('open');
      }
    });
  }

  function setupHero() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    show(0);
    start();
  }

  function setupFilters() {
    var grid = document.querySelector('[data-filter-grid]');
    var search = document.getElementById('movieSearch');
    var region = document.getElementById('regionFilter');
    var year = document.getElementById('yearFilter');
    var empty = document.getElementById('emptyState');

    if (!grid || !search) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.js-movie-card'));
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');

    if (q) {
      search.value = q;
    }

    function apply() {
      var keyword = (search.value || '').trim().toLowerCase();
      var selectedRegion = region ? region.value : '';
      var selectedYear = year ? year.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = card.getAttribute('data-search') || '';
        var cardRegion = card.getAttribute('data-region') || '';
        var cardYear = card.getAttribute('data-year') || '';
        var matched = true;

        if (keyword && text.indexOf(keyword) === -1) {
          matched = false;
        }

        if (selectedRegion && cardRegion !== selectedRegion) {
          matched = false;
        }

        if (selectedYear && cardYear !== selectedYear) {
          matched = false;
        }

        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    search.addEventListener('input', apply);
    if (region) {
      region.addEventListener('change', apply);
    }
    if (year) {
      year.addEventListener('change', apply);
    }
    apply();
  }

  function setupVideoPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.video-player'));

    players.forEach(function (player) {
      var video = player.querySelector('video');
      var source = player.getAttribute('data-video-src');
      var toggleButtons = Array.prototype.slice.call(player.querySelectorAll('[data-player-toggle]'));
      var muteButton = player.querySelector('[data-player-mute]');
      var fullscreenButton = player.querySelector('[data-player-fullscreen]');
      var initialized = false;
      var hls = null;

      if (!video || !source) {
        return;
      }

      function ensureSource() {
        if (initialized) {
          return;
        }

        initialized = true;
        if (/\.m3u8(\?|$)/i.test(source) && window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function (_event, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          });
        } else {
          video.src = source;
        }
      }

      function updateState() {
        player.classList.toggle('is-playing', !video.paused);
        toggleButtons.forEach(function (button) {
          button.textContent = video.paused ? '播放' : '暂停';
        });
        var mainButton = player.querySelector('.player-main-button');
        if (mainButton) {
          mainButton.textContent = video.paused ? '▶' : 'Ⅱ';
        }
      }

      function togglePlayback(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        ensureSource();
        if (video.paused) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              player.classList.remove('is-playing');
            });
          }
        } else {
          video.pause();
        }
      }

      toggleButtons.forEach(function (button) {
        button.addEventListener('click', togglePlayback);
      });

      video.addEventListener('click', togglePlayback);
      video.addEventListener('play', updateState);
      video.addEventListener('pause', updateState);
      video.addEventListener('ended', updateState);

      if (muteButton) {
        muteButton.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? '取消静音' : '静音';
        });
      }

      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }

      updateState();
    });

    var scrollButtons = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-player]'));
    scrollButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var player = document.querySelector('.video-player');
        if (player) {
          player.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var playButton = player.querySelector('[data-player-toggle]');
          if (playButton) {
            playButton.click();
          }
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupHero();
    setupFilters();
    setupVideoPlayers();
  });
})();
