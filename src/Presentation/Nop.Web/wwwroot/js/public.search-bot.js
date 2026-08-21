/**
 * Product Search Bot Widget
 * Floating chat-style search widget for the storefront.
 * Calls POST /api/search-bot/search and renders up to 5 product results.
 * Hidden automatically on /rider/* pages.
 */
(function () {
    'use strict';

    var HISTORY_STORAGE_KEY = 'searchBot.chatHistory.v1';
    var MAX_HISTORY_ITEMS = 60;

    if (window.location.pathname.toLowerCase().startsWith('/rider')) return;

    var widget = document.getElementById('search-bot-widget');
    var toggle = document.getElementById('search-bot-toggle');
    var panel = document.getElementById('search-bot-panel');
    var close = document.getElementById('search-bot-close');
    var input = document.getElementById('search-bot-input');
    var submit = document.getElementById('search-bot-submit');
    var results = document.getElementById('search-bot-results');
    var savedProductIds = {};

    if (!widget) return;

    clearHistoryIfReload();

    widget.style.display = 'flex';

    var chatHistory = loadHistory();
    var isLoading = false;

    renderHistory();

    function openPanel() {
        panel.classList.add('search-bot-panel--open');
        toggle.setAttribute('aria-expanded', 'true');
        setTimeout(function () { input.focus(); }, 200);
    }

    function closePanel() {
        panel.classList.remove('search-bot-panel--open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
        panel.classList.contains('search-bot-panel--open') ? closePanel() : openPanel();
    });

    close.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePanel();
    });

    document.addEventListener('click', function (e) {
        if (!widget.contains(e.target)) closePanel();
    });

    function createHistoryItem(messageType, userPrompt, searchResults, botMessage, messageStyle) {
        return {
            messageType: messageType,
            userPrompt: userPrompt || '',
            searchResults: Array.isArray(searchResults) ? searchResults : [],
            botMessage: botMessage || '',
            messageStyle: messageStyle || '',
            timestamp: new Date().toISOString()
        };
    }

    function clearHistoryIfReload() {
        try {
            var nav = performance.getEntriesByType && performance.getEntriesByType('navigation');
            if (nav && nav.length > 0 && nav[0].type === 'reload') {
                sessionStorage.removeItem(HISTORY_STORAGE_KEY);
            }
        } catch (e) {
            // no-op
        }
    }

    function loadHistory() {
        try {
            var raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
            if (!raw) return [];

            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.filter(function (item) {
                return item && (item.messageType === 'user' || item.messageType === 'bot');
            });
        } catch (e) {
            return [];
        }
    }

    function saveHistory() {
        try {
            if (chatHistory.length > MAX_HISTORY_ITEMS) {
                chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY_ITEMS);
            }
            sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
        } catch (e) {
            // no-op
        }
    }

    function appendHistoryItem(item) {
        chatHistory.push(item);
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (!chatHistory.length && !isLoading) {
            results.innerHTML = '';
            return;
        }

        var html = '<div class="search-bot-chat-history">';

        chatHistory.forEach(function (entry) {
            html += entry.messageType === 'user' ? renderUserMessage(entry) : renderBotMessage(entry);
        });

        if (isLoading) {
            html +=
                '<div class="search-bot-chat-row search-bot-chat-row--bot">' +
                    '<div class="search-bot-chat-bubble search-bot-chat-bubble--bot">' +
                        '<div class="search-bot-loading">' +
                            '<span class="search-bot-spinner" aria-hidden="true"></span>' +
                            '<span>Searching...</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        html += '</div>';
        results.innerHTML = html;
        scrollHistoryToBottom();
    }

    function renderUserMessage(entry) {
        return (
            '<div class="search-bot-chat-row search-bot-chat-row--user">' +
                '<div class="search-bot-chat-bubble search-bot-chat-bubble--user">' +
                    escapeHtml(entry.userPrompt) +
                '</div>' +
            '</div>'
        );
    }

    function renderBotMessage(entry) {
        var body = '';

        if (entry.searchResults && entry.searchResults.length) {
            body = renderProductsList(entry.searchResults);
        } else {
            var cssClass = 'search-bot-fallback';
            if (entry.messageStyle === 'success') {
                cssClass = 'search-bot-cart-confirm';
            } else if (entry.messageStyle === 'info') {
                cssClass = 'search-bot-cart-confirm search-bot-cart-confirm--info';
            } else if (entry.messageStyle === 'error') {
                cssClass = 'search-bot-fallback search-bot-fallback--error';
            }

            body = '<p class="' + cssClass + '">' +
                escapeHtml(entry.botMessage || 'Something went wrong. Please try again.') +
                '</p>';
        }

        return (
            '<div class="search-bot-chat-row search-bot-chat-row--bot">' +
                '<div class="search-bot-chat-bubble search-bot-chat-bubble--bot">' +
                    body +
                '</div>' +
            '</div>'
        );
    }

    function renderProductsList(products) {
        var fallbackImage = '/images/thumbs/default-image_120.jpeg';
        var html = '<ul class="search-bot-product-list">';

        products.forEach(function (p) {
            var id = p.id || p.Id || 0;
            var productId = parseInt(id, 10) || 0;
            var name = p.name || p.Name || '';
            var imageUrl = p.imageUrl || p.ImageUrl || fallbackImage;
            var price = p.price || p.Price || '';
            var productUrl = p.productUrl || p.ProductUrl || '#';
            var description = p.description || p.Description || '';
            var inStock = p.inStock !== false && p.InStock !== false;
            var requiresSelection = p.requiresSelection === true || p.RequiresSelection === true;
            var addToCartUrl = '/addproducttocart/catalog/' + id + '/1/1';
            var wishlistUrl = '/addproducttocart/catalog/' + productId + '/2/1';
            var isSaved = !!savedProductIds[productId];
            var heartSymbol = isSaved ? '&#9829;' : '&#9825;';
            var heartTitle = isSaved ? 'Saved to wishlist' : 'Save to wishlist';

            if (description.length > 110) {
                description = description.slice(0, 110).trimEnd() + '…';
            }

            html +=
                '<li class="search-bot-product">' +
                    '<article class="product-item" data-productid="' + id + '">' +
                        '<div class="search-bot-product-content">' +
                            '<a class="search-bot-product-link" href="' + escapeHtml(productUrl) + '" target="_blank" rel="noopener noreferrer">' +
                                '<img class="search-bot-product-img"' +
                                    ' src="' + escapeHtml(imageUrl) + '"' +
                                    ' alt="' + escapeHtml(name) + '"' +
                                    ' loading="lazy"' +
                                '/>' +
                                '<div class="search-bot-product-info">' +
                                    '<span class="search-bot-product-name">' + escapeHtml(name) + '</span>' +
                                    (description ? '<span class="search-bot-product-desc search-bot-product-description">' + escapeHtml(description) + '</span>' : '') +
                                    '<span class="search-bot-product-price">' + escapeHtml(price) + '</span>' +
                                '</div>' +
                            '</a>' +
                            '<button type="button"' +
                                ' class="search-bot-wishlist-btn' + (isSaved ? ' is-active' : '') + '"' +
                                ' data-productid="' + productId + '"' +
                                ' data-addtowishlist-url="' + escapeHtml(wishlistUrl) + '"' +
                                ' title="' + escapeHtml(heartTitle) + '"' +
                                ' aria-label="' + escapeHtml(heartTitle) + '">' +
                                '<span class="search-bot-heart" aria-hidden="true">' + heartSymbol + '</span>' +
                            '</button>' +
                        '</div>' +
                        '<div class="search-bot-product-actions">' +
                            '<a class="search-bot-view-details-btn"' +
                                ' href="' + escapeHtml(productUrl) + '"' +
                                ' target="_blank" rel="noopener noreferrer">View Details →</a>' +
                            (requiresSelection
                                ? '<a class="button-2 search-bot-select-options"' +
                                      ' href="' + escapeHtml(productUrl) + '"' +
                                      ' target="_blank" rel="noopener noreferrer">Select Options</a>'
                                : inStock
                                    ? '<button type="button"' +
                                          ' class="button-2 product-box-add-to-cart-button"' +
                                          ' data-addtocart-url="' + escapeHtml(addToCartUrl) + '"' +
                                          ' data-productid="' + id + '"' +
                                          ' data-product-name="' + escapeHtml(name) + '">Add to cart</button>'
                                    : '<button type="button" class="button-2 search-bot-out-of-stock" disabled>Out of Stock</button>'
                            ) +
                        '</div>' +
                    '</article>' +
                '</li>';
        });

        html += '</ul>';
        return html;
    }

    function scrollHistoryToBottom() {
        results.scrollTop = results.scrollHeight;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    document.addEventListener('searchbot:cartAdded', function (e) {
        var name = (e.detail && e.detail.productName) || 'Item';
        appendHistoryItem(createHistoryItem('bot', '', [], '✅ ' + name + ' added to your cart!', 'success'));
        openPanel();
    });

    document.addEventListener('searchbot:productRedirect', function (e) {
        var name = (e.detail && e.detail.productName) || 'This product';
        appendHistoryItem(createHistoryItem('bot', '', [], '🔗 ' + name + ' requires options — select them in the new tab to add to cart.', 'info'));
        openPanel();
    });

    function doSearch() {
        var query = input.value.trim();
        if (!query) {
            input.focus();
            return;
        }

        var timedOut = false;

        appendHistoryItem(createHistoryItem('user', query, [], ''));
        input.value = '';
        submit.disabled = true;
        isLoading = true;
        renderHistory();

        var timeout = setTimeout(function () {
            timedOut = true;
            isLoading = false;
            appendHistoryItem(createHistoryItem('bot', '', [], 'Search is taking too long. Please try again.', 'error'));
            submit.disabled = false;
        }, 3000);

        var headers = { 'Content-Type': 'application/json' };
        var tokenEl = document.querySelector('input[name="__RequestVerificationToken"]');
        if (tokenEl) headers.RequestVerificationToken = tokenEl.value;

        fetch('/api/search-bot/search', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ prompt: query })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Search request failed.');
            return res.json();
        })
        .then(function (data) {
            if (timedOut) return;

            clearTimeout(timeout);
            isLoading = false;

            var products = data.products || data.Products;
            var success = data.success !== undefined ? data.success : data.Success;
            var message = data.message || data.Message || '';

            if (success === false) {
                appendHistoryItem(createHistoryItem('bot', '', [], message || "I couldn't find anything matching that. Try different words!", message ? 'error' : ''));
            } else if (!products || products.length === 0) {
                appendHistoryItem(createHistoryItem('bot', '', [], message || "I couldn't find anything matching that. Try different words!", ''));
            } else {
                appendHistoryItem(createHistoryItem('bot', '', products, ''));
            }
        })
        .catch(function () {
            if (timedOut) return;

            clearTimeout(timeout);
            isLoading = false;
            appendHistoryItem(createHistoryItem('bot', '', [], 'Something went wrong. Please try again.', 'error'));
        })
        .finally(function () {
            if (!timedOut) {
                submit.disabled = false;
            }
        });
    }

    submit.addEventListener('click', doSearch);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSearch();
    });

    results.addEventListener('click', function (e) {
        var button = e.target.closest('.search-bot-wishlist-btn');
        if (!button) return;

        e.preventDefault();

        var loginLink = document.querySelector('.header-links a[href^="/login"]');
        if (loginLink) {
            location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search);
            return;
        }

        var productId = parseInt(button.getAttribute('data-productid'), 10) || 0;
        var url = button.getAttribute('data-addtowishlist-url');
        if (!productId || !url || button.disabled) return;

        button.disabled = true;

        var postData = {};
        addAntiForgeryToken(postData);

        $.ajax({
            cache: false,
            url: url,
            type: 'POST',
            data: postData,
            success: function (response) {
                if (response && response.redirect) {
                    location.href = response.redirect;
                    return;
                }

                if (response && (response.success === true || response.updatetopwishlistsectionhtml)) {
                    if (response.updatetopwishlistsectionhtml && window.AjaxCart && AjaxCart.topwishlistselector) {
                        $(AjaxCart.topwishlistselector).html(response.updatetopwishlistsectionhtml);
                    }

                    savedProductIds[productId] = true;
                    renderHistory();
                    return;
                }

                if (response && response.message && /login|sign\s*in/i.test(response.message)) {
                    location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search);
                    return;
                }

                button.disabled = false;
            },
            error: function () {
                button.disabled = false;
            }
        });
    });
}());
