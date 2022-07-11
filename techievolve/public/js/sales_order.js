//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
    this.frm.set_query("item_code", "items", function(doc) {
        return {
            query: "techievolve.query.item_query",
            filters: {
                'is_sales_item': 1
            }
        }
    });
}
if (this.frm.doctype == "Sales Order") {
    erpnext.utils.update_child_items = function(opts) {
        const frm = opts.frm;
        const cannot_add_row = (typeof opts.cannot_add_row === 'undefined') ? true : opts.cannot_add_row;
        const child_docname = (typeof opts.cannot_add_row === 'undefined') ? "items" : opts.child_docname;
        this.data = [];
        let me = this;
        const dialog = new frappe.ui.Dialog({
            title: __("Update Items"),
            fields: [{
                fieldname: "trans_items",
                fieldtype: "Table",
                label: "Items",
                cannot_add_rows: cannot_add_row,
                in_place_edit: true,
                reqd: 1,
                data: this.data,
                get_data: () => {
                    return this.data;
                },
                fields: [{
                        fieldtype: 'Data',
                        fieldname: "docname",
                        read_only: 1,
                        hidden: 1,
                    }, {
                        fieldtype: 'Read Only',
                        fieldname: "item_code",
                        options: 'Item',
                        in_list_view: 1,
                        read_only: 1,
                        reqd: 1,
                        disabled: 1,
                        columns: 3,
                        label: __('Item Code')
                    }, {
                        fieldtype: 'Int',
                        fieldname: "qty",
                        default: 0,
                        read_only: 0,
                        in_list_view: 1,
                        columns: 1,
                        label: __('Qty')
                    },
                    {
                        fieldtype: 'Currency',
                        fieldname: "rate",
                        default: 0,
                        read_only: 0,
                        in_list_view: 1,
                        // columns: 1,
                        permlevel: 2,
                        label: __('Rate')
                    },
                ]
            }, ],
            primary_action: function() {
                const trans_items = this.get_values()["trans_items"];
                frappe.call({
                    method: 'erpnext.controllers.accounts_controller.update_child_qty_rate',
                    freeze: true,
                    args: {
                        'parent_doctype': frm.doc.doctype,
                        'trans_items': trans_items,
                        'parent_doctype_name': frm.doc.name,
                        'child_docname': child_docname
                    },
                    callback: function() {
                        frm.reload_doc();
                    }
                });
                this.hide();
                refresh_field("items");
            },
            primary_action_label: __('Update')
        });

        frm.doc[opts.child_docname].forEach(d => {
            dialog.fields_dict.trans_items.df.data.push({
                "docname": d.name,
                "name": d.name,
                "item_code": d.item_code,
                "qty": d.qty,
                "rate": d.rate,
            });
            this.data = dialog.fields_dict.trans_items.df.data;
            dialog.fields_dict.trans_items.grid.refresh();
        })
        dialog.show();
    }
}

function rankingSorter(firstKey) {
    return function(a, b) {
        if (a[firstKey] < b[firstKey]) {
            return -1;
        } else if (a[firstKey] < b[firstKey]) {
            return 1;
        } else {
            return 0;
        }
    }
}

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (!frm.doc.printout_taken) {
            frm.add_custom_button(__('Print'), function() {
                frappe.db.set_value("Sales Order", frm.doc.name, "printout_taken", 1);
                frm.remove_custom_button('Print');
                cur_frm.print_doc();
                if (frm.doc.docstatus > 0) {
                    frappe.db.set_value("Sales Order", frm.doc.name, "custom_status", "Processing");
                    cur_frm.reload_doc();
                }
            }).css({ 'color': 'black', 'font-weight': 'bold', 'background-color': 'yellow', 'border': '1px solid black', 'float': 'right' });
        }

    },
    before_save: function(frm) {
        if (!frm.doc.delivery_date) {
            frm.doc.items.forEach((d) => {
                if (!d.delivery_date) {
                    frappe.model.set_value(d.doctype, d.name, 'delivery_date', frm.doc.transaction_date);
                }
            })
        } else {
            frm.doc.items.forEach((d) => {
                frappe.model.set_value(d.doctype, d.name, 'delivery_date', frm.doc.delivery_date);

            })
        }
        var sorted = frm.doc.items.sort(rankingSorter("shelf_location"));
        for (var i = 1; i <= sorted.length; i++) {
            sorted[i - 1].idx = i;
        }
        frm.refresh_field("items");
    }
})