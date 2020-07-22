from __future__ import unicode_literals
from frappe import _
import frappe


def get_data(data):
	
	data['heatmap'] = True
	data['heatmap_message'] = _('This is based on transactions against this Supplier. See timeline below for details')
	data['fieldname'] = 'supplier'
	data['non_standard_fieldnames'] = {
		'Payment Entry': 'party_name',
		'Bank Account': 'party'
	}
	data['transactions'] = [
		{
			'label': _('Procurement'),
			'items': ['Request for Quotation', 'Supplier Quotation']
		},
		{
			'label': _('Orders'),
			'items': ['Purchase Order', 'Purchase Receipt', 'Purchase Invoice']
		},
		{
			'label': _('Payments'),
			'items': ['Payment Entry']
		},
		{
			'label': _('Bank'),
			'items': ['Bank Account']
		},
		{
			'label': _('Pricing'),
			'items': ['Pricing Rule']
		},
		{
			'label': _('Item'),
			'items': ['Item']
		}
	]
	
	return data
