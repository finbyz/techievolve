frappe.provide("frappe.treeview_settings")
frappe.treeview_settings["Item Group"] = {
    toolbar: [{
            label: __("Show Items"),
            condition: function(node) {
                return !node.expandable
            },
            click: function(node) {
                window.open(`https://dk.techievolve.com/desk#group-item-list?item_group=${node.title}`, "_blank")
            },
            btnClass: "hidden-xs"
        },
        {
            label: __("Delete"),
            condition: function(node) { return !node.is_root && frappe.model.can_delete('Item Group'); },
            click: function(node) {
                frappe.prompt({
                    label: 'Category Delete Password',
                    fieldname: 'data',
                    fieldtype: 'Data'
                }, (values) => {
                    frappe.call({
                        method: 'techievolve.api.get_default_password',
                        args: {
                            field: 'item_delete_password',
                        },
                        callback: function(res) {
                            if (res.message == values.data) {
                                frappe.model.delete_doc('Item Group', node.label, function() {
                                    node.parent.remove();
                                });
                            } else {
                                frappe.throw("Password is Incorrect")
                            }
                        }
                    })
                })
            },
            btnClass: "hidden-xs"
        }
    ],
    extend_toolbar: true
}