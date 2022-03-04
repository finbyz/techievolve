
frappe.provide("frappe.treeview_settings")
frappe.treeview_settings["Item Group"] = {
	toolbar: [
		{
			label:__("Show Items"),
			condition: function(node) {
				return !node.expandable
			},
			click: function(node) {
				window.open(`https://dk.techievolve.com/desk#group-item-list?item_group=${node.title}`, "_blank")
            },
			btnClass: "hidden-xs"
		}
	],
	extend_toolbar: true
}