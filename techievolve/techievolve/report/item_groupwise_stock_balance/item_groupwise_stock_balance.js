// Copyright (c) 2016, Finbyz Tech Pvt Ltd and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.require("assets/erpnext/js/financial_statements.js", function() {
	frappe.query_reports["Item Groupwise Stock Balance"] = {
		"filters": [
			// {
			// 	"fieldname": "company",
			// 	"label": __("Company"),
			// 	"fieldtype": "Link",
			// 	"options": "Company",
			// 	"default": frappe.defaults.get_user_default("Company"),
			// 	"reqd": 1
			// },
		],
		"tree": true,
		"name_field": "item_group",
		"parent_field": "parent_item_group",
		"initial_depth": 1,
		"formatter": function(value, row, column, data, default_formatter) {
			if (column.fieldname=="item_group") {
				value = data.item_group || value;
	
				column.is_tree = true;
			}
	
			value = default_formatter(value, row, column, data);
	
			if (!data.parent_item_group) {
				value = $(`<span>${value}</span>`);
	
				var $value = $(value).css("font-weight", "bold");
				if (data.warn_if_negative && data[column.fieldname] < 0) {
					$value.addClass("text-danger");
				}
	
				value = $value.wrap("<p></p>").parent().html();
			}
	
			return value;
		},
	}
});

function new_qty_details(item_code,item_group, balance_qty, supplier, warehouse, buying_unit_price) {
	let template = `
		<table class="table table-borderless" style="border: 0 !important; font-size:95%;">
			<tr style="border: 0 !important;">
			<td style="border: 0 !important;"><b>Item Group: </b> {{ data['item_group'] }}</td>
			<td style="border: 0 !important;"><b>Supplier: </b> {{ data['supplier'] }}</td>
			</tr>
			<tr style="border: 0 !important;">
			<td style="border: 0 !important;"><b>Available Qty : </b>{{data['balance_qty']}}</td>
			<td style="border: 0 !important;"><b>Warehouse : </b>{{data['warehouse']}}</td>
			</tr>
			<tr style="border: 0 !important;">
			<td style="border: 0 !important;"><input type="float" style="width:50px" id="{{ 'new_qty' }}"></input>
			<td style="border: 0 !important;">
			<button style="margin-left:5px;border:0 !important;color: #fff; background-color: blue; padding: 3px 5px;border-radius: 5px;" type="button" warehouse = "{{ __(data['warehouse']) }}" supplier = "{{ __(data['supplier']) }}" balance_qty = "{{ __(data['balance_qty']) }}" item_code = "{{ __(data['item_code']) }}" buying_unit_price = "{{ __(data['buying_unit_price']) }}" onClick=create_stock_entry(this.getAttribute("warehouse"),this.getAttribute("supplier"),this.getAttribute("item_code"),this.getAttribute("balance_qty"),this.getAttribute("buying_unit_price"),document.getElementById("{{ 'new_qty' }}").value)>Create Stock Entry</button>
			</tr>
		</table>`;
		let message = frappe.template.compile(template)({ 'data': {"item_code":item_code,"item_group":item_group,"balance_qty":balance_qty,"supplier":supplier,"warehouse":warehouse,"buying_unit_price":buying_unit_price} });
		frappe.msgprint({
			message: message,
			title: "Item Code : " + item_code,
			wide: true,
		});
}

function create_stock_entry(warehouse,supplier,item_code,balance_qty,buying_unit_price,new_qty) {
	if ((new_qty) < 0){
		frappe.throw("Please Don't Enter Negative Qty")
	}
	frappe.call({
		method:"techievolve.techievolve.report.item_groupwise_stock_balance.item_groupwise_stock_balance.create_stock_entry",
		args:
		{
			warehouse:warehouse,
			supplier:supplier,
			item_code:item_code,
			balance_qty:balance_qty,
			new_qty:new_qty,
			buying_unit_price:buying_unit_price
		},
		callback:function(r){
			// window.location.reload();
			$(".modal").modal('hide');
			 
		}
	})
}
