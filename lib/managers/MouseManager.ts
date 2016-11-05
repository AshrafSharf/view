import {Vector3D}						from "@awayjs/core/lib/geom/Vector3D";

import {DisplayObject}				from "@awayjs/scene/lib/display/DisplayObject";
import {TouchPoint}					from "@awayjs/scene/lib/base/TouchPoint";
import {MouseEvent}					from "@awayjs/scene/lib/events/MouseEvent";
import {FrameScriptManager}			from "@awayjs/scene/lib/managers/FrameScriptManager";

import {PickingCollision}				from "@awayjs/graphics/lib/pick/PickingCollision";
import {View}							from "../View";

/**
 * MouseManager enforces a singleton pattern and is not intended to be instanced.
 * it provides a manager class for detecting mouse hits on scene objects and sending out mouse events.
 */
export class MouseManager
{
	private static _instance:MouseManager;

	private _viewLookup:Array<View> = new Array<View>();

	public _iActiveDiv:HTMLDivElement;
	public _iUpdateDirty:boolean;
	public _iCollision:PickingCollision;
	
	private _nullVector:Vector3D = new Vector3D();
	private _previousCollidingObject:PickingCollision;
	private _queuedEvents:Array<MouseEvent> = new Array<MouseEvent>();

	private _mouseMoveEvent;

	private _mouseUp:MouseEvent = new MouseEvent(MouseEvent.MOUSE_UP);
	private _mouseClick:MouseEvent = new MouseEvent(MouseEvent.CLICK);
	private _mouseOut:MouseEvent = new MouseEvent(MouseEvent.MOUSE_OUT);
	private _mouseDown:MouseEvent = new MouseEvent(MouseEvent.MOUSE_DOWN);
	private _mouseMove:MouseEvent = new MouseEvent(MouseEvent.MOUSE_MOVE);
	private _mouseOver:MouseEvent = new MouseEvent(MouseEvent.MOUSE_OVER);
	private _mouseWheel:MouseEvent = new MouseEvent(MouseEvent.MOUSE_WHEEL);
	private _mouseDoubleClick:MouseEvent = new MouseEvent(MouseEvent.DOUBLE_CLICK);

	private onClickDelegate:(event) => void;
	private onDoubleClickDelegate:(event) => void;
	private onMouseDownDelegate:(event) => void;
	private onMouseMoveDelegate:(event) => void;
	private onMouseUpDelegate:(event) => void;
	private onMouseWheelDelegate:(event) => void;
	private onMouseOverDelegate:(event) => void;
	private onMouseOutDelegate:(event) => void;

	/**
	 * Creates a new <code>MouseManager</code> object.
	 */
	constructor()
	{
		this.onClickDelegate = (event) => this.onClick(event);
		this.onDoubleClickDelegate = (event) => this.onDoubleClick(event);
		this.onMouseDownDelegate = (event) => this.onMouseDown(event);
		this.onMouseMoveDelegate = (event) => this.onMouseMove(event);
		this.onMouseUpDelegate = (event) => this.onMouseUp(event);
		this.onMouseWheelDelegate = (event) => this.onMouseWheel(event);
		this.onMouseOverDelegate = (event) => this.onMouseOver(event);
		this.onMouseOutDelegate = (event) => this.onMouseOut(event);
	}

	public static getInstance():MouseManager
	{
		if (this._instance)
			return this._instance;

		return (this._instance = new MouseManager());
	}

	public fireMouseEvents(forceMouseMove:boolean):void
	{
		 // If colliding object has changed, queue over/out events.
		if (this._iCollision != this._previousCollidingObject) {
			if (this._previousCollidingObject)
				this.queueDispatch(this._mouseOut, this._mouseMoveEvent, this._previousCollidingObject);

			if (this._iCollision)
				this.queueDispatch(this._mouseOver, this._mouseMoveEvent);
		}

		 // Fire mouse move events here if forceMouseMove is on.
		 if (forceMouseMove && this._iCollision)
			this.queueDispatch( this._mouseMove, this._mouseMoveEvent);

		var event:MouseEvent;
		var dispatcher:DisplayObject;

		// Dispatch all queued events.
		var len:number = this._queuedEvents.length;
		for (var i:number = 0; i < len; ++i) {
			event = this._queuedEvents[i];
			dispatcher = <DisplayObject> event.entity;

			// bubble event up the heirarchy until the top level parent is reached
			while (dispatcher) {
				if (dispatcher._iIsMouseEnabled())
					dispatcher.dispatchEvent(event);

				dispatcher = dispatcher.parent;
			}
			// not totally sure, but i think just calling it is easier and cheaper than any options for that
			// if nothing is queued, the function will return directly anyway
			FrameScriptManager.execute_queue();

		}


		this._queuedEvents.length = 0;

		this._previousCollidingObject = this._iCollision;

		this._iUpdateDirty = false;
	}

//		public addViewLayer(view:View)
//		{
//			var stg:Stage = view.stage;
//
//			// Add instance to mouse3dmanager to fire mouse events for multiple views
//			if (!view.stageGL.mouse3DManager)
//				view.stageGL.mouse3DManager = this;
//
//			if (!hasKey(view))
//				_view3Ds[view] = 0;
//
//			_childDepth = 0;
//			traverseDisplayObjects(stg);
//			_viewCount = _childDepth;
//		}

