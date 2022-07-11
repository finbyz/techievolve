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

frappe.ui.form.on("Purchase Order", {
    onload: function(frm) {
        frm.trigger("change_read_only_colour");
    },
    before_save: function(frm) {
        frm.doc.items.forEach((row) => {
            if (row.description) {
                frappe.model.set_value(row.doctype, row.name, 'modified_description', row.description)
            }
        })
    },
    change_read_only_colour: function(frm) {
        // Color Item Row based on Item selection & presence of Main Item in it, i.e. changing color of sub items
        frm.doc.items.forEach(function(row) {
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="unit_buying_price"]', [row.idx])).css({ 'background-color': '#fffca1' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="reorder_level"]', [row.idx])).css({ 'background-color': '#fffca1' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="reorder_qty"]', [row.idx])).css({ 'background-color': '#fffca1' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="case_qty"]', [row.idx])).css({ 'background-color': '#fffca1' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="master_case_qty"]', [row.idx])).css({ 'background-color': '#fffca1' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="qty"]', [row.idx])).css({ 'background-color': '#fffca1' });

            // white color
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="item_code"]', [row.idx])).css({ 'background-color': '#fff' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="supplier_part_no"]', [row.idx])).css({ 'background-color': '#fff' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="description"]', [row.idx])).css({ 'background-color': '#fff' });
            $("div[data-fieldname='items']").find($.format('div.grid-row[data-idx="{0}"] [data-fieldname ="actual_stock_qty"]', [row.idx])).css({ 'background-color': '#fff' });
        });
    },

})
frappe.ui.form.on("Purchase Order Item", {

    item_code: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        if (row.__islocal == 1) {
            frappe.model.get_value("Item", row.item_code, ['description'], (r) => {
                frappe.model.set_value(row.doctype, row.name, "description", r.description);
            })
        }


        if (row.item_code) {
            frappe.call({
                method: 'techievolve.api.get_supplier_number',
                args: {
                    "item": row.item_code
                },
                callback: function(res) {
                    if (row.supplier_part_no != res.message) {
                        frappe.model.set_value(row.doctype, row.name, "supplier_part_no", res.message)
                    }
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

        // change colour of readonly field
        frm.events.change_read_only_colour(frm);

        frappe.model.get_value("Item", row.item_code, ['shelf_location', 'case_qty', 'unit_buying_price', 'unit_selling_price', 'master_case_qty'], (r) => {
            frappe.model.set_value(row.doctype, row.name, "shelf_location", r.shelf_location)
            frappe.model.set_value(row.doctype, row.name, "case_qty", r.case_qty)
            frappe.model.set_value(row.doctype, row.name, "unit_buying_price", r.unit_buying_price)
            frappe.model.set_value(row.doctype, row.name, "unit_selling_price", r.unit_selling_price)
            frappe.model.set_value(row.doctype, row.name, "master_case_qty", r.master_case_qty)
        })

        // frappe.run_serially([
        //     () => {
        //         if (!row.__islocal && row.item_code != row.modified_item_code) {
        //             frappe.prompt({
        //                 label: 'Item Update Password',
        //                 fieldname: 'data',
        //                 fieldtype: 'Data'
        //             }, (values) => {
        //                 frappe.call({
        //                     method: 'techievolve.api.get_default_password',
        //                     args: {
        //                         field: 'item_edit_password',
        //                     },
        //                     callback: function(res) {
        //                         if (res.message == values.data) {
        //                             frappe.model.set_value(row.doctype, row.name, "item_code", item_code)
        //                             frappe.model.set_value(row.doctype, row.name, "modified_item_code", item_code)
        //                         } else {
        //                             frappe.throw('Password Is Incorrect')
        //                             frappe.model.set_value(row.doctype, row.name, "item_code", row.modified_item_code)
        //                         }
        //                     }
        //                 })
        //             })
        //         } else {
        //             frappe.model.set_value(row.doctype, row.name, "modified_item_code", row.item_code)
        //         }
        //     },
        //     () => {
        //         if (row.modified_item_code) {
        //             setTimeout(() => {
        //                 frappe.model.set_value(row.doctype, row.name, "item_code", row.modified_item_code)
        //             }, 500)
        //         }
        //     },
        // ]);

    },

})

if (this.frm.doctype == "Purchase Order") {
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