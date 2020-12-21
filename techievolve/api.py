import frappe
import json
from frappe.utils import flt
from erpnext.shopping_cart.cart import update_cart
from frappe.desk.search import search_widget
from frappe.utils import cstr, unique, cint

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

@frappe.whitelist()
def search_link(doctype, txt, query=None, filters=None, page_length=20, searchfield=None, reference_doctype=None, ignore_user_permissions=False):
	search_widget(doctype, txt, query, searchfield=searchfield, page_length=page_length, filters=filters, reference_doctype=reference_doctype, ignore_user_permissions=ignore_user_permissions)
	if frappe.response["values"]:
		frappe.response['results'] = build_for_autosuggest(frappe.response["values"])
		del frappe.response["values"]

def build_for_autosuggest(res):
	results = []
	description = []
	for r in res:
		for idx, value in enumerate(r):
			if idx == 0:
				out = {"value": value}
			elif str(value).find("<img") != -1:
				out.update({"image": value})
			else:
				description.append(value)
			out.update({"description": ", ".join(unique(cstr(d) for d in description if d))})
		results.append(out)
	return results