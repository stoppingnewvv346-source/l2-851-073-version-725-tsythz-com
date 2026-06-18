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

    function initHero() {
        var hero = qs('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var prev = qs('[data-hero-prev]', hero);
        var next = qs('[data-hero-next]', hero);
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === current);
            });
        }

        function move(step) {
            show(current + step);
        }

        function restart() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                move(1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                move(-1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                move(1);
                restart();
            });
        }

        show(0);
        restart();
    }

    function applyFilters(scope) {
        var input = qs('[data-filter-input]');
        var typeSelect = qs('[data-filter-type]');
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var type = typeSelect ? typeSelect.value.trim() : '';
        var cards = qsa('[data-movie-card]', scope || document);

        cards.forEach(function (card) {
            var text = (card.getAttribute('data-search') || '').toLowerCase();
            var cardType = card.getAttribute('data-type') || '';
            var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
            var matchedType = !type || cardType.indexOf(type) !== -1;
            card.classList.toggle('is-hidden', !(matchedKeyword && matchedType));
        });
    }

    function initFilters() {
        var scope = qs('[data-filter-scope]') || document;
        var input = qs('[data-filter-input]');
        var queryInput = qs('[data-query-input]');
        var typeSelect = qs('[data-filter-type]');

        if (queryInput) {
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query) {
                queryInput.value = query;
            }
        }

        if (input) {
            input.addEventListener('input', function () {
                applyFilters(scope);
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', function () {
                applyFilters(scope);
            });
        }

        if (input || typeSelect) {
            applyFilters(scope);
        }
    }

    window.initMoviePlayer = function (streamUrl) {
        var video = qs('#movie-player');
        var cover = qs('[data-player-cover]');
        var ready = false;

        if (!video || !streamUrl) {
            return;
        }

        function attach() {
            if (ready) {
                return;
            }
            ready = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add('hidden');
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener('click', play);
        }

        video.addEventListener('play', function () {
            if (cover) {
                cover.classList.add('hidden');
            }
        });

        video.addEventListener('click', function () {
            if (!ready) {
                play();
            }
        });
    };

    initHero();
    initFilters();
})();
