(function() {
    var navButton = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");

    if (navButton && nav) {
        navButton.addEventListener("click", function() {
            nav.classList.toggle("is-open");
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var heroIndex = 0;

    function setHero(index) {
        if (!slides.length) {
            return;
        }

        heroIndex = (index + slides.length) % slides.length;

        slides.forEach(function(slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === heroIndex);
        });

        dots.forEach(function(dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === heroIndex);
        });
    }

    if (slides.length > 1) {
        dots.forEach(function(dot, dotIndex) {
            dot.addEventListener("click", function() {
                setHero(dotIndex);
            });
        });

        setInterval(function() {
            setHero(heroIndex + 1);
        }, 5200);
    }

    var filterInput = document.querySelector("[data-filter-input]");
    var filterRegion = document.querySelector("[data-filter-region]");
    var filterYear = document.querySelector("[data-filter-year]");
    var filterReset = document.querySelector("[data-filter-reset]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var emptyState = document.querySelector("[data-empty-state]");

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function applyFilters() {
        if (!cards.length) {
            return;
        }

        var query = normalize(filterInput ? filterInput.value : "");
        var region = filterRegion ? filterRegion.value : "";
        var year = filterYear ? filterYear.value : "";
        var visible = 0;

        cards.forEach(function(card) {
            var text = normalize([
                card.dataset.title,
                card.dataset.tags,
                card.dataset.region,
                card.dataset.year
            ].join(" "));
            var matchQuery = !query || text.indexOf(query) !== -1;
            var matchRegion = !region || card.dataset.region === region;
            var matchYear = !year || card.dataset.year === year;
            var show = matchQuery && matchRegion && matchYear;

            card.classList.toggle("hidden-card", !show);

            if (show) {
                visible += 1;
            }
        });

        if (emptyState) {
            emptyState.classList.toggle("is-visible", visible === 0);
        }
    }

    [filterInput, filterRegion, filterYear].forEach(function(el) {
        if (el) {
            el.addEventListener("input", applyFilters);
            el.addEventListener("change", applyFilters);
        }
    });

    if (filterReset) {
        filterReset.addEventListener("click", function() {
            if (filterInput) {
                filterInput.value = "";
            }

            if (filterRegion) {
                filterRegion.value = "";
            }

            if (filterYear) {
                filterYear.value = "";
            }

            applyFilters();
        });
    }

    applyFilters();

    var searchRoot = document.querySelector("[data-search-results]");

    if (searchRoot && window.siteMovies) {
        var params = new URLSearchParams(window.location.search);
        var q = normalize(params.get("q") || "");
        var input = document.querySelector("[data-search-page-input]");

        if (input) {
            input.value = params.get("q") || "";
        }

        var results = window.siteMovies.filter(function(movie) {
            if (!q) {
                return true;
            }

            return normalize([
                movie.title,
                movie.region,
                movie.year,
                movie.tags,
                movie.genre,
                movie.oneLine
            ].join(" ")).indexOf(q) !== -1;
        }).slice(0, 200);

        if (!results.length) {
            searchRoot.innerHTML = '<div class="empty-state is-visible">没有找到相关影片</div>';
        } else {
            searchRoot.innerHTML = results.map(function(movie) {
                return [
                    '<article class="movie-card movie-card-wide">',
                    '    <a class="wide-link" href="' + movie.url + '">',
                    '        <div class="wide-poster"><img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy"></div>',
                    '        <div class="wide-body">',
                    '            <div class="card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.year) + ' 年</span></div>',
                    '            <h3>' + escapeHtml(movie.title) + '</h3>',
                    '            <p>' + escapeHtml(movie.oneLine) + '</p>',
                    '            <div class="card-tags">' + movie.tags.slice(0, 3).map(function(tag) {
                        return '<span class="pill">' + escapeHtml(tag) + '</span>';
                    }).join("") + '</div>',
                    '        </div>',
                    '    </a>',
                    '</article>'
                ].join("");
            }).join("");
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function loadHls(callback) {
        if (window.Hls) {
            callback();
            return;
        }

        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
        script.onload = callback;
        document.head.appendChild(script);
    }

    window.initMoviePlayer = function(options) {
        var frame = document.getElementById(options.element);
        if (!frame) {
            return;
        }

        var video = frame.querySelector("video");
        var cover = frame.querySelector(".player-cover");
        var button = frame.querySelector(".play-trigger");
        var started = false;
        var hlsInstance = null;

        function start() {
            if (!video || started) {
                return;
            }

            started = true;

            if (cover) {
                cover.classList.add("is-hidden");
            }

            video.setAttribute("controls", "controls");

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = options.source;
                video.play().catch(function() {});
                return;
            }

            loadHls(function() {
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(options.source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function() {
                        video.play().catch(function() {});
                    });
                } else {
                    video.src = options.source;
                    video.play().catch(function() {});
                }
            });
        }

        if (cover) {
            cover.addEventListener("click", start);
        }

        if (button) {
            button.addEventListener("click", function(event) {
                event.stopPropagation();
                start();
            });
        }

        video.addEventListener("click", function() {
            if (!started) {
                start();
            }
        });

        window.addEventListener("beforeunload", function() {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };
})();
