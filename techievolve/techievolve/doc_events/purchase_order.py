import frappe
from frappe.utils import flt

def validate(self,method):
	for item in self.items:
		item.barcode = frappe.db.get_value("Item Barcode",{"parent":item.item_code},"barcode")
		reorder_details = frappe.db.get_value("Item Reorder",{"parent":item.item_code},
					["warehouse_reorder_level","warehouse_reorder_qty"], as_dict = 1)
		
		if not item.reorder_level:
			item.reorder_level = flt(reorder_details.warehouse_reorder_level)
		
		if not item.reorder_qty:
			item.reorder_qty = flt(reorder_details.warehouse_reorder_qty)

		if item.warehouse:
			item.actual_stock_qty = flt(frappe.db.get_value("Bin", {"item_code": item.item_code, "warehouse": item.warehouse}, "actual_qty"))

		if item.unit_buying_price:
			item.rate = flt(item.unit_buying_price * item.case_qty)

def on_submit(self,method):
	update_reorder_details(self)

def on_update_after_submit(self, method):
	update_reorder_details(self)

def update_reorder_details(self):
	for row in self.items:
		item_reorder_name = frappe.db.get_value("Item Reorder",{"parent":row.item_code},"name")
		if item_reorder_name:
			frappe.db.set_value("Item Reorder",{"parent":row.item_code},"warehouse_reorder_level", flt(row.reorder_level))
			frappe.db.set_value("Item Reorder",{"parent":row.item_code},"warehouse_reorder_qty", flt(row.reorder_qty))