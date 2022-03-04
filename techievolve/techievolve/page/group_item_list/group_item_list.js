{ /* <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${frappe.format(item.unit_selling_price, { fieldtype: 'Currency', options: 'currency' }, { inline: true })}</td> */ }
var pathArray = window.location.href.split('?item_group=')[1];
var item_group = pathArray.replaceAll("%20", " ");


frappe.pages['group-item-list'].on_page_load = function(wrapper) {
    new MyPage(wrapper);
}
MyPage = Class.extend({
            init: function(wrapper) {
                this.page = frappe.ui.make_app_page({
                    parent: wrapper,
                    title: "Group Item List",
                    single_column: true,
                });
                // make page 
                this.make();
            },
            make: function() {
                    let me = $(this);
                    let body = `
			<body id="group_items">
		<style>
		.octicon_number_button{
			height: 40px !important;
		}
		#item_group_table .octicon-arrow-up:before{
			content: " ↑" !important;
			
		}
		#item_group_table .octicon-arrow-down:before{
			content: " ↓" !important;
		}
		
		</style>
			<div class="popup-inner" style="display: block;width: 100%;box-shadow: 0 0 14px #bbb9b9;border-radius: 10px;">
				<div style="display: block;width: 100%;">
					<div style="display: flex;width: 50%;float: left;padding: 0 15px; ">
						<p style="font-weight: 700;color: #1581E1;font-size: 24px;">Category Name:</p>
						<select style="width: 170px;height: 40px;color: #333;font-size: 16px;line-height: 50px;margin-top: 15px; margin-left: 15px; padding: 0 10px;" name="Category" id="Category" onchange="redirect_other(event)">
								${frappe.call({
									method : 'techievolve.api.get_groupwise_items',
									callback: function(res){
										select = document.getElementById('Category');
										res.message.forEach((r,i)=>{
												var opt = document.createElement('option');
												opt.value = r.replaceAll('&#160;','');
												opt.innerHTML = `${r}`;
												if(item_group == opt.value){
													opt.setAttribute('selected', true);
													document.getElementById("itemgroup").setAttribute("item_group", res.message[i].name) 
												}
												select.appendChild(opt);
										})		
									}
								})}
							</select>
					</div>
					<div style="display: block;width: 40%;float: left; padding: 0 15px;padding-right: 0;">
						<div style="display: block;width: 30%;float: left;padding: 0 15px;">&nbsp; </div>	
						<div style="display: block;float: left;padding: 0 15px;">
							<select style="width: 170px;height: 40px;color: #333;font-size: 16px;line-height: 50px;margin-top: 18px;padding: 0 10px;" name="cat" id="cat" onchange="set_item_group(event)">
								${frappe.call({
									method : 'techievolve.api.get_groupwise_items',
									callback: function(res){
										select = document.getElementById('cat');
										res.message.forEach((r,i)=>{
												var opt = document.createElement('option');
												opt.value = r.replaceAll('&#160;','');
												opt.innerHTML = `${r}`;
												if( item_group == opt.value ){
													opt.setAttribute('selected', true);
													document.getElementById("itemgroup").setAttribute("item_group", res.message[i].name) 
												}
												select.appendChild(opt);
										})		
									}
								})}
							</select>
						</div>				
						<div style="display: flex; width: 26%; margin-left: 10px; float: left;padding: 0 15px;">
							<button id="move_button" style="display: block;background-color: #1581E1;color: #fff;font-size: 18px;text-transform: uppercase;height: 40px;line-height: 40px;padding: 0 18px;font-weight: bold;border: none;margin-top: 19px;" onclick="move_functionality()" >Move</button>
							<button id="move_button" style="display: block;background-color: #1581E1;color: #fff;font-size: 18px;text-transform: uppercase;height: 40px;line-height: 40px;padding: 0 18px;font-weight: bold;border: none;margin-top: 19px; margin-left: 10px;" onclick="Update_functionnality()" >Update</button>
							<input id="itemgroup" type="hidden" >
						</div>
						<div style="clear: both;"></div>				
					</div>
					<span style="clear: both;"></span>
				</div>
				<div style="display: block;width: 100%; padding: 10px;">
					<table style=" border-collapse: collapse;width: 100%;" id="item_group_table">
						<tr>
							<th style="border: 1px solid #dddddd; text-align: left;padding: 8px;"><input type="checkbox" id="checkAll"  onClick="checkAll()"></th>
							<th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Image</th>
							<th style="border-top: 1px solid #dddddd; text-align: left;padding: 8px; display: flex; justify-content: space-between;">
								<p>Product Name </p>
								<button class="btn btn-default btn-xs btn-order" onClick="sorting_button(event);" >
									<span class="octicon text-muted octicon-arrow-up"></span>
								</button>
							</th>
							<th width="4%" style="border: 1px solid #dddddd;">
							<div class="d-flex justify-content-between">
								<span>Sort Ord</span>
								<button class="btn btn-default octicon_number_button btn-xs btn-order" onClick="sort_button_qty(event);" >
									<span class="octicon_number text-muted octicon-arrow-up"></span>
								</button>
							</div>
							</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Case Qty</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Master Case Qty</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Shelf Location</th>
							<th  width="5%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Unit Selling Price</th>
							<th  width="5%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Unit Byuing Price</th>
							<th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">In Stock</th>
							<th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Item No</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Vendor Item No</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Cost</th>
						</tr>
					</table>
				</div>
			</div>
		</body>
		${frappe.call({
			method : 'techievolve.api.get_category_item',
				args:{
					"item_group": item_group
				},
				callback: function(res,i){
					
						var main_tab = '<table><tbody>';
						var close_main_temp = '</tbody></table>';
						var temp_div = document.createElement('div');
						res.message.sort((a, b) => parseFloat(a.sort_ord) - parseFloat(b.sort_ord));
						res.message.forEach((item,i)=>{
							var html_to_insert = `<tr class="desc_num" data-id="${item.sort_ord}">
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><a href="#Form/Item/${ item.item_code }" >${ item.item_name }</a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number"  id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname" value="${ item.shelf_location } " style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;" > ${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.valuation_rate }</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						})
						res.message.sort((a, b) => parseFloat(b.sort_ord) - parseFloat(a.sort_ord));
						res.message.forEach((item,i)=>{
							var html_to_insert = `<tr class="asc_num"  style="display:none;"  data-id="${item.sort_ord}"> 
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }" /></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><a href="#Form/Item/${ item.item_code }" >${ item.item_name } </a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number" id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname"  value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.valuation_rate }</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						
						})
					
						res.message.sort(dynamicSort("item_name"));
						res.message.forEach((item,i)=>{
							var html_to_insert = `<tr class="asc" style="display:none;" data-id="${item.sort_ord}"> 
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><a href="#Form/Item/${ item.item_code }" >${ item.item_name } </a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number" id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname"  value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.valuation_rate }</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						
						})
						res.message.sort(dynamicSort("-item_name"));
						res.message.forEach((item,i)=>{
							var html_to_insert = `<tr class="desc" style="display:none;" data-id="${item.sort_ord}">
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><a href="#Form/Item/${ item.item_code }" >${ item.item_name }</a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number"  id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname" value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;" > ${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.valuation_rate }</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
							
							
						})
						
				}
		})}
		`
			$(frappe.render_template(body,this)).appendTo(this.page.main)
		}
		
	})
	function set_item_group(e) {
		document.getElementById("itemgroup").setAttribute("item_group", e.target.value) 
	}
	function redirect_other(e){
		window.location.href = `https://dk.techievolve.com/desk#group-item-list?item_group=${e.target.value}`;
		window.location.reload();
	}
	function sorting_button(e){
		if ($('.octicon').hasClass("octicon-arrow-up")){
			$('.octicon').addClass('octicon-arrow-down')
			$('.octicon').removeClass('octicon-arrow-up')
			$('.asc').css("display", "none");
			$('.desc').removeAttr("style")
			$('.desc_num').css("display", "none");
			$('.asc_num').css("display", "none");
		}else{
			$('.octicon').addClass('octicon-arrow-up')
			$('.octicon').removeClass('octicon-arrow-down')
			$('.desc').css("display", "none");
			$('.asc').removeAttr("style")
			$('.desc_num').css("display", "none");
			$('.asc_num').css("display", "none");
		}
	}
	function sort_button_qty(e){
		if ($('.octicon_number').hasClass("octicon-arrow-up")){
			console.log('up')
			$('.octicon_number').addClass('octicon-arrow-down')
			$('.octicon_number').removeClass('octicon-arrow-up')
			$('.asc_num').removeAttr("style");
			$('.desc_num').css("display", "none");
			$('.asc').css("display", "none");
			$('.desc').css("display", "none");
		}else{
			console.log('down')
			$('.octicon_number').addClass('octicon-arrow-up')
			$('.octicon_number').removeClass('octicon-arrow-down')
			$('.asc_num').css("display", "none");
			$('.desc_num').removeAttr("style");
			$('.desc').css("display", "none");
			$('.asc').css("display", "none");
		}
	}

	function dynamicSort(property) {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a,b) {
			if(sortOrder == -1){
				return b[property].localeCompare(a[property]);
			}else{
				return a[property].localeCompare(b[property]);
			}        
		}
	}
	
	var selected = new Array();
	function checkAll(){
		var $checkboxes  = $('#item_group_table td').find(':checkbox')
		if (document.getElementById("checkAll").checked){
			$checkboxes.prop('checked', ':checked')
		}else{
			$checkboxes.prop('checked', false)
		}
	}
	  
	function move_functionality(){
		frappe.confirm('Are you sure you want to Change Category?',
			() => {
				var item_group = document.getElementById("itemgroup").getAttribute("item_group")
				$('#item_group_table td input:checked').each(function() {
					selected.push(this.id);
				});
				frappe.call({
					method : 'techievolve.api.change_item_group',
					args:{
						"item_group": item_group,
						"item" : selected
					},
					callback: function(res){
						frappe.msgprint({
							title: __('Catagory has changed'),
							message: __('Item(s) moved to new category'),
							primary_action:{
								action(values) {
									window.location.reload();
								}
							}
						});
					}
				})
			},
			() => {}
		)
	}
	
	function change_sort_order(val,values) {
		document.getElementById(val).value=values ; 
		var id_checkbox = val.replace("_sort_ord", "");
		document.getElementById(id_checkbox).checked = true;
	}
	function change_shelf_location(val,values) {
		document.getElementById(val).value=values ; 
		var id_checkbox = val.replace("_shelf_location", "");
		document.getElementById(id_checkbox).checked = true;
	}
	var selecte_for_change = []
	
	function Update_functionnality(){
		$('#item_group_table td input:checked').each(function() {
		
			item = {}
			item["item_code"] = this.id;
			item["shelf_location"] = $(`#${this.id}_shelf_location`).val();
			item["sort_ord"] = $(`#${this.id}_sort_ord`).val();
			var index = selecte_for_change.findIndex(x => x.item_code == selecte_for_change.item_code)
			if (index === -1) {
				selecte_for_change.push(item);
			}
			
		});
		frappe.call({
			method : 'techievolve.api.update_ietm_shelf_location',
			args:{
				item_list:selecte_for_change,
			},
			callback: function(res){
				frappe.msgprint({
					title: __('Message'),
					message: __('shelf life and sort Ord are updated'),
					primary_action:{
						action(values) {
							window.location.reload();
						}
					}
				});
			
			}
		})
		
	}