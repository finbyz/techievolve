frappe.provide("erpnext.shopping_cart");
var shopping_cart = erpnext.shopping_cart;

$.extend(shopping_cart, {
    update_cart_custom: function (opts) {
        if (frappe.session.user === "Guest") {
            if (localStorage) {
                localStorage.setItem("last_visited", window.location.pathname);
            }
            window.location.href = "/login";
        } else {
            return frappe.call({
                type: "POST",
                method: "techievolve.api.update_cart_custom",
                args: {
                    item_code: opts.item_code,
                    qty: opts.qty,
                    additional_notes: opts.additional_notes !== undefined ? opts.additional_notes : undefined,
                    with_items: opts.with_items || 0
                },
                btn: opts.btn,
                callback: function (r) {
                    shopping_cart.set_cart_count();
                    if (r.message.shopping_cart_menu) {
                        $('.shopping-cart-menu').html(r.message.shopping_cart_menu);
                    }
                    if (opts.callback)
                        opts.callback(r);
                }
            });
        }
    },
})