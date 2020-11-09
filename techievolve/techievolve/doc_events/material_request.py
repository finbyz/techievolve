from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt

def before_validate(self,method):
	if self.material_request_type in ["Purchase"]:
		for item in self.items:
			if not item.rate:
				rate = frappe.db.get_value("Item Price",{"item_code":item.item_code,"buying":1},"price_list_rate")
				if rate:
					item.db_set('rate',rate)
					item.db_set('amount',rate * item.qty)
			if not item.supplier:
				supplier = frappe.db.get_value("Item Supplier",{"parent":item.item_code},"supplier")
				if supplier:
					item.db_set('supplier',supplier)