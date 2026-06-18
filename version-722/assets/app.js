(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var button = document.querySelector("[data-menu-button]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initHeaderSearch() {
        document.querySelectorAll("[data-header-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var value = input ? input.value.trim() : "";
                var target = "./search.html";
                if (value) {
                    target += "?q=" + encodeURIComponent(value);
                }
                window.location.href = target;
            });
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero-carousel]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }
        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }
        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
            var input = scope.querySelector("[data-filter-input]");
            var buttons = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-button]"));
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-card]"));
            var empty = scope.querySelector("[data-no-results]");
            function activeFilters() {
                var result = {};
                buttons.forEach(function (button) {
                    if (!button.classList.contains("is-active")) {
                        return;
                    }
                    var field = button.getAttribute("data-field");
                    var value = button.getAttribute("data-value") || "all";
                    if (field && value !== "all") {
                        result[field] = value.toLowerCase();
                    }
                });
                return result;
            }
            function apply() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var filters = activeFilters();
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = [
                        card.dataset.title || "",
                        card.dataset.region || "",
                        card.dataset.type || "",
                        card.dataset.year || "",
                        card.dataset.genre || ""
                    ].join(" ").toLowerCase();
                    var matchQuery = !query || haystack.indexOf(query) !== -1;
                    var matchFilters = Object.keys(filters).every(function (field) {
                        return String(card.dataset[field] || "").toLowerCase().indexOf(filters[field]) !== -1;
                    });
                    var show = matchQuery && matchFilters;
                    card.style.display = show ? "" : "none";
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }
            if (input) {
                input.addEventListener("input", apply);
            }
            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    var field = button.getAttribute("data-field");
                    buttons.forEach(function (item) {
                        if (item.getAttribute("data-field") === field) {
                            item.classList.remove("is-active");
                        }
                    });
                    button.classList.add("is-active");
                    apply();
                });
            });
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");
            if (q && input) {
                input.value = q;
            }
            apply();
        });
    }

    window.startMoviePlayer = function (streamUrl) {
        ready(function () {
            var video = document.querySelector("[data-player-video]");
            var cover = document.querySelector("[data-player-cover]");
            var button = document.querySelector("[data-player-button]");
            if (!video || !streamUrl) {
                return;
            }
            var attached = false;
            var hls = null;
            function tryPlay() {
                var playResult = video.play();
                if (playResult && typeof playResult.catch === "function") {
                    playResult.catch(function () {});
                }
            }
            function attachStream() {
                if (attached) {
                    return;
                }
                attached = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = streamUrl;
                    video.load();
                    video.addEventListener("loadedmetadata", tryPlay, { once: true });
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, tryPlay);
                    hls.on(window.Hls.Events.ERROR, function (_, data) {
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
                    video.src = streamUrl;
                    video.load();
                }
            }
            function begin() {
                attachStream();
                if (cover) {
                    cover.classList.add("is-hidden");
                }
                window.setTimeout(tryPlay, 180);
            }
            if (cover) {
                cover.addEventListener("click", begin);
            }
            if (button) {
                button.addEventListener("click", function (event) {
                    event.stopPropagation();
                    begin();
                });
            }
            video.addEventListener("click", function () {
                if (video.paused) {
                    begin();
                }
            });
            window.addEventListener("pagehide", function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    };

    ready(function () {
        initMenu();
        initHeaderSearch();
        initHero();
        initFilters();
    });
})();
