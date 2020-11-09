import frappe
import json
from frappe.utils import flt
from erpnext.shopping_cart.cart import update_cart

@frappe.whitelist()
def update_cart_custom(item_data=[],ignore_permissions=True):
	item_list = json.loads(item_data)
	for d in item_list:
		result = update_cart(d['item_code'],flt(d['qty']))
	return result


def quotation_before_validate(self,method):
	get_price_list(self)

def get_price_list(self):
	for row in self.items:
		row.price_list_rate = row.stock_qty * frappe.db.get_value("Item Price",{'item_code':row.item_code,'price_list':self.selling_price_list,'selling':1},'price_list_rate')