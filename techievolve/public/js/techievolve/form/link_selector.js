// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt



frappe.ui.form.LinkSelector = Class.extend({

    init: function(opts) {
        /* help: Options: doctype, get_query, target */
        $.extend(this, opts);

        var me = this;
        if (this.doctype != "[Select]") {
            frappe.model.with_doctype(this.doctype, function(r) {
                me.make();
            });
        } else {
            this.make();
        }
    },
    make: function() {
        var me = this;
        this.start = 0;
        this.dialog = new frappe.ui.Dialog({
            title: __("Select {0}", [(this.doctype == '[Select]') ? __("value") : __(this.doctype)]),
            fields: [{
                    fieldtype: "Button",
                    fieldname: "select_all",
                    label: __("Select All"),
                    click: () => {
                        me.select_all(me);
                    }
                },
                { fieldtype: "Column Break" },
                { fieldtype: "Column Break" },
                { fieldtype: "Column Break" },
                { fieldtype: "Column Break" },
                { fieldtype: "Column Break" },
                {
                    fieldtype: "Button",
                    fieldname: "update_items",
                    label: __("Add Items"),
                    click: () => {
                        me.update_items(me);
                        me.dialog.hide();
                    },
                },

                { fieldtype: "Section Break" },
                {
                    fieldtype: "Data",
                    fieldname: "txt",
                    label: __("Beginning with"),
                    description: __("You can use wildcard %"),
                },
                {
                    fieldtype: "HTML",
                    fieldname: "results"
                },
                {
                    fieldtype: "Button",
                    fieldname: "more",
                    label: __("More"),
                    click: () => {
                        me.start += 20;
                        me.search();
                    }
                }
            ],
            primary_action_label: __("Search"),
            primary_action: function() {
                me.start = 0;
                me.search();
            },
        });

        if (this.txt)
            this.dialog.fields_dict.txt.set_input(this.txt);

        this.dialog.get_input("txt").on("keypress", function(e) {
            if (e.which === 13) {
                me.start = 0;
                me.search();
            }
        });
        this.dialog.show();
        this.search();

    },
    select_all: function(frm) {
        var $checkboxes = $(' #get_item_name').find(':checkbox');
        $checkboxes.attr("checked", true);
    },
    update_items: function(frm) {
        var me = this;
        var updated = false;
        var d = null;
        var selected = new Array();
        selected = [];


        $('#get_item_name input:checked').each(function() {
            if (selected.indexOf(this.id) === -1) {
                selected.push(this.id);
            }
        })

        $.each(me.target.frm.doc['items'] || [], function(i, d) {
            selected.forEach((item, i) => {
                if (d[me.fieldname] === item) {
                    frappe.model.set_value(d.doctype, d.name, me.qty_fieldname, i);
                    $(".pro-qty-" + d.item_code).each(function() { $(this).text(i) });
                    $(".pro-qty-" + d.item_code).each(function() { $(this).closest('span[class^="text-muted"]').addClass("highlighted") });
                    frappe.show_alert(__("Added {0}", [item]));
                    updated = true;
                    return false;
                }
            })
        })
        if (!updated) {
            selected.forEach((item, i) => {
                d = me.target.add_new_row();
                var qty = $(`${item}`).attr('data-qty');
                frappe.model.set_value(d.doctype, d.name, me.fieldname, item);
                frappe.model.set_value(d.doctype, d.name, "desctiption", "test");
                frappe.model.set_value(d.doctype, d.name, me.qty_fieldname, qty);
                frappe.model.set_value(d.doctype, d.name, 'reorder_qty', qty);

                frappe.run_serially([
                    () => frappe.timeout(0.1),
                    () => frappe.timeout(0.5),
                    () => frappe.show_alert(__("Added {0}", [item])),
                    () => $(".pro-qty-" + d.item_code).each(function() { $(this).text(qty) }),
                    () => $(".pro-qty-" + d.item_code).each(function() { $(this).closest('span[class^="text-muted"]').addClass("highlighted") })
                ]);

                $(`#${item}`).attr("checked", false)
            })
        } else if (me.dynamic_link_field) {
            console.log('2')
            var d = me.target.add_new_row();
            frappe.model.set_value(d.doctype, d.name, me.dynamic_link_field, me.dynamic_link_reference);
            frappe.model.set_value(d.doctype, d.name, me.fieldname, value);
            frappe.show_alert(__("{0} {1} added", [me.dynamic_link_reference, value]));
        } else {
            // var d = me.target.add_new_row();
            // frappe.model.set_value(d.doctype, d.name, me.fieldname, value);
            // frappe.show_alert(__("{0} added", [value]));
            console.log('3')
            selected.forEach((item, i) => {
                d = me.target.add_new_row();
                var qty = $(`${item}`).attr('data-qty');
                console.log(item)
                frappe.model.set_value(d.doctype, d.name, me.fieldname, item);
                frappe.model.set_value(d.doctype, d.name, me.qty_fieldname, qty);
                frappe.model.set_value(d.doctype, d.name, 'reorder_qty', qty);

                frappe.run_serially([
                    () => frappe.timeout(0.1),
                    () => frappe.timeout(0.5),
                    () => frappe.show_alert(__("Added {0}", [item, qty])),
                    () => $(".pro-qty-" + d.item_code).each(function() { $(this).text(qty) }),
                    () => $(".pro-qty-" + d.item_code).each(function() { $(this).closest('span[class^="text-muted"]').addClass("highlighted") })
                ]);
                $(`#${item}`).attr("checked", false)
            })
        }
        $('#get_item_name input').attr('checked', false)
    },

    search: function() {
        var item_list = []
        cur_frm.doc.items.forEach(function(r) {
            item_list.push(r.item_code)
        })
        var args = {
            txt: this.dialog.fields_dict.txt.get_value(),
            searchfield: "name",
            start: this.start,
        };
        var me = this;
        if (this.target.set_custom_query) {
            this.target.set_custom_query(args);
        }

        // load custom query from grid
        if (this.target.is_grid && this.target.fieldinfo[this.fieldname] &&
            this.target.fieldinfo[this.fieldname].get_query) {
            $.extend(args,
                this.target.fieldinfo[this.fieldname].get_query(cur_frm.doc));
        }

        args['filters'] = { "item_code": ['!=', item_list], "supplier": cur_frm.doc.supplier }
            // args['filters'] = { "item_code": ['!=', item_list] }
        args['page_length'] = 20
        args['query'] = "techievolve.query.item_query_custom"

        frappe.link_search(this.doctype, args, function(r) {
            var parent = me.dialog.fields_dict.results.$wrapper;
            if (args.start === 0) {
                parent.empty();
            }
            if (r.values.length) {
                $.each(r.values, function(i, v) {
                    var qty = 0;
                    if (parseInt($(".pro-qty-" + v[0]).text()) > 0) {
                        // qty = $(".pro-qty-" + v[0]).last().text();

                    }
                    frappe.call({
                        method: 'techievolve.api.get_reorder_qty',
                        args: {
                            "item": v[0],
                        },
                        callback: function(r) {
                            var row = $(repl(`<div class="row link-select-row">\
                                            <div class="col-xs-1" id="get_item_name" >\
                                            <input  type="checkbox" id="%(name)s" data-qty="${r.message}"/>
                                            </div>\
                                            <div class="col-xs-2">\
                                            <b><a href="#">%(image)s</a></b></div>\
                                            <div class="col-xs-2">\
                                                <b><p style="margin: 0px;">%(name)s</p></b>\
                                                <span class="text-muted">Qty: %(qty)s</span><br>\
                                                <span class="text-muted">Added: <strong>${qty}</strong></span></div>\
                                            <div class="col-xs-3">\
                                                <b><span>Case Qty: </b>%(case)s</span><br>\
                                                <b><span>MC Qty: </b>%(mc)s</span><br>\
                                                <b><span id="repoder_qty">Re-order Qty:${r.message}</b></span><br>\</div>\
                                            <div class="col-xs-4">\
                                                <span class="text-muted">%(values)s</span></div>\
                                            </div>`, {
                                name: v[0],
                                image: v[1],
                                qty: v[2],
                                case: v[3],
                                mc: v[4],
                                values: v.splice(5).join(", ")
                            })).appendTo(parent);
                            row.find("a")
                                .attr('data-value', v[0])
                                .click(function() {

                                    var value = $(this).attr("data-value");
                                    var $link = this;
                                    if (me.target.is_grid) {
                                        // set in grid
                                        me.set_in_grid(value, r.message);
                                    } else {
                                        if (me.target.doctype)
                                            me.target.parse_validate_and_set_in_model(value);
                                        else {
                                            me.target.set_input(value);
                                            me.target.$input.trigger("change");
                                        }
                                        me.dialog.hide();
                                    }
                                    return false;
                                })
                            row.find("strong").attr("class", "pro-qty-" + v[0])
                        }
                    })
                })
            } else {
                $('<p><br><span class="text-muted">' + __("No Results") + '</span>' +
                    (frappe.model.can_create(me.doctype) ?
                        ('<br><br><a class="new-doc     btn btn-default btn-sm">' +
                            __('Create a new {0}', [__(me.doctype)]) + "</a>") : '') +
                    '</p>').appendTo(parent).find(".new-doc").click(function() {
                    frappe.new_doc(me.doctype);
                });
            }

            if (r.values.length < 20) {
                var more_btn = me.dialog.fields_dict.more.$wrapper;
                more_btn.hide();
            }

        }, this.dialog.get_primary_btn());

    },
    set_in_grid: function(value, re_order_qty) {
        var me = this,
            updated = false;
        var d = null;
        if (this.qty_fieldname) {
            frappe.prompt({
                fieldname: "qty",
                fieldtype: "Float",
                label: "Qty",
                "default": re_order_qty,
                reqd: 1
            }, function(data) {
                $.each(me.target.frm.doc[me.target.df.fieldname] || [], function(i, d) {
                    if (d[me.fieldname] === value) {
                        frappe.model.set_value(d.doctype, d.name, me.qty_fieldname, re_order_qty);
                        $(".pro-qty-" + d.item_code).each(function() { $(this).text(data.qty) });
                        $(".pro-qty-" + d.item_code).each(function() { $(this).closest('span[class^="text-muted"]').addClass("highlighted") });
                        frappe.show_alert(__("Added {0}", [value]));
                        updated = true;
                        return false;
                    }
                });
                if (!updated) {
                    frappe.run_serially([
                        () => {
                            d = me.target.add_new_row();
                        },
                        () => frappe.timeout(0.1),
                        () => frappe.model.set_value(d.doctype, d.name, me.fieldname, value),
                        () => frappe.timeout(0.5),
                        () => {
                            frappe.model.set_value(d.doctype, d.name, me.qty_fieldname, re_order_qty)
                        },
                        () => frappe.show_alert(__("Added {0}", [value])),
                        () => $(".pro-qty-" + d.item_code).each(function() { $(this).text(data.qty) }),
                        () => $(".pro-qty-" + d.item_code).each(function() { $(this).closest('span[class^="text-muted"]').addClass("highlighted") })
                    ]);

                }

            }, __("Set Quantity"), __("Set"));
        } else if (me.dynamic_link_field) {

            var d = me.target.add_new_row();
            frappe.model.set_value(d.doctype, d.name, me.dynamic_link_field, me.dynamic_link_reference);
            frappe.model.set_value(d.doctype, d.name, me.fieldname, value);
            frappe.show_alert(__("{0} {1} added", [me.dynamic_link_reference, value]));
        } else {

            var d = me.target.add_new_row();
            frappe.model.set_value(d.doctype, d.name, me.fieldname, value);
            frappe.show_alert(__("{0} added", [value]));
        }
    }
});

frappe.link_search = function(doctype, args, callback, btn) {
    if (!args) {
        args = {
            txt: ''
        }
    }

    args.doctype = doctype;
    if (!args.searchfield) {
        args.searchfield = 'name';
    }
    frappe.call({
        method: "frappe.desk.search.search_widget",
        type: "GET",
        args: args,
        callback: function(r) {
            callback && callback(r);
        },
        btn: btn
    });
}