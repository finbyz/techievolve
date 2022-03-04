// Copyright (c) 2016, Finbyz Tech Pvt Ltd and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Vendor Details"] = {
    "filters": [{
        "fieldname": "supplier",
        "label": __("Supplier"),
        "fieldtype": "Link",
        "options": "Supplier"
    }]
};


function new_purchase_order(supplier, items) {
    frappe.call({
        method: "techievolve.techievolve.report.vendor_details.vendor_details.add_item_details",
        args: {
            'supplier': supplier
        },
        freeze: true,
        freeze_message: "Creating Purchase Order",
        callback: function(r) {
            if (r.message) {
                frappe.set_route("Form", "Purchase Order", r.message)
            }
        }
    })
}