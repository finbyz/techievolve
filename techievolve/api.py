import frappe
import json
from frappe.utils import flt
from erpnext.shopping_cart.cart import update_cart
from frappe.desk.search import search_widget
from frappe.utils import cstr, unique, cint
from frappe import _

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


@frappe.whitelist()
def place_order(payment_method=None):
	from erpnext.shopping_cart.cart import _get_cart_quotation
	from erpnext.utilities.product import get_qty_in_stock
	
	quotation = _get_cart_quotation()
	cart_settings = frappe.db.get_value("Shopping Cart Settings", None,
		["company", "allow_items_not_in_stock"], as_dict=1)
	quotation.company = cart_settings.company

	quotation.flags.ignore_permissions = True
	quotation.submit()

	if quotation.quotation_to == 'Lead' and quotation.party_name:
		# company used to create customer accounts
		frappe.defaults.set_user_default("company", quotation.company)

	if not (quotation.shipping_address_name or quotation.customer_address):
		frappe.throw(_("Set Shipping Address or Billing Address"))

	from erpnext.selling.doctype.quotation.quotation import _make_sales_order
	sales_order = frappe.get_doc(_make_sales_order(quotation.name, ignore_permissions=True))
	sales_order.payment_schedule = []
	sales_order.payment_method = payment_method

	if not cint(cart_settings.allow_items_not_in_stock):
		for item in sales_order.get("items"):
			item.reserved_warehouse, is_stock_item = frappe.db.get_value("Item",
				item.item_code, ["website_warehouse", "is_stock_item"])

			if is_stock_item:
				item_stock = get_qty_in_stock(item.item_code, "website_warehouse")
				if not cint(item_stock.in_stock):
					frappe.throw(_("{0} Not in Stock").format(item.item_code))
				if item.qty > item_stock.stock_qty[0][0]:
					frappe.throw(_("Only {0} in Stock for item {1}").format(item_stock.stock_qty[0][0], item.item_code))

	sales_order.flags.ignore_permissions = True
	sales_order.insert()
	sales_order.submit()

	if hasattr(frappe.local, "cookie_manager"):
		frappe.local.cookie_manager.delete_cookie("cart_count")

	return sales_order.name


from frappe.website.utils import is_signup_enabled
from frappe.utils import escape_html

@frappe.whitelist(allow_guest=True)
def sign_up(email, full_name, tax_id, redirect_to):
	if not is_signup_enabled():
		frappe.throw(_('Sign Up is disabled'), title='Not Allowed')

	user = frappe.db.get("User", {"email": email})
	if user:
		if user.disabled:
			return 0, _("Registered but disabled")
		else:
			return 0, _("Already Registered")
	else:
		if frappe.db.sql("""select count(*) from tabUser where
			HOUR(TIMEDIFF(CURRENT_TIMESTAMP, TIMESTAMP(modified)))=1""")[0][0] > 300:

			frappe.respond_as_web_page(_('Temporarily Disabled'),
				_('Too many users signed up recently, so the registration is disabled. Please try back in an hour'),
				http_status_code=429)

		from frappe.utils import random_string
		user = frappe.get_doc({
			"doctype":"User",
			"email": email,
			"first_name": escape_html(full_name),
			"enabled": 1,
			"new_password": random_string(10),
			"bio": tax_id
		})
		user.flags.ignore_permissions = True
		user.flags.ignore_password_policy = True
		user.insert()

		# set default signup role as per Portal Settings
		default_role = frappe.db.get_value("Portal Settings", None, "default_role")
		if default_role:
			user.add_roles(default_role)

		if redirect_to:
			frappe.cache().hset('redirect_after_login', user.name, redirect_to)

		from erpnext.shopping_cart.cart import get_debtors_account
		from frappe.utils.nestedset import get_root_of
		from erpnext.shopping_cart.doctype.shopping_cart_settings.shopping_cart_settings import get_shopping_cart_settings

		user = frappe.get_doc("User",{'email':email,'first_name':escape_html(full_name)})
		
		if frappe.db.get_value('User', user.name, 'user_type') != 'Website User':
			return

		user_roles = frappe.get_roles()
		portal_settings = frappe.get_single('Portal Settings')
		default_role = 'Customer' #finbyz change
		if default_role not in ['Customer', 'Supplier']:
			return

		# create customer / supplier if the user has that role
		# if portal_settings.default_role:
		# 	doctype = portal_settings.default_role
		# else:
		# 	doctype = None

		# if not doctype:
		# 	return
		doctype = "Customer" # finbyz chnage

		fullname = frappe.utils.get_fullname(user.name)
		if party_exists(doctype, user.name):
			return

		party = frappe.new_doc(doctype)

		if doctype == 'Customer':
			cart_settings = get_shopping_cart_settings()

			if cart_settings.enable_checkout:
				debtors_account = get_debtors_account(cart_settings)
			else:
				debtors_account = ''

			party.update({
				"customer_name": fullname,
				"customer_type": "Individual",
				"customer_group": cart_settings.default_customer_group,
				"territory": get_root_of("Territory"),
				"tax_id": user.bio
			})

			if debtors_account:
				party.update({
					"accounts": [{
						"company": cart_settings.company,
						"account": debtors_account
					}]
				})
		else:
			party.update({
				"supplier_name": fullname,
				"supplier_group": "All Supplier Groups",
				"supplier_type": "Individual"
			})

		party.flags.ignore_mandatory = True
		party.insert(ignore_permissions=True)
		if frappe.db.exists("Contact",{'user':user.name}):
			contact = frappe.get_doc("Contact",{'user':user.name})
		else:
			contact = frappe.new_doc("Contact")
		contact.update({
			"first_name": fullname,
			"user": user.name #finbyz
		})
		#finbyz change
		if contact.email_ids[0].email_id != user.name:
			contact.append('email_ids',dict(email_id=user.name))
		contact.append('links', dict(link_doctype=doctype, link_name=party.name))
		contact.flags.ignore_mandatory = True
		contact.insert(ignore_permissions=True)
		user.flags.email_sent = 1
		if user.flags.email_sent:
			return 1, _("Please check your email for verification")
		else:
			return 2, _("Please ask your administrator to verify your sign-up")

