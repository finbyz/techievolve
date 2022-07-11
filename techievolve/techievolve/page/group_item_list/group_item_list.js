{ /* <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${frappe.format(item.unit_selling_price, { fieldtype: 'Currency', options: 'currency' }, { inline: true })}</td> */ }
var pathArray = window.location.href.split('?item_group=')[1];
pathArray = pathArray.replaceAll("%20", " ");
var discontinued_items = 0;
var search_box_data = '';
if (pathArray.search("&discontinued_items=") >= 0 && pathArray.search("&search_box=") >= 0) {
    discontinued_items = pathArray.split("&discontinued_items=")[1]
    search_box_data = discontinued_items.split("&search_box=")[1]
    discontinued_items = discontinued_items.split("&search_box=")[0]
    pathArray = pathArray.split("&discontinued_items=")[0]
}
var item_group = pathArray

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
					<div style="display: flex;width: 55%;float: left;padding: 0 15px;margin-bottom: 15px; ">
						<p style="font-weight: 700;color: #1581E1;font-size: 18px;line-height: 45px;">Category Name:</p>
						<select style="width: 33%;height: 40px;color: #333;font-size: 14px;line-height: 40px;margin-top: 15px;margin-left: 15px;padding: 0;text-align: left;" name="Category" id="Category" onchange="redirect_other(event)">
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
										var discontinued_items_show = document.getElementById("discontinued_items_show");
										var discontinued_items_hide = document.getElementById("discontinued_items_hide");
										if (discontinued_items == 1) {
											discontinued_items_hide.removeAttribute("hidden");
											discontinued_items_show.setAttribute("hidden", "hidden");
										} else {
											discontinued_items_show.removeAttribute("hidden");
											discontinued_items_hide.setAttribute("hidden", "hidden");
										}
			
									}
								})}
							</select>
							<div style="height: 40px;color: #333;font-size: 14px;line-height: 40px;margin-top: 15px;margin-left: 15px;padding: 0;text-align: left;">
								<button type="button" id="discontinued_items_show" name="discontinued_items_show" style="font-size:12px;;background-color: #1581E1;color: #fff;font-weight: bold;border: none;">Discontinued Items</button>&nbsp;
								<button type="button" id="discontinued_items_hide" name="discontinued_items_hide" hidden style="font-size:12px;;background-color: #1581E1;color: #fff;font-weight: bold;border: none;">Show All Items</button>&nbsp;
								<input type="text" id="search_box" name="search_box" style="width:120px;font-size: 14px;height: 40px;" placeholder="Search">
							</div>
					</div>
					<div style="display: block;width: 45%;float: left; padding: 0 15px;padding-right: 0;margin-bottom: 15px;">
								
						<div style="display: block;float: left;padding: 0 15px;width: 68%;">
							<select style="width: 52%;height: 40px;color: #333;font-size: 14px;line-height: 50px;margin-top: 18px;padding: 0px;float: right;" name="cat" id="cat" onchange="set_item_group(event)">
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
						<div style="display: flex; width: 25%; margin-left: 0px; float: left;padding: 0 15px;">
							<button id="move_button" style="display: block;background-color: #1581E1;color: #fff;font-size: 15px;text-transform: uppercase;height: 40px;line-height: 40px;padding: 0 15px;font-weight: bold;border: none;margin-top: 19px;margin-right: 3px;" onclick="move_functionality()" >Move</button>
							<button id="move_button" style="display: block;background-color: #1581E1;color: #fff;font-size: 15px;text-transform: uppercase;height: 40px;line-height: 40px;padding: 0 15px;font-weight: bold;border: none;margin-top: 19px;" onclick="Update_functionnality()" >Update</button>
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
							<th width="4%" style="border: 1px solid #dddddd;">
							<div class="d-flex justify-content-between">
								<span>Sort Ord</span>
								<button class="btn btn-default octicon_number_button btn-xs btn-order" onClick="sort_button_qty(event);" >
									<span class="octicon_number text-muted octicon-arrow-up"></span>
								</button>
							</div>
							</th>
							<th style="border-top: 1px solid #dddddd;text-align: left;padding: 8px;display: flex;justify-content: space-between;">
								<p style="margin: 0;padding-top: 20px;">Product Name </p>
								<button style="margin-top: 12px;" class="btn btn-default btn-xs btn-order" onClick="sorting_button(event);" >
									<span class="octicon text-muted octicon-arrow-up"></span>
								</button>
							</th>
							<th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Item No</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Vendor Item No</th>
							<th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">In Stock</th>
							<th  width="5%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Unit Byuing Price</th>
							<th  width="5%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Unit Selling Price</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Case Qty</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Master Case Qty</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Shelf Location</th>
							<th width="7%" style="border: 1px solid #dddddd;text-align: left;padding: 8px;"></th>
						</tr>
					</table>
				</div>
			</div>
		</body>
		${
			
			frappe.call({
			method : 'techievolve.api.get_category_item',
				args:{
					"item_group": item_group,
					"discontinued": discontinued_items,
					"search_box_data": search_box_data
				},
				callback: function(res,i){
					
						var main_tab = '<table><tbody>';
						var close_main_temp = '</tbody></table>';
						var temp_div = document.createElement('div');
						// var checkbox_value = document.querySelector('input[value="discontinued_items_checked"]');
						var discontinued_items_show = document.getElementById("discontinued_items_show");
						var discontinued_items_hide = document.getElementById("discontinued_items_hide");
						var search_box_value = search_box_data;
						var search_b_object = document.getElementById("search_box");
						if (search_box_data){
							search_b_object.value = search_box_data
						}
						
						// if (discontinued_items == 1){
						// 	checkbox_value.checked = 1
						// }
						// else{
						// 	checkbox_value.checked = null
						// }
						document.getElementById("search_box").addEventListener("keyup", function(evt) {
							evt.preventDefault();
							if (evt.keyCode === 13) {
								search_box_value = evt.target.value
								redirect_discontinued_items_search(item_group, discontinued_items, search_box_value)
							}
						});

						// checkbox_value.addEventListener('change', () => {
						// 	if(checkbox_value.checked) {
						// 		redirect_discontinued_items_search(item_group, 1, search_box_value)
						// 	} else {
						// 		redirect_discontinued_items_search(item_group, null, search_box_value)
						// 	}
						//   });
						
						discontinued_items_show.addEventListener('click', () => {
							// if(checkbox_value.checked) {
							// 	redirect_discontinued_items_search(item_group, 1, search_box_value)
							// } else {
							// 	redirect_discontinued_items_search(item_group, null, search_box_value)
							// }
							redirect_discontinued_items_search(item_group, 1, search_box_value)
						  });

						  discontinued_items_hide.addEventListener('click', () => {
							// if(checkbox_value.checked) {
							// 	redirect_discontinued_items_search(item_group, 1, search_box_value)
							// } else {
							// 	redirect_discontinued_items_search(item_group, null, search_box_value)
							// }
							redirect_discontinued_items_search(item_group, 0, search_box_value)
						  });

						res.message.sort((a, b) => parseFloat(a.sort_ord) - parseFloat(b.sort_ord));
						res.message.forEach((item,i)=>{
							if (item.disabled){
								color = "#ff0000"
							}
							else{
								color = "#36414C"
							}
							var html_to_insert = `<tr class="desc_num" data-id="${item.sort_ord}">
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number"  id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px; color: ${color}"><a href="#Form/Item/${ item.item_code }" > <span style="color:${color}">${ item.item_name }</span></a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;" > ${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname" value="${ item.shelf_location } " style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">
								<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;' 
								type='button' item-code='${item.item_code}' item-group='${item.item_group}' balance_qty='${item.actual_qty}' supplier='${item.supplier}' warehouse='${item.website_warehouse}' buying_unit_price='${ item.unit_buying_price }'
								onClick='new_qty_details(this.getAttribute("item-code"),this.getAttribute("item-group"),this.getAttribute("balance_qty"),this.getAttribute("supplier"),this.getAttribute("warehouse"),this.getAttribute("buying_unit_price"))'>Change Qty</button>
							</td>
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						})
						res.message.sort((a, b) => parseFloat(b.sort_ord) - parseFloat(a.sort_ord));
						res.message.forEach((item,i)=>{
							if (item.disabled){
								color = "#ff0000"
							}
							else{
								color = "#36414C"
							}
							var html_to_insert = `<tr class="asc_num"  style="display:none;"  data-id="${item.sort_ord}"> 
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }" /></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number" id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><a href="#Form/Item/${ item.item_code }" > <span style="color:${color}">${ item.item_name }</span> </a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname"  value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">
								<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;' 
								type='button' item-code='${item.item_code}' item-group='${item.item_group}' balance_qty='${item.actual_qty}' supplier='${item.supplier}' warehouse='${item.website_warehouse}' buying_unit_price='${ item.unit_buying_price }'
								onClick='new_qty_details(this.getAttribute("item-code"),this.getAttribute("item-group"),this.getAttribute("balance_qty"),this.getAttribute("supplier"),this.getAttribute("warehouse"),this.getAttribute("buying_unit_price"))'>Change Qty</button>
							</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						
						})
					
						res.message.sort(dynamicSort("item_name"));
						res.message.forEach((item,i)=>{
							if (item.disabled){
								color = "#ff0000"
							}
							else{
								color = "#36414C"
							}
							var html_to_insert = `<tr class="asc" style="display:none;" data-id="${item.sort_ord}"> 
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number" id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px; color: ${color}"><a href="#Form/Item/${ item.item_code }" ><span style="color:${color}">${ item.item_name }</span> </a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname"  value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">
								<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;' 
								type='button' item-code='${item.item_code}' item-group='${item.item_group}' balance_qty='${item.actual_qty}' supplier='${item.supplier}' warehouse='${item.website_warehouse}' buying_unit_price='${ item.unit_buying_price }'
								onClick='new_qty_details(this.getAttribute("item-code"),this.getAttribute("item-group"),this.getAttribute("balance_qty"),this.getAttribute("supplier"),this.getAttribute("warehouse"),this.getAttribute("buying_unit_price"))'>Change Qty</button>
							</td>
							
							</tr>`;
							temp_div.innerHTML = main_tab + html_to_insert + close_main_temp;
							document.getElementById("item_group_table").append(temp_div.firstChild.firstChild.firstChild)
							temp_div.removeChild(temp_div.firstChild);
						
						})
						res.message.sort(dynamicSort("-item_name"));
						res.message.forEach((item,i)=>{
							if (item.disabled){
								color = "#ff0000"
							}
							else{
								color = "#36414C"
							}
							var html_to_insert = `<tr class="desc" style="display:none;" data-id="${item.sort_ord}">
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input class="get_item_code" type="checkbox" id="${ item.item_code }" name="${item.item_name }"/></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><img src="${ item.image }" style="height: 80px;"/> </td>
							
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input  type="number"  id="${item.item_code}_sort_ord" name="fname"  value="${item.sort_ord}" style="width: 80px;" onchange="change_sort_order(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px; color: ${color}"><a href="#Form/Item/${ item.item_code }" ><span style="color:${color}">${ item.item_name }</span></a></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.item_code }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.supplier_part_no }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;" > ${item.actual_qty} ${item.stock_uom}</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_buying_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.unit_selling_price }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${ item.master_case_qty }</td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"><input type="text" id="${item.item_code}_shelf_location" name="fname" value="${ item.shelf_location }" style="width: 80px;" onchange="change_shelf_location(this.id,this.value); this.oldvalue = this.value;" onfocus="this.oldvalue = this.value;"></td>
							<td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">
								<button style='margin-left:5px;border:none;color: #fff; background-color: #5e64ff; padding: 3px 5px;border-radius: 5px;' 
								type='button' item-code='${item.item_code}' item-group='${item.item_group}' balance_qty='${item.actual_qty}' supplier='${item.supplier}' warehouse='${item.website_warehouse}' buying_unit_price='${ item.unit_buying_price }'
								onClick='new_qty_details(this.getAttribute("item-code"),this.getAttribute("item-group"),this.getAttribute("balance_qty"),this.getAttribute("supplier"),this.getAttribute("warehouse"),this.getAttribute("buying_unit_price"))'>Change Qty</button>
							</td>
							
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
	function set_searchbox_data(e){
		document.getElementById("search_box").setAttribute("search_box", e.target.value) 
	}
	function set_item_group(e) {
		document.getElementById("itemgroup").setAttribute("item_group", e.target.value) 
	}
	function redirect_other(e){
		window.location.href = `https://dk.techievolve.com/desk#group-item-list?item_group=${e.target.value}`;
		window.location.reload();
	}
	function redire_discontinued_items(item_group, discontinued_items){
		window.location.href = `https://dk.techievolve.com/desk#group-item-list?item_group=${item_group}&discontinued_items=${discontinued_items}`;
		window.location.reload();
	}
	function redirect_discontinued_items_search(item_group, discontinued_items, search_box_data){
		window.location.href = `https://dk.techievolve.com/desk#group-item-list?item_group=${item_group}&discontinued_items=${discontinued_items}&search_box=${search_box_data}`;
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

	function new_qty_details(item_code,item_group, balance_qty, supplier, warehouse, buying_unit_price) {
		frappe.prompt({
			label: 'Stock Update Password',
			fieldname: 'data',
			fieldtype: 'Data'
		}, (values) => {
			frappe.call({
				method : 'techievolve.api.get_default_password',
				args:{
					field:'item_edit_password',
				},
				callback: function(res){
					if(res.message == values.data){
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
					}else{
						frappe.throw('Password Is Incorrect')
					}
				}
			})
		})
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
				$(".modal").modal('hide');
				window.location.reload();
				 
			}
		})
	}