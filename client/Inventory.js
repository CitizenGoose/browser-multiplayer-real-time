/*
Inventory.js:
Contains the function definition for both Item and Inventory. Also used to
define individual items. Each item contains a script.

--CitizenGosoe
*/

// Inventory Function /////////////////////////////////////////////////////////
Inventory = function(items,socket,server){
    var self = {
        items:items, //{id:"itemId",amount:1}
		socket:socket,
		server:server,
    }

    // Add Item to Inventory
    self.addItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				self.items[i].amount += amount;
				self.refreshRender();
				return;
			}
		}
		self.items.push({id:id,amount:amount});
		self.refreshRender();
    }

    // Remove Item from Inventory
    self.removeItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				self.items[i].amount -= amount;
				if(self.items[i].amount <= 0)
					self.items.splice(i,1);
				self.refreshRender();
				return;
			}
		}
    }

    // CHeck if Inventory contains Item
    self.hasItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				return self.items[i].amount >= amount;
			}
		}
		return false;
    }

	self.refreshRender = function(){
		//server
		if(self.server){
			self.socket.emit('updateInventory',self.items);
			return;
		}
		//client only
		var inventory = document.getElementById("inventory");
		inventory.innerHTML = "";
		var addButton = function(data){
			let item = Item.list[data.id];
			let button = document.createElement('button');
			button.onclick = function(){
				self.socket.emit("useItem",item.id);
			}
			button.innerText = item.name + " x" + data.amount;
      button.id = "test";
      button.onclick = "FuncUseItem";

			inventory.appendChild(button);
		}
		for(var i = 0 ; i < self.items.length; i++)
			addButton(self.items[i]);
	}
	if(self.server){
		self.socket.on("useItem",function(itemId){
			if(!self.hasItem(itemId,1)){
				console.log("Cheater");
				return;
			}
			let item = Item.list[itemId];
			item.event(Player.list[self.socket.id]);
		});

	}

	return self;
}

///////////////////////////////////////////////////////////////////////////////

// Item definition ///////////////////////////////////////////////////////////
Item = function(id,name,event){
	var self = {
		id:id,
		name:name,
		event:event,
	}
	Item.list[self.id] = self;
	return self;
}
Item.list = {};
//////////////////////////////////////////////////////////////////////////////


// Define items /////////////////////////////////////////////////////////////

// Potion
Item("potion","Potion",function(player){
	player.hp = 10;
	player.inventory.removeItem("potion",10);
	player.inventory.addItem("superAttack",1);
});

// Super Attack
Item("superAttack","Super Attack",function(player){
	for(var i = 0 ; i < 360; i++)
		player.shootBullet(i);
});
