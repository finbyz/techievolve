import frappe
from erpnext.shopping_cart.cart import update_cart

@frappe.whitelist()
def update_cart_custom(item_data=[{'item_code':'99464GL','qty':5}]):
    for d in item_data:
        update_cart(d['item_code'],d['qty'])