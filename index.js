/*** Presence Auto Learning Z-Way module *******************************************

Version: 1.0
(c) Gwenhaël Le Normand, 2016
-----------------------------------------------------------------------------
Author: Gwenhaël Le Normand
Description:
    Module to learn your presence habits.

******************************************************************************/

function PresenceAutoLearning (id, controller) {
    // Call superconstructor first (AutomationModule)
    PresenceAutoLearning.super_.call(this, id, controller);
}

inherits(PresenceAutoLearning, AutomationModule);

_module = PresenceAutoLearning;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

PresenceAutoLearning.prototype.init = function (config) {
	PresenceAutoLearning.super_.prototype.init.call(this, config);

	var self = this;

	self.presenceHandler = function(vDev) {
		var level = vDev.get("metrics:level");
                if (level === "on") {
                        self.lastHalfHourPresence = true;
                }
	};

	// add cron schedule every half hour.
	self.controller.emit("cron.addTask", "PresenceAutoLearning.poll", {
		minute: [0,59,30],
		hour: null,
		weekDay: null,
		day: null,
		month: null
	});

	// add event listener for each configured devices
	self.config.device.forEach(function(device) {
		self.controller.devices.on(device, "change:metrics:level", self.presenceHandler);
	});

	//loading habits table
	debugPrint("Loading habits table");
	self.presenceHabitsTable = loadObject('presenceHabitsTable') || [];

	//table first initialisation
	if (self.presenceHabitsTable.length == 0)
	{
		//debugPrint("No table found. creating a new one");
		//the table work by step of 30min
		for (i=0; i<336; i++)
		{
			//the initial probability is 4 it goes from 0 to 6 (0 nobody here --> 6 somebody is here)
			self.presenceHabitsTable[i] = 4;
		}
		saveObject("presenceHabitsTable", self.presenceHabitsTable);
		//debugPrint("Table created");
	}

	//initializing vars
	self.lastHalfHourPresence = false;
	
	controller.on('PresenceAutoLearning.poll',function() 
	{
		debugPrint("Compute Presence table for last half hour");

        	//find the current index in the table
		var d = new Date();
		var index = (d.getDay() * 48) + (d.getHours() * 2);
		
		if(index != 0)
		{
			if (d.getMinutes() < 30)
			{
				index -= 1;
			}
		}
		else
		{
			index = 335;
		}
		
		if(self.lastHalfHourPresence == true)
		{
			self.presenceHabitsTable[index] += 2;
		}
		else
		{
			self.presenceHabitsTable[index] -= 1;
		}

		if( self.presenceHabitsTable[index] > 6)
		{
			self.presenceHabitsTable[index] = 6;
		}
		
		if(self.presenceHabitsTable[index] < 0)
		{
			self.presenceHabitsTable[index] = 0;
		}

		debugPrint("set presenceHabitsTable[" + index + "]=" + self.presenceHabitsTable[index]);
		saveObject("presenceHabitsTable", self.presenceHabitsTable);
		self.lastHalfHourPresence = 0;
    });
};

PresenceAutoLearning.prototype.stop = function () {
    this.controller.emit("cron.removeTask", "PresenceAutoLearning.poll");
    PresenceAutoLearning.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------
//PingPresence.prototype.checkPresence = function() {};
