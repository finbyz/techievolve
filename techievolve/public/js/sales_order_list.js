frappe.listview_settings['Sales Order'] = {
    status: true,
    add_fields: ["base_grand_total", "customer_name", "currency", "delivery_date",
        "per_delivered", "per_billed", "status", "order_type", "name", "skip_delivery_note"
    ],

    get_indicator: function(doc) {
        if (doc.status === "To Deliver and Bill" && doc.printout_taken === 0) {
            // New
            return [__("New"), "blue", "status,=,To Deliver and Bill"];
        } else if (doc.status === "To Deliver and Bill" && doc.printout_taken === 1) {
            return [__("Processing"), "yellow", "status,=,To Deliver and Bill"];
        } else if (doc.status === "To Deliver" && doc.printout_taken === 0) {
            return [__("New"), "blue", "status,=,To Deliver"];
        } else if (doc.status === "To Deliver" && doc.printout_taken === 1) {
            return [__("Processing"), "yellow", "status,=,To Deliver"];
        } else if (doc.status === "To Bill" && doc.per_delivered == 100) {
            return [__("Delivered"), "green", "status,=,To Bill"];
        } else if (doc.status === "Completed" && doc.per_billed == 100 && doc.per_delivered == 100) {
            return [__("Completed"), "green", "status,=,Completed"];
        }
    },
    onload: function(listview) {
        var method = "erpnext.selling.doctype.sales_order.sales_order.close_or_unclose_sales_orders";

        listview.page.add_menu_item(__("Close"), function() {
            listview.call_for_selected_items(method, { "status": "Closed" });
        });

        listview.page.add_menu_item(__("Re-open"), function() {
            listview.call_for_selected_items(method, { "status": "Submitted" });
        });
        // $("select[placeholder='Status'] option:first").text("status");


    }
};