	public registerView(view:View):void
	{
		if(view && view.htmlElement) {
			view.htmlElement.addEventListener("click", this.onClickDelegate);
			view.htmlElement.addEventListener("dblclick", this.onDoubleClickDelegate);
			view.htmlElement.addEventListener("touchstart", this.onMouseDownDelegate);
			view.htmlElement.addEventListener("mousedown", this.onMouseDownDelegate);
			view.htmlElement.addEventListener("touchmove", this.onMouseMoveDelegate);
			view.htmlElement.addEventListener("mousemove", this.onMouseMoveDelegate);
			view.htmlElement.addEventListener("mouseup", this.onMouseUpDelegate);
			view.htmlElement.addEventListener("touchend", this.onMouseUpDelegate);
			view.htmlElement.addEventListener("mousewheel", this.onMouseWheelDelegate);
			view.htmlElement.addEventListener("mouseover", this.onMouseOverDelegate);
			view.htmlElement.addEventListener("mouseout", this.onMouseOutDelegate);
			this._viewLookup.push(view);
		}
	}

	public unregisterView(view:View):void
	{
		if(view && view.htmlElement) {
			view.htmlElement.removeEventListener("click", this.onClickDelegate);
			view.htmlElement.removeEventListener("dblclick", this.onDoubleClickDelegate);
			view.htmlElement.removeEventListener("touchstart", this.onMouseDownDelegate);
			view.htmlElement.removeEventListener("mousedown", this.onMouseDownDelegate);
			view.htmlElement.removeEventListener("touchmove", this.onMouseMoveDelegate);
			view.htmlElement.removeEventListener("mousemove", this.onMouseMoveDelegate);
			view.htmlElement.removeEventListener("touchend", this.onMouseUpDelegate);
			view.htmlElement.removeEventListener("mouseup", this.onMouseUpDelegate);
			view.htmlElement.removeEventListener("mousewheel", this.onMouseWheelDelegate);
			view.htmlElement.removeEventListener("mouseover", this.onMouseOverDelegate);
			view.htmlElement.removeEventListener("mouseout", this.onMouseOutDelegate);

			this._viewLookup.slice(this._viewLookup.indexOf(view), 1);
		}
	}

	public fireEventsForViewFromString(touchMessage:String, viewIdx:number=0):void
	{

		var newTouchEvent:any={};
		newTouchEvent.clientX = null;// set the x position from the active touch
		newTouchEvent.clientY = null;// set the y position from the active touch
		newTouchEvent.preventDefault=function(){};
		var touchesFromMessage=touchMessage.split(",");
		// transfer touches to event
		var i=0;
		var cnt=0;
		var numTouches=parseInt(touchesFromMessage[cnt++]);
		var touchtype=parseInt(touchesFromMessage[cnt++]);
		var activeTouch=parseInt(touchesFromMessage[cnt++]);
		newTouchEvent.touches=[];
		newTouchEvent.changedTouches = [];
		if((touchtype!=1)&&(touchtype!=6)){
			for(i=0; i< numTouches;i++){
				var newTouch:any={};
				newTouch.identifier=touchesFromMessage[cnt++];
				newTouch.clientX=touchesFromMessage[cnt++];
				newTouch.clientY=touchesFromMessage[cnt++];
				newTouchEvent.touches[i]=newTouch;
				newTouchEvent.changedTouches[i] = newTouch;
			};
			newTouchEvent.changedTouches[i] = newTouchEvent.touches[activeTouch];
		}
		else{
			for(i=0; i< numTouches;i++){
				if(i!=activeTouch){
					var newTouch:any={};
					newTouch.identifier=touchesFromMessage[cnt++];
					newTouch.clientX=touchesFromMessage[cnt++];
					newTouch.clientY=touchesFromMessage[cnt++];
					newTouchEvent.touches[i]=newTouch;
					newTouchEvent.changedTouches[i] = newTouch;
				}
				else{
					newTouchEvent.clientX =touchesFromMessage[cnt++];
					newTouchEvent.clientY =touchesFromMessage[cnt++];
					cnt++;
				}
			};


		}
		newTouchEvent.target=this._viewLookup[viewIdx].htmlElement;
		if(touchtype==0){//mousedown
			this.onMouseDown(newTouchEvent);
		}
		else if(touchtype==1){//mouseup
			this.onMouseUp(newTouchEvent);
		}
		else if(touchtype==2){//mousemove
			this.onMouseMove(newTouchEvent);

		}
		else if(touchtype==261){//mousedownPointer
			this.onMouseDown(newTouchEvent);

		}
		else if(touchtype==6){//mouseupPointer
			this.onMouseUp(newTouchEvent);
		}
	}
	// ---------------------------------------------------------------------
	// Private.
	// ---------------------------------------------------------------------

