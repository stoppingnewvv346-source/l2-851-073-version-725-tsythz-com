(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (navButton && mobilePanel) {
    navButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dots button'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        startTimer();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        startTimer();
      });
    }

    hero.addEventListener('mouseenter', stopTimer);
    hero.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
  }

  var filterInput = document.querySelector('[data-filter-input]');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-value]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card[data-search]'));
  var emptyState = document.querySelector('[data-empty-state]');
  var activeFilter = 'all';

  function cardMatchesFilter(card) {
    if (activeFilter === 'all') {
      return true;
    }

    return card.getAttribute('data-type') === activeFilter || card.getAttribute('data-year') === activeFilter;
  }

  function applyFilters() {
    if (!cards.length) {
      return;
    }

    var query = filterInput ? filterInput.value.trim().toLowerCase() : '';
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = (card.getAttribute('data-search') || '').toLowerCase();
      var matched = (!query || haystack.indexOf(query) !== -1) && cardMatchesFilter(card);
      card.classList.toggle('card-hidden', !matched);

      if (matched) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('show', visible === 0);
    }
  }

  if (filterInput) {
    var params = new URLSearchParams(location.search);
    var q = params.get('q');

    if (q) {
      filterInput.value = q;
    }

    filterInput.addEventListener('input', applyFilters);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter-value') || 'all';

      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });

      applyFilters();
    });
  });

  applyFilters();
})();

function initMoviePlayer(config) {
  var video = document.getElementById(config.videoId);
  var button = document.getElementById(config.buttonId);
  var loaded = false;
  var hlsPlayer = null;

  if (!video || !button) {
    return;
  }

  function attachStream() {
    if (loaded) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = config.src;
      loaded = true;
      return;
    }

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hlsPlayer = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsPlayer.loadSource(config.src);
      hlsPlayer.attachMedia(video);
      loaded = true;
      return;
    }

    video.src = config.src;
    loaded = true;
  }

  function showButton() {
    if (!video.ended) {
      button.classList.remove('is-hidden');
    }
  }

  function hideButton() {
    button.classList.add('is-hidden');
  }

  function startPlayback(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    attachStream();
    hideButton();

    var promise = video.play();

    if (promise && promise.catch) {
      promise.catch(function () {
        showButton();
      });
    }
  }

  button.addEventListener('click', startPlayback);

  video.addEventListener('click', function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener('play', hideButton);
  video.addEventListener('pause', showButton);
  video.addEventListener('ended', showButton);

  window.addEventListener('beforeunload', function () {
    if (hlsPlayer) {
      hlsPlayer.destroy();
    }
  });
}