def create_customer_or_supplier():
	pass
# 	'''Based on the default Role (Customer, Supplier), create a Customer / Supplier.
# 	Called on_session_creation hook.
# 	'''
# 	from erpnext.shopping_cart.cart import get_debtors_account
# 	from frappe.utils.nestedset import get_root_of
# 	from erpnext.shopping_cart.doctype.shopping_cart_settings.shopping_cart_settings import get_shopping_cart_settings

# 	user = frappe.session.user

# 	if frappe.db.get_value('User', user, 'user_type') != 'Website User':
# 		return

# 	user_roles = frappe.get_roles()
# 	portal_settings = frappe.get_single('Portal Settings')
# 	default_role = portal_settings.default_role

# 	if default_role not in ['Customer', 'Supplier']:
# 		return

# 	# create customer / supplier if the user has that role
# 	if portal_settings.default_role and portal_settings.default_role in user_roles:
# 		doctype = portal_settings.default_role
# 	else:
# 		doctype = None

# 	if not doctype:
# 		return

# 	if party_exists(doctype, user):
# 		return

# 	party = frappe.new_doc(doctype)
# 	fullname = frappe.utils.get_fullname(user)

# 	if doctype == 'Customer':
# 		cart_settings = get_shopping_cart_settings()

# 		if cart_settings.enable_checkout:
# 			debtors_account = get_debtors_account(cart_settings)
# 		else:
# 			debtors_account = ''

# 		party.update({
# 			"customer_name": fullname,
# 			"customer_type": "Individual",
# 			"customer_group": cart_settings.default_customer_group,
# 			"territory": get_root_of("Territory"),
# 			"tax_id": frappe.db.get_value("User",user,'bio')
# 		})

# 		if debtors_account:
# 			party.update({
# 				"accounts": [{
# 					"company": cart_settings.company,
# 					"account": debtors_account
# 				}]
# 			})
# 	else:
# 		party.update({
# 			"supplier_name": fullname,
# 			"supplier_group": "All Supplier Groups",
# 			"supplier_type": "Individual"
# 		})

# 	party.flags.ignore_mandatory = True
# 	party.insert(ignore_permissions=True)

# 	contact = frappe.new_doc("Contact")
# 	contact.update({
# 		"first_name": fullname,
# 		"email_id": user
# 	})
# 	contact.append('links', dict(link_doctype=doctype, link_name=party.name))
# 	contact.flags.ignore_mandatory = True
# 	contact.insert(ignore_permissions=True)

# 	return party


def party_exists(doctype, user):
	contact_name = frappe.db.get_value("Contact", {"email_id": user})

	if contact_name:
		contact = frappe.get_doc('Contact', contact_name)
		doctypes = [d.link_doctype for d in contact.links]
		return doctype in doctypes

	return False

def po_validate(self,method):
	for item in self.items:
		item.barcode = frappe.db.get_value("Item Barcode",{"parent":item.item_code},"barcode")