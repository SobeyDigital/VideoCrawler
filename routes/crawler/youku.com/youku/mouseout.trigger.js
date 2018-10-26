(()=>{
    var e = new MouseEvent("mousemove", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:627,clientY:306,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:627,offsetY:306,pageX:627,pageY:306,relatedTarget:null,
		screenX:627,screenY:306,shiftKey:false,view:window
	});
	var nodelist = document.querySelectorAll(".focus-list>li");
	nodelist.forEach((li)=>{
		li.querySelector("a").dispatchEvent(e);
		li.dispatchEvent(e);
	});
	e = new MouseEvent("mouseout", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:702,clientY:246,composed:true,ctrlKey:false,
		//currentTarget:li,
		defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,layerX:702,layerY:246,metaKey:false,
		offsetX:702,offsetY:246,pageX:702,pageY:246,relatedTarget:null,screenX:702,screenY:337,shiftKey:false,
		view:window
	});
	nodelist.forEach((li)=>{
		li.querySelector("a").dispatchEvent(e);
		li.dispatchEvent(e);
	});

	e = new MouseEvent("mousemove", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:1153,clientY:306,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:1153,offsetY:306,pageX:1153,pageY:306,relatedTarget:null,
		screenX:1153,screenY:306,shiftKey:false,view:window
	});
	nodelist = document.querySelectorAll(".focus-nav>li");
	nodelist.forEach((li)=>{
		li.querySelector("a").dispatchEvent(e);
		li.dispatchEvent(e);
	});
	e = new MouseEvent("mouseout", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:900,clientY:306,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:900,offsetY:306,pageX:900,pageY:306,relatedTarget:null,
		screenX:900,screenY:306,shiftKey:false,view:window
	});
	nodelist.forEach((li)=>{
		li.querySelector("a").dispatchEvent(e);
		li.dispatchEvent(e);
	});

	e = new MouseEvent("mousemove", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:1009,clientY:32,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:1009,offsetY:32,pageX:1009,pageY:32,relatedTarget:null,
		screenX:702,screenY:337,shiftKey:false,view:window
	});
	document.querySelector("#uerCenter").dispatchEvent(e);
	e = new MouseEvent("mouseout", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:1009,clientY:50,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:1009,offsetY:50,pageX:1009,pageY:50,relatedTarget:null,
		screenX:702,screenY:337,shiftKey:false,view:window
	});
	document.querySelector("#uerCenter").dispatchEvent(e);

	e = new MouseEvent("mousemove", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:1261,clientY:122,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:1261,offsetY:122,pageX:1261,pageY:122,relatedTarget:null,
		screenX:1261,screenY:122,shiftKey:false,view:window
	});
	document.querySelector("img.avatar").dispatchEvent(e);
	e = new MouseEvent("mouseout", {
		altKey:false,bubbles:true,button:0,buttons:0,cancelBubble:false,cancelable:true
		,clientX:1261,clientY:160,composed:true,ctrlKey:false,defaultPrevented:false,
		detail:0,eventPhase:3,isTrusted:true,metaKey:false,offsetX:1261,offsetY:160,pageX:1261,pageY:160,relatedTarget:null,
		screenX:1261,screenY:160,shiftKey:false,view:window
	});
	document.querySelector("img.avatar").dispatchEvent(e);
})();