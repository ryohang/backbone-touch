//TODO: Add snap to centre
//TODO: Improve document touch delagation
//TODO: Add overflow
//TODO: Optimisation
//TODO: And many more
//TODO: L34rN2C0d3

Backbone.View.Touch = Backbone.View.extend({

 //globals
 mDown : false,
 container : null,
 child : null,
 orintation : null,
 containerSize : 0,
 scrollLimit : 0,
 timer : null,
 timerInterval : 100,
 timerData : {
  currentOffset : 0,
  previousOffset : 0
 },
 clickDelta : 0,
 clickDeltaLimit : 250,

 //public var
 options : {
  "vertical" : false, //orintation
  "container" : ".touch", //holder, conatiner, overflow
  "child" : ".touch > nav",  //mover, overflower
  "snap" : true //snap to item
 },
 
 //touch or mouse events
 events : function() {
  if(this.isTouch) {
   return {
    "touchstart" : "startHandler",
    "touchmove" : "moveHandler",
    "touchend" : "endHandler"
   }
  } else {
   return {
    "mousedown" : "startHandler",
    "mousemove" : "moveHandler",
    "mouseup" : "endHandler"
   }
  }
 },
 
 //enable touch events (IFFY)
 isTouch : (function() {
  try {
   document.createEvent("TouchEvent");
   return true;
  } catch (e) {
   return false;
  }
 }()),

 initialize : function(options) {
   //merge options
   if(options) {
    this.options = _.extend(this.options,options);
   }   

   //set dimension vars
   if(this.options.vertical) {
    this.orintation = {
     "unit" : "Height",
     "css" : "top",
     "axis" : "Y"
    }
   } else {
    this.orintation = {
     "unit" : "Width",
     "css" : "left",
     "axis" : "X"
    }
   }

   //set globals 
   this.container = $(this.options.container);
   this.child = $(this.options.child);
     
   //set CSS
   this.container.css({"overflow":"hidden"});
   this.child.css({"position" : "relative"});
   this.child.children().css({"float" : "left" , "display" : "block"});

   //bind this to backbone
   _.bindAll(this);

   //calc and set dimensions
   _.each(this.child.children(), this.calcSize);
   this.child.css(this.orintation.unit.toLowerCase(), this.containerSize);
   this.child.css(this.orintation.css, 0);
   this.scrollLimit = this.container["outer" + this.orintation.unit](true) - this.containerSize;
 },

 calcSize : function(el,i) {
  this.containerSize += Math.ceil($(el)["outer" + this.orintation.unit](true));
 },

 getCurrentOffset : function() {
  return parseInt(this.child.css(this.orintation.css));
 },

 getEvent : function(e) {
  if (this.isTouch && typeof e.originalEvent.touches !== "undefined") {
   return e.originalEvent.touches[0];
  }
  e.preventDefault();
  return e;
 },

 startTimer : function() {
   this.timer = window.setInterval(this.timerHandler, this.timerInterval);
 },

 stopTimer : function() {
  window.clearInterval(this.timer);
 },

 timerHandler : function() {
  this.timerData.previousOffset = this.timerData.currentOffset;
  this.timerData.currentOffset = this.getCurrentOffset();
 },

 //calc accel as decimal from timing functions
 getAccel : function() {
  var dist = this.timerData.currentOffset - this.timerData.previousOffset;
  return dist/this.timerInterval;
 },

 //get closest item to snap position
 getSnap : function(targOffset) {
  var children = nx.view.test.child[0].children;
  var offsets = _.pluck(children, "offset" + this.orintation.css.charAt(0).toUpperCase() + this.orintation.css.slice(1));
  var closestOffset = _.sortedIndex(offsets, Math.abs(targOffset));
  return -offsets[closestOffset];
 },

 startHandler : function(e) {
  e = this.getEvent(e);
  this.child.stop();
  this.startTimer();
  this.mDown = true;
  this.clickDelta = new Date();
  this.clickOffset = e["client" + this.orintation.axis];
  this.currentOffset = this.getCurrentOffset();
 },

 moveHandler : function(e) {
  e = this.getEvent(e);
  if(this.mDown) {
   var offset =  e["client" + this.orintation.axis] - this.clickOffset + this.currentOffset;
   if(offset > 0) offset = 0;
   if(offset < this.scrollLimit) offset = this.scrollLimit;
   this.child.css(this.orintation.css, offset);
  }
 },

 endHandler : function(e) {
  e = this.getEvent(e);
  var accel = this.getAccel();
  var targOffset = parseInt(this.container["outer" + this.orintation.unit](true)) * accel;
  var now = new Date();
  var delta = now - this.clickDelta;  
  
  this.mDown = false;
  this.stopTimer();
  
  //bubble events
  if(delta < this.clickDeltaLimit) {
   $(e.currentTarget).trigger("tap");
  }
  
  //position & animate
  targOffset += this.getCurrentOffset();
  if(this.options.snap) targOffset = this.getSnap(targOffset);
  if(targOffset > 0) targOffset = 0;
  if(targOffset < this.scrollLimit) targOffset = this.scrollLimit;
 
  if(accel != 0 || this.options.snap) {
   this.child.animate({"left" : targOffset }, {duration : 1000, easing : "easeOutCubic"});
  }
 }

});

//jquery easing functions (from :http://plugins.jquery.com/files/jquery.easing.1.2.js.txt) 
jQuery.extend( jQuery.easing,
{
	def: 'easeOutCubic',
	swing: function (x, t, b, c, d) {
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	}
});

