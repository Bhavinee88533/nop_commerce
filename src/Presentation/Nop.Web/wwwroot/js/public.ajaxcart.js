/*
** nopCommerce ajax cart implementation
*/


var AjaxCart = {
    loadWaiting: false,
    processingButton: null,
    lastInteractedElement: null,
    usepopupnotifications: false,
    topcartselector: '',
    topwishlistselector: '',
    flyoutcartselector: '',
    localized_data: false,

    init: function (usepopupnotifications, topcartselector, topwishlistselector, flyoutcartselector, localized_data) {
        this.loadWaiting = false;
        this.processingButton = null;
        this.lastInteractedElement = null;
        this.usepopupnotifications = usepopupnotifications;
        this.topcartselector = topcartselector;
        this.topwishlistselector = topwishlistselector;
        this.flyoutcartselector = flyoutcartselector;
        this.localized_data = localized_data;

        // Capture the latest clicked control so anchor-based actions get proper loading state.
        $(document)
            .off('click.ajaxcart keydown.ajaxcart', 'button, input[type="button"], input[type="submit"], a.button-1, a.button-2, .button-1, .button-2')
            .on('click.ajaxcart keydown.ajaxcart', 'button, input[type="button"], input[type="submit"], a.button-1, a.button-2, .button-1, .button-2', function (e) {
                if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
                    AjaxCart.lastInteractedElement = $(this);
                }
            });
    },

    setLoadWaiting: function (display) {
        displayAjaxLoading(display);
        this.loadWaiting = display;
    },

    setButtonProcessing: function (element, processing) {
        if (!element || !element.length) {
            return;
        }

        var isAnchor = element.is('a');

        if (processing) {
            element.prop('disabled', true)
                .addClass('disabled button-loading')
                .attr('aria-busy', 'true');

            if (isAnchor) {
                element.attr('aria-disabled', 'true');

                if (typeof element.data('ajaxcart-tabindex') === 'undefined') {
                    element.data('ajaxcart-tabindex', element.attr('tabindex'));
                }

                element.attr('tabindex', '-1');
            }

            return;
        }

        element.prop('disabled', false)
            .removeClass('disabled button-loading')
            .removeAttr('aria-busy');

        if (isAnchor) {
            element.removeAttr('aria-disabled');

            var previousTabIndex = element.data('ajaxcart-tabindex');

            if (typeof previousTabIndex === 'undefined' || previousTabIndex === null) {
                element.removeAttr('tabindex');
            } else {
                element.attr('tabindex', previousTabIndex);
            }

            element.removeData('ajaxcart-tabindex');
        }
    },

    tryGetCurrentButton: function () {
        var eventTarget = window.event ? $(window.event.target).closest('button, input[type="button"], input[type="submit"], a.button-1, a.button-2, .button-1, .button-2') : $();
        if (eventTarget.length) {
            return eventTarget;
        }

        var activeElement = $(document.activeElement);
        if (activeElement.length && activeElement.is('button, input[type="button"], input[type="submit"], a.button-1, a.button-2, .button-1, .button-2')) {
            return activeElement;
        }

        if (this.lastInteractedElement && this.lastInteractedElement.length) {
            return this.lastInteractedElement;
        }

        return null;
    },

    beginRequest: function () {
        if (this.loadWaiting !== false) {
            return false;
        }

        this.processingButton = this.tryGetCurrentButton();
        this.setButtonProcessing(this.processingButton, true);
        this.setLoadWaiting(true);

        return true;
    },

    //move a shopping cart item to the custom wishlist
    moveToCustomWishlist: function (urlmove, itemId, wishlistId) {
        if (!this.beginRequest()) {
            return;
        }

        var postData = {
          shoppingCartItemId: itemId,
          customWishlistId: wishlistId
        };
        addAntiForgeryToken(postData);

        this.send_ajax(urlmove, postData);
    },

    //create custom wishlist
    createCustomWishlist: function (urlcreate, wishlistName, productId) {
            if (!this.beginRequest()) {
        return;
      }

      var postData = {
        name: wishlistName,
        productId: productId
      };
      addAntiForgeryToken(postData);

      this.send_ajax(urlcreate, postData);
    },

    //rename custom wishlist
    renameCustomWishlist: function (urlrename, wishlistName, wishlistId) {
            if (!this.beginRequest()) {
        return;
      }

      var postData = {
        wishlistName: wishlistName,
        wishlistId: wishlistId
      };
      addAntiForgeryToken(postData);

      this.send_ajax(urlrename, postData);
    },

    //delete custom wishlist
    deleteCustomWishlist: function (urldelete) {
                if (!this.beginRequest()) {
          return;
        }

        var postData = {};
        addAntiForgeryToken(postData);

        this.send_ajax(urldelete, postData);
    },

    //move a product to the custom wishlist from the default wishlist
    moveproducttowishlist: function (urlmove, wishlistid) {
        if (!this.beginRequest()) {
            return;
        }
        var postData = {
            wishlistId: wishlistid 
        };
        addAntiForgeryToken(postData);

        this.send_ajax(urlmove, postData);
    },

    //add a product to the cart/wishlist from the catalog pages
    addproducttocart_catalog: function (urladd) {
        if (!this.beginRequest()) {
            return;
        }

        var postData = {};
        addAntiForgeryToken(postData);

        this.send_ajax(urladd, postData);
    },

    //add a product to the cart/wishlist from the product details page
    addproducttocart_details: function (urladd, formselector) {
        if (!this.beginRequest()) {
            return;
        }

        this.send_ajax(urladd, $(formselector).serialize());
    },

    //add a product to compare list
    addproducttocomparelist: function (urladd) {
        if (!this.beginRequest()) {
            return;
        }

        var postData = {};
        addAntiForgeryToken(postData);

        this.send_ajax(urladd, postData);
    },

    send_ajax: function (requestUrl, postData) {
      $.ajax({
        cache: false,
        url: requestUrl,
        type: "POST",
        data: postData,
        success: this.success_process,
        complete: this.resetLoadWaiting,
        error: this.ajaxFailure
      });
    },

    success_process: function (response) {
        if (response.updatetopcartsectionhtml) {
            $(AjaxCart.topcartselector).html(response.updatetopcartsectionhtml);
        }
        if (response.updatetopwishlistsectionhtml) {
            $(AjaxCart.topwishlistselector).html(response.updatetopwishlistsectionhtml);
        }
        if (response.updateflyoutcartsectionhtml) {
            $(AjaxCart.flyoutcartselector).replaceWith(response.updateflyoutcartsectionhtml);
        }
        if (response.message) {
            //display notification
            if (response.success === true) {
                //success
                if (AjaxCart.usepopupnotifications === true) {
                    displayPopupNotification(response.message, 'success', true);
                }
                else {
                    //specify timeout for success messages
                    displayBarNotification(response.message, 'success', 3500);
                }
            }
            else {
                //error
                if (AjaxCart.usepopupnotifications === true) {
                    displayPopupNotification(response.message, 'error', true);
                }
                else {
                    //no timeout for errors
                    displayBarNotification(response.message, 'error', 0);
                }
            }
            return false;
        }
        if (response.redirect) {
            location.href = response.redirect;
            return true;
        }
        return false;
    },

    resetLoadWaiting: function () {
        AjaxCart.setButtonProcessing(AjaxCart.processingButton, false);
        AjaxCart.processingButton = null;
        AjaxCart.lastInteractedElement = null;
        AjaxCart.setLoadWaiting(false);
    },

    ajaxFailure: function () {
        if (AjaxCart.usepopupnotifications === true) {
            displayPopupNotification(AjaxCart.localized_data.AjaxCartFailure, 'error', true);
        }
        else {
            displayBarNotification(AjaxCart.localized_data.AjaxCartFailure, 'error', 0);
        }
    }
};