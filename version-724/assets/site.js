(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = qs('[data-menu-button]');
  var mobileNav = qs('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var heroSlides = qsa('[data-hero-slide]');
  var heroDots = qsa('[data-hero-dot]');
  var heroIndex = 0;

  function showHero(index) {
    if (!heroSlides.length) {
      return;
    }
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === heroIndex);
    });
    heroDots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === heroIndex);
    });
  }

  heroDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showHero(Number(dot.getAttribute('data-hero-dot') || 0));
    });
  });

  if (heroSlides.length > 1) {
    setInterval(function () {
      showHero(heroIndex + 1);
    }, 5200);
  }

  var searchData = window.movieSearchIndex || [];

  function renderSearchResults(input, resultsBox) {
    var query = input.value.trim().toLowerCase();
    if (!query) {
      resultsBox.classList.remove('open');
      resultsBox.innerHTML = '';
      return;
    }

    var items = searchData.filter(function (item) {
      var pool = [item.title, item.region, item.type, item.year, item.genre, item.tags].join(' ').toLowerCase();
      return pool.indexOf(query) !== -1;
    }).slice(0, 8);

    if (!items.length) {
      resultsBox.innerHTML = '<div class="search-result-item"><div></div><div><strong>没有找到匹配影片</strong><span>换一个关键词试试</span></div></div>';
      resultsBox.classList.add('open');
      return;
    }

    resultsBox.innerHTML = items.map(function (item) {
      return '<a class="search-result-item" href="' + item.url + '">' +
        '<img src="' + item.cover + '" alt="' + item.title.replace(/"/g, '&quot;') + '">' +
        '<div><strong>' + item.title + '</strong><span>' + item.year + ' · ' + item.region + ' · ' + item.type + '</span></div>' +
        '</a>';
    }).join('');
    resultsBox.classList.add('open');
  }

  qsa('[data-search-box]').forEach(function (box) {
    var input = qs('[data-search-input]', box);
    var resultsBox = qs('[data-search-results]', box);
    if (!input || !resultsBox) {
      return;
    }
    input.addEventListener('input', function () {
      renderSearchResults(input, resultsBox);
    });
    input.addEventListener('focus', function () {
      if (input.value.trim()) {
        renderSearchResults(input, resultsBox);
      }
    });
  });

  document.addEventListener('click', function (event) {
    qsa('[data-search-box]').forEach(function (box) {
      if (!box.contains(event.target)) {
        var results = qs('[data-search-results]', box);
        if (results) {
          results.classList.remove('open');
        }
      }
    });
  });

  qsa('[data-filter-form]').forEach(function (form) {
    var grid = qs('[data-filter-grid]');
    var region = qs('[data-filter-region]', form);
    var type = qs('[data-filter-type]', form);
    var year = qs('[data-filter-year]', form);
    var keyword = qs('[data-filter-keyword]', form);
    var cards = qsa('[data-movie-card]', grid || document);

    function applyFilter() {
      var regionValue = region ? region.value : '';
      var typeValue = type ? type.value : '';
      var yearValue = year ? year.value : '';
      var keywordValue = keyword ? keyword.value.trim().toLowerCase() : '';

      cards.forEach(function (card) {
        var ok = true;
        if (regionValue && card.getAttribute('data-region') !== regionValue) {
          ok = false;
        }
        if (typeValue && card.getAttribute('data-type') !== typeValue) {
          ok = false;
        }
        if (yearValue && card.getAttribute('data-year') !== yearValue) {
          ok = false;
        }
        if (keywordValue) {
          var text = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-tags') || '',
            card.textContent || ''
          ].join(' ').toLowerCase();
          if (text.indexOf(keywordValue) === -1) {
            ok = false;
          }
        }
        card.classList.toggle('is-filter-hidden', !ok);
      });
    }

    [region, type, year, keyword].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
  });
})();

function initMoviePlayer(streamUrl) {
  var video = document.querySelector('[data-player-video]');
  var overlay = document.querySelector('[data-player-overlay]');
  var hlsInstance = null;
  var loaded = false;

  if (!video || !streamUrl) {
    return;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  }

  function showOverlay() {
    if (overlay && video.paused) {
      overlay.classList.remove('is-hidden');
    }
  }

  function attemptPlay() {
    hideOverlay();
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        showOverlay();
      });
    }
  }

  function loadStream() {
    if (loaded) {
      attemptPlay();
      return;
    }

    loaded = true;
    video.controls = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', attemptPlay, { once: true });
      video.load();
      attemptPlay();
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
        attemptPlay();
      });
      hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
        if (data && data.fatal && hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
          video.src = streamUrl;
          video.load();
          attemptPlay();
        }
      });
      return;
    }

    video.src = streamUrl;
    video.load();
    attemptPlay();
  }

  if (overlay) {
    overlay.addEventListener('click', loadStream);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      loadStream();
    }
  });

  video.addEventListener('play', hideOverlay);
  video.addEventListener('pause', showOverlay);
}
