//Add searchfield to Item query
this.frm.cscript.onload = function(frm) {
	this.frm.set_query("item_code", "items", function(doc) {
        return {
                query: "techievolve.query.new_item_query",
                filters: {'is_sales_item': 1}
        }	
	});
}
