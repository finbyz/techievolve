from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("Documents"),
			"items": [	
				{
					"type": "doctype",
					"name": "Supplier",
					"label": "Vendor List"
				},
				{
					"type": "doctype",
					"name": "Purchase Order",
					"label": "Purchase Order"
				},
				{
					"type": "doctype",
					"name": "Item",
					"label": "New Purchase Order",
					"link": "Form/Purchase Order/New Purchase Order",
				},
				{
					"type": "report",
					"name": "Vendor Details",
					"label": 'Supplier Wise PO',
					"doctype": "Supplier",
					"is_query_report": True
				},
			]
		},
		{
			"label": _("Category"),
			"items": [	
				{
					"type": "doctype",
					"name": "Item",
					"icon": "fa fa-sitemap",
					"label": _("Item List"),
					"Link": "List/Item",
					"onboard": 1,
				},
				{
					"type": "doctype",
					"name": "Item Group",
					"icon": "fa fa-sitemap",
					"label": _("Category Item List"),
					"link": "group-item-list?item_group=Adhesive Foam Sheets",
					"onboard": 1,
				},
				{
					"type": "doctype",
					"name": "Item Group",
					"icon": "fa fa-sitemap",
					"label": _("Category Tree"),
					"link": "Tree/Item Group",
					"onboard": 1,
				},
			]
		},
		{
			"label": _("Reports"),
			"items": [
				{
					"type": "report",
					"name": "Item Groupwise Stock Balance",
					"doctype": "Item",
					"label":'Category Wise Products',
					"is_query_report": True
				},
				
				{
					"type": "report",
					"name": "Vendor Item List",
					"doctype": "Item",
					"label": "Full Catalog",
					"is_query_report": True
				},
				{
					"type": "report",
					"name": "Stock Ledger",
					"doctype": "Stock Ledger Entry",
					"is_query_report": True
				},
				{
					"type": "report",
					"name": "Disabled Item Report",
					"doctype": "Item",
					"is_query_report": False
				},
				{
					"type": "report",
					"name": "Open Orders",
					"doctype": "Sales Order",
					"is_query_report": False
				},
				{
					"type": "report",
					"name": "JC Item List",
					"doctype": "Item",
					"is_query_report": False
				},
			]
		},
		{
			"label": _("Sales"),
			"items": [
				{
					"type": "doctype",
					"name": "Sales Order",
					"icon": "fa fa-sitemap",
					"label": "Sales Order" ,
				},
				{
					"type": "doctype",
					"name": "Sales Order",
					"icon": "fa fa-sitemap",
					"label":'New Sales Order',
					"link": "Form/Sales Order/New Sales Order",
				}
			]
		}
	]