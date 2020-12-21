//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
        this.frm.set_query("item_code", "items", function(doc) {
		return {
			query: "techievolve.query.item_query",
			
			filters: 
				{
					'is_purchase_item': 1,
					'supplier': doc.supplier
				}
		}	
	});
}
//$(".form-inner-toolbar").hide();
frappe.ui.form.on("Purchase Order Item", {
// //      item_code: function(frm) {
// // 	     console.log(document.querySelector(".frappe-control [data-fieldname='items'] .grid-row ul li p strong"))
// // 	    document.querySelector(".frappe-control [data-fieldname='items'] .grid-row ul li p strong").style.display = "None";
      
//     }
})