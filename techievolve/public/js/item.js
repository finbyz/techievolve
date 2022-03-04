frappe.ui.form.on('Item', {
    unit_buying_price: function(frm) {
        if (frm.doc.unit_buying_price && frm.doc.case_qty &&
            flt(frm.doc.unit_buying_price * frm.doc.case_qty) != flt(frm.doc.buying_price)) {
            frm.set_value('buying_price', flt(frm.doc.unit_buying_price * frm.doc.case_qty))
        }
    },
    validate: function(frm) {
        frm.trigger('unit_buying_price')
    }
})