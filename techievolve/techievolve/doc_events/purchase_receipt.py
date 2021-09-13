import frappe
from frappe.utils import flt

def validate(self,method):
    for row in self.items:
        if row.unit_buying_price:
            row.rate = flt(row.unit_buying_price * row.case_qty)