	private queueDispatch(event:MouseEvent, sourceEvent, collision:PickingCollision = null):void
	{
		// 2D properties.
		if (sourceEvent) {
			event.ctrlKey = sourceEvent.ctrlKey;
			event.altKey = sourceEvent.altKey;
			event.shiftKey = sourceEvent.shiftKey;
			event.screenX = (sourceEvent.clientX != null)? sourceEvent.clientX : sourceEvent.changedTouches[0].clientX;
			event.screenY = (sourceEvent.clientY != null)? sourceEvent.clientY : sourceEvent.changedTouches[0].clientY;
		}

		if (collision == null)
			collision = this._iCollision;

		// 3D properties.
		if (collision) {
			// Object.
			event.entity = collision.entity;
			event.renderable = collision.renderable;
			// UV.
			event.uv = collision.uv;
			// Position.
			event.position = collision.position? collision.position.clone() : null;
			// Normal.
			event.normal = collision.normal? collision.normal.clone() : null;
			// Face index.
			event.elementIndex = collision.elementIndex;
		} else {
			// Set all to null.
			event.uv = null;
			event.entity = null;
			event.position = this._nullVector;
			event.normal = this._nullVector;
			event.elementIndex = 0;
		}

		// Store event to be dispatched later.
		this._queuedEvents.push(event);
	}

	// ---------------------------------------------------------------------
	// Listeners.
	// ---------------------------------------------------------------------

	private onMouseMove(event):void
	{
		event.preventDefault();

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseMove, this._mouseMoveEvent = event);
	}

	private onMouseOut(event):void
	{
		this._iActiveDiv = null;

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseOut, event);
	}

	private onMouseOver(event):void
	{
		this._iActiveDiv = <HTMLDivElement> event.target;

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch( this._mouseOver, event);
	}

	private onClick(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseClick, event);
	}

	private onDoubleClick(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseDoubleClick, event);
	}

	private onMouseDown(event):void
	{
		event.preventDefault();

		this._iActiveDiv = <HTMLDivElement> event.target;

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseDown, event);
	}

	private onMouseUp(event):void
	{
		event.preventDefault();

		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseUp , event);
	}

	private onMouseWheel(event):void
	{
		this.updateColliders(event);

		if (this._iCollision)
			this.queueDispatch(this._mouseWheel, event);
	}


	private updateColliders(event):void
	{
		var view:View;
		var bounds:ClientRect;
		var mouseX:number = (event.clientX != null)? event.clientX : event.changedTouches[0].clientX;
		var mouseY:number = (event.clientY != null)? event.clientY : event.changedTouches[0].clientY;
		var len:number = this._viewLookup.length;
		for (var i:number = 0; i < len; i++) {
			view = this._viewLookup[i];
			view._pTouchPoints.length = 0;
			bounds = view.htmlElement.getBoundingClientRect();

			if (event.touches) {
				var touch;
				var len:number = event.touches.length;
				for (var i:number = 0; i < len; i++) {
					touch = event.touches[i];
					view._pTouchPoints.push(new TouchPoint(touch.clientX + bounds.left, touch.clientY + bounds.top, touch.identifier));
				}
			}

			if (this._iUpdateDirty)
				continue;

			if (mouseX < bounds.left || mouseX > bounds.right || mouseY < bounds.top || mouseY > bounds.bottom) {
				view._pMouseX = null;
				view._pMouseY = null;
			} else {
				view._pMouseX = mouseX + bounds.left;
				view._pMouseY = mouseY + bounds.top;

				view.updateCollider();

				if (view.layeredView && this._iCollision)
					break;
			}
		}

		this._iUpdateDirty = true;
	}
}