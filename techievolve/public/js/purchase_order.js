//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
        this.frm.set_query("item_code", "items", function(doc) {
            return {
                query: "techievolve.query.item_query",

                filters: {
                    'is_purchase_item': 1,
                    'supplier': doc.supplier
                }
            }
        });
    }
    //$(".form-inner-toolbar").hide();
frappe.ui.form.on("Purchase Order Item", {
    supplier_part_no: function(frm, cdn, cdt) {
        var row = locals[cdt][cdn];
        if (row.item_code) {
            frappe.call({
                method: 'techievolve.api.get_supplier_number',
                args: {
                    "item": row.item_code
                },
                callback: function(res) {
                    frappe.model.set_value(row.doctype, row.name, "supplier_part_no", res.message)
                }
            })

            frappe.call({
                method: 'techievolve.api.get_reorder_qty',
                args: {
                    "item": row.item_code,
                },
                callback: function(r) {
                    frappe.model.set_value(row.doctype, row.name, "qty", r.message)
                    frappe.model.set_value(row.doctype, row.name, "reorder_qty", r.message)
                }
            })
        }
    },
    item_code: function(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.get_value("Item", row.item_code, ['shelf_location', 'case_qty', 'unit_buying_price', 'unit_selling_price', 'master_case_qty'], (r) => {

            frappe.model.set_value(row.doctype, row.name, "shelf_location", r.shelf_location)
            frappe.model.set_value(row.doctype, row.name, "case_qty", r.case_qty)
            frappe.model.set_value(row.doctype, row.name, "unit_buying_price", r.unit_buying_price)
            frappe.model.set_value(row.doctype, row.name, "unit_selling_price", r.unit_selling_price)
            frappe.model.set_value(row.doctype, row.name, "master_case_qty", r.master_case_qty)
        })

        if (row.item_code) {
            frappe.call({
                method: 'techievolve.api.get_supplier_number',
                args: {
                    "item": row.item_code
                },
                callback: function(res) {
                    frappe.model.set_value(row.doctype, row.name, "supplier_part_no", res.message)
                    console.log(res.message)
                }
            })

            frappe.call({
                method: 'techievolve.api.get_reorder_qty',
                args: {
                    "item": row.item_code,
                },
                callback: function(r) {
                    frappe.model.set_value(row.doctype, row.name, "qty", r.message)
                    frappe.model.set_value(row.doctype, row.name, "reorder_qty", r.message)
                }
            })
        }
        frm.refresh_field("Purchase Order Item");
    }
})