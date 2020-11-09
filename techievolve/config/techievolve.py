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
					"name": "Discontinued Items",
					"doctype": "Item",
					"is_query_report": False
				},
			]
		}
	]