frappe.ui.form.on('Item', {
    unit_buying_price: function(frm) {
        if (frm.doc.unit_buying_price && frm.doc.case_qty &&
            flt(frm.doc.unit_buying_price * frm.doc.case_qty) != flt(frm.doc.buying_price)) {
            frm.set_value('buying_price', flt(frm.doc.unit_buying_price * frm.doc.case_qty))
        }
    },
    validate: function(frm) {
        frm.trigger('unit_buying_price')
    },
    category_wise_item_image: function(frm) {
        window.location.href = `#List/Item/Image?item_group=${frm.doc.item_group}`
    },
    change_qty: function(frm) {
        frappe.prompt({
            label: 'Stock Update Password',
            fieldname: 'data',
            fieldtype: 'Data'
        }, (values) => {
            frappe.call({
                method: 'techievolve.api.get_default_password',
                args: {
                    field: 'item_edit_password',
                },
                callback: function(res) {
                    if (res.message == values.data) {
                        frappe.call({
                            method: "techievolve.techievolve.doc_events.item.change_qty",
                            args: {
                                item_code: frm.doc.name,
                                new_qty: frm.doc.stock_qty,
                            },
                            callback: function(r) {
                                frm.reload_doc();
                                frappe.msgprint("Stock Qty has been Updated")
                            }
                        })
                    } else {
                        frappe.throw('Password Is Incorrect')
                    }
                }
            })
        })
    },
    onload: function(frm) {
        frm.trigger('update_stock_qty');
    },
    refresh: function(frm) {
        frm.trigger('update_stock_qty');
    },
    update_stock_qty: function(frm) {
        if (frm.doc.is_stock_item) {
            frappe.call({
                method: "techievolve.techievolve.doc_events.item.get_stock_qty",
                args: {
                    item_code: frm.doc.name,
                    warehouse: frm.doc.reorder_levels[0].warehouse
                },
                callback: function(r) {
                    if (frm.doc.stock_qty != r.message) {
                        frm.set_value('stock_qty', r.message);
                    }
                    frm.refresh_field('stock_qty');
                }
            })
        }
    }
})