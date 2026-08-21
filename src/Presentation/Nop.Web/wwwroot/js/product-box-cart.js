/*
** Product listing page — Add to Cart / quantity selector logic.
** Uses event delegation so this file only needs to be loaded once per page.
*/
(function () {
    if (window.__productBoxCartInitialized) return;
    window.__productBoxCartInitialized = true;

    var MAX_QTY = 5;

    window.ProductBoxCart = window.ProductBoxCart || {};

    function updateCartHeader(response) {
        if (response.updatetopcartsectionhtml) {
            $(AjaxCart.topcartselector).html(response.updatetopcartsectionhtml);
        }
        if (response.updateflyoutcartsectionhtml) {
            $(AjaxCart.flyoutcartselector).replaceWith(response.updateflyoutcartsectionhtml);
        }
    }

    function showNotification(response, type, duration) {
        if (!response || !response.message) {
            return;
        }

        var msg = Array.isArray(response.message) ? response.message.join('<br/>') : response.message;
        if (AjaxCart.usepopupnotifications) {
            displayPopupNotification(msg, type, true);
        } else {
            displayBarNotification(msg, type, duration);
        }
    }

    function setEnteredQuantity($input, value) {
        if (!$input.length) {
            return;
        }

        $input.val(String(value));
    }

    window.ProductBoxCart.initDetailsCounter = function (config) {
        var $addButton = $(config.addButtonSelector);
        if (!$addButton.length || $addButton.data('detailsCounterInitialized')) {
            return;
        }

        $addButton.data('detailsCounterInitialized', true);

        var $qtyControl = $(config.qtyControlSelector);
        var $qtyDisplay = $qtyControl.find('.qty-display');
        var $plusBtn = $qtyControl.find('.qty-plus');
        var $minusBtn = $qtyControl.find('.qty-minus');
        var $enteredQty = $(config.enteredQtySelector);

        if (config.initialCartQty > 0) {
            $plusBtn.prop('disabled', config.initialCartQty >= MAX_QTY);
            $minusBtn.prop('disabled', false);
        }

        window['productDetailsAddToCartWithCounter_' + config.productId] = function () {
            $addButton.prop('disabled', true);
            setEnteredQuantity($enteredQty, 1);

            $.ajax({
                cache: false,
                url: config.addToCartUrl,
                type: 'POST',
                data: $(config.formSelector).serialize(),
                success: function (response) {
                    if (response.redirect) {
                        location.href = response.redirect;
                        return;
                    }

                    if (response.success === true || response.updatetopcartsectionhtml) {
                        updateCartHeader(response);
                        $addButton.hide();
                        $qtyDisplay.text('1');
                        $minusBtn.prop('disabled', false);
                        $plusBtn.prop('disabled', false);
                        $qtyControl.show();
                    } else {
                        $addButton.prop('disabled', false);
                        showNotification(response, 'error', 0);
                    }
                },
                error: function () {
                    $addButton.prop('disabled', false);
                }
            });

            return false;
        };

        $plusBtn.on('click', function () {
            var currentQty = parseInt($qtyDisplay.text(), 10);
            if (currentQty >= MAX_QTY) {
                return;
            }

            var newQty = currentQty + 1;
            var postData = {};
            addAntiForgeryToken(postData);

            $plusBtn.prop('disabled', true);
            $minusBtn.prop('disabled', true);

            $.ajax({
                cache: false,
                url: '/cart/updateitemqty/' + config.productId + '/' + newQty,
                type: 'POST',
                data: postData,
                success: function (response) {
                    if (response.success !== false) {
                        updateCartHeader(response);
                        $qtyDisplay.text(newQty);
                        setEnteredQuantity($enteredQty, newQty);
                    }

                    $plusBtn.prop('disabled', newQty >= MAX_QTY);
                    $minusBtn.prop('disabled', false);
                },
                error: function () {
                    $plusBtn.prop('disabled', currentQty >= MAX_QTY);
                    $minusBtn.prop('disabled', false);
                }
            });
        });

        $minusBtn.on('click', function () {
            var currentQty = parseInt($qtyDisplay.text(), 10);
            var newQty = currentQty - 1;
            var postData = {};
            addAntiForgeryToken(postData);

            $minusBtn.prop('disabled', true);
            $plusBtn.prop('disabled', true);

            $.ajax({
                cache: false,
                url: '/cart/updateitemqty/' + config.productId + '/' + newQty,
                type: 'POST',
                data: postData,
                success: function (response) {
                    if (response.success !== false) {
                        updateCartHeader(response);

                        if (newQty <= 0) {
                            $qtyControl.hide();
                            $addButton.prop('disabled', false).show();
                            setEnteredQuantity($enteredQty, 1);
                            return;
                        }

                        $qtyDisplay.text(newQty);
                        setEnteredQuantity($enteredQty, newQty);
                    }

                    $plusBtn.prop('disabled', newQty >= MAX_QTY);
                    $minusBtn.prop('disabled', false);
                },
                error: function () {
                    $plusBtn.prop('disabled', currentQty >= MAX_QTY);
                    $minusBtn.prop('disabled', false);
                }
            });
        });
    };

    // ── Add to Cart button (first click on a card) ─────────────────────────────
    $(document).on('click', '.product-box-add-to-cart-button', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var url = $btn.data('addtocart-url');
        var $article = $btn.closest('.product-item');
        var $qtyControl = $article.find('.qty-control');
        var $qtyDisplay = $qtyControl.find('.qty-display');
        var $plusBtn = $qtyControl.find('.qty-plus');

        $btn.prop('disabled', true);

        var postData = {};
        addAntiForgeryToken(postData);

        $.ajax({
            cache: false,
            url: url,
            type: 'POST',
            data: postData,
            success: function (response) {
                if (response.redirect) {
                    // If triggered from inside the chatbot widget, open in a new tab
                    // so the current page (and the chatbot panel) is preserved.
                    if ($btn.closest('#search-bot-widget').length) {
                        window.open(response.redirect, '_blank', 'noopener,noreferrer');
                        $btn.prop('disabled', false);
                        document.dispatchEvent(new CustomEvent('searchbot:productRedirect', {
                            detail: { productName: $btn.data('product-name') || '' }
                        }));
                    } else {
                        location.href = response.redirect;
                    }
                    return;
                }
                if (response.success === true || response.updatetopcartsectionhtml) {
                    updateCartHeader(response);
                    $btn.hide();
                    $qtyDisplay.text('1');
                    $plusBtn.prop('disabled', MAX_QTY <= 1);
                    $qtyControl.show();
                    // Notify the search-bot widget so it can show a confirmation message
                    if ($btn.closest('#search-bot-widget').length) {
                        document.dispatchEvent(new CustomEvent('searchbot:cartAdded', {
                            detail: { productName: $btn.data('product-name') || '' }
                        }));
                    }
                } else {
                    $btn.prop('disabled', false);
                    if (response.message) {
                        var msg = Array.isArray(response.message) ? response.message.join('<br/>') : response.message;
                        if (AjaxCart.usepopupnotifications) {
                            displayPopupNotification(msg, 'error', true);
                        } else {
                            displayBarNotification(msg, 'error', 0);
                        }
                    }
                }
            },
            error: function () {
                $btn.prop('disabled', false);
            }
        });
    });

    // ── "+" button — increase quantity ─────────────────────────────────────────
    $(document).on('click', '.qty-plus', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var $article = $btn.closest('.product-item');
        var productId = $article.data('productid');
        var $qtyControl = $article.find('.qty-control');
        var $qtyDisplay = $qtyControl.find('.qty-display');
        var $minusBtn = $qtyControl.find('.qty-minus');
        var currentQty = parseInt($qtyDisplay.text(), 10);

        if (currentQty >= MAX_QTY) return;

        var newQty = currentQty + 1;
        var postData = {};
        addAntiForgeryToken(postData);

        $btn.prop('disabled', true);
        $minusBtn.prop('disabled', true);

        $.ajax({
            cache: false,
            url: '/cart/updateitemqty/' + productId + '/' + newQty,
            type: 'POST',
            data: postData,
            success: function (response) {
                if (response.success !== false) {
                    updateCartHeader(response);
                    $qtyDisplay.text(newQty);
                }
                $btn.prop('disabled', newQty >= MAX_QTY);
                $minusBtn.prop('disabled', false);
            },
            error: function () {
                $btn.prop('disabled', currentQty >= MAX_QTY);
                $minusBtn.prop('disabled', false);
            }
        });
    });

    // ── "−" button — decrease quantity / remove from cart ──────────────────────
    $(document).on('click', '.qty-minus', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var $article = $btn.closest('.product-item');
        var productId = $article.data('productid');
        var $qtyControl = $article.find('.qty-control');
        var $qtyDisplay = $qtyControl.find('.qty-display');
        var $plusBtn = $qtyControl.find('.qty-plus');
        var $addBtn = $article.find('.product-box-add-to-cart-button');
        var currentQty = parseInt($qtyDisplay.text(), 10);

        var newQty = currentQty - 1;
        var postData = {};
        addAntiForgeryToken(postData);

        $btn.prop('disabled', true);
        $plusBtn.prop('disabled', true);

        $.ajax({
            cache: false,
            url: '/cart/updateitemqty/' + productId + '/' + newQty,
            type: 'POST',
            data: postData,
            success: function (response) {
                if (response.success !== false) {
                    updateCartHeader(response);
                    if (newQty <= 0) {
                        $qtyControl.hide();
                        $addBtn.prop('disabled', false).show();
                    } else {
                        $qtyDisplay.text(newQty);
                        $plusBtn.prop('disabled', newQty >= MAX_QTY);
                        $btn.prop('disabled', false);
                    }
                } else {
                    $btn.prop('disabled', false);
                    $plusBtn.prop('disabled', currentQty >= MAX_QTY);
                }
            },
            error: function () {
                $btn.prop('disabled', false);
                $plusBtn.prop('disabled', currentQty >= MAX_QTY);
            }
        });
    });

    // ── Add to Wishlist button ──────────────────────────────────────────────────
    $(document).on('click', '.add-to-wishlist-button', function (e) {
        e.preventDefault();

        var $btn = $(this);
        
        // Prevent duplicate clicks
        if ($btn.prop('disabled')) {
            return;
        }

        var url = $btn.data('addtowishlist-url');

        $btn.prop('disabled', true);

        var postData = {};
        addAntiForgeryToken(postData);

        $.ajax({
            cache: false,
            url: url,
            type: 'POST',
            data: postData,
            success: function (response) {
                if (response.redirect) {
                    location.href = response.redirect;
                    return;
                }
                if (response.success === true || response.updatetopwishlistsectionhtml) {
                    // Update wishlist counter in navbar
                    if (response.updatetopwishlistsectionhtml) {
                        $(AjaxCart.topwishlistselector).html(response.updatetopwishlistsectionhtml);
                    }
                    
                    // Update button text to show checkmark and keep it disabled
                    var btnText = $btn.text();
                    if (!btnText.includes('✓')) {
                        $btn.text(btnText.trim() + ' ✓');
                    }
                    // Button stays disabled
                    
                    showNotification(response, 'success', 3500);
                } else {
                    $btn.prop('disabled', false);
                    showNotification(response, 'error', 0);
                }
            },
            error: function () {
                $btn.prop('disabled', false);
            }
        });
    });
})();
