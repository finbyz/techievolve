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
					"label": " Supplier Wise Products "
				},
			]
		},
		{
			"label": _("Category"),
			"items": [	
				{
					"type": "doctype",
					"name": "Item Group",
					"icon": "fa fa-sitemap",
					"label": _("Category"),
					"link": "Tree/Item Group",
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
					"name": "Vendor Details",
					"label": 'Supplier Wise PO',
					"doctype": "Supplier",
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
					"name": "Discontinued Item Report",
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
		}
	]