import {Vector3D} from "@awayjs/core";

import {TraverserBase, INode, IEntity, PickingCollision} from "@awayjs/renderer";

import {TriangleElements, LineElements, Shape} from "@awayjs/graphics";

import {Billboard} from "@awayjs/scene";

import {View} from "../View";

import {IPickingCollider} from "./IPickingCollider";
import {IPicker} from "./IPicker";

/**
 * Picks a 3d object from a view or scene by 3D raycast calculations.
 * Performs an initial coarse boundary calculation to return a subset of entities whose bounding volumes intersect with the specified ray,
 * then triggers an optional picking collider on individual renderable objects to further determine the precise values of the picking ray collision.
 *
 * @class away.pick.RaycastPicker
 */
export class RaycastPicker extends TraverserBase implements IPicker
{
	private _rayPosition:Vector3D;
	private _rayDirection:Vector3D;
	private _findClosestCollision:boolean;
	private _bestCollision:PickingCollision;
	private _testCollision:PickingCollision;
	private _testCollider:IPickingCollider;
	private _ignoredEntities:Array<IEntity>;

	private _entity:IEntity;
	private _entities:Array<IEntity> = new Array<IEntity>();

	/**
	 * @inheritDoc
	 */
	public onlyMouseEnabled:boolean = true;

	/**
	 * Creates a new <code>RaycastPicker</code> object.
	 *
	 * @param findClosestCollision Determines whether the picker searches for the closest bounds collision along the ray,
	 * or simply returns the first collision encountered. Defaults to false.
	 */
	constructor(findClosestCollision:boolean = false)
	{
		super();
		
		this._findClosestCollision = findClosestCollision;
	}
	
	public getNextTabEntity(currentFocus:IEntity):IEntity{
		return currentFocus;
	}
	public getPrevTabEntity(currentFocus:IEntity):IEntity{
		return currentFocus;
	}
	/**
	 * Returns true if the current node is at least partly in the frustum. If so, the partition node knows to pass on the traverser to its children.
	 *
	 * @param node The Partition3DNode object to frustum-test.
	 */
	public enterNode(node:INode):boolean
	{
		return node.isIntersectingRay(this._rayPosition, this._rayDirection) && !node.isMask();
	}

	/**
	 * @inheritDoc
	 */
	public getCollision(rayPosition:Vector3D, rayDirection:Vector3D, view:View):PickingCollision
	{
		this._rayPosition = rayPosition;
		this._rayDirection = rayDirection;

		// collect entities to test
		view.traversePartitions(this);

		//early out if no collisions detected
		if (!this._entities.length)
			return null;

		//console.log("entities: ", this._entities)
		var collision:PickingCollision = this.getPickingCollision(view);



		//discard entities
		this._entities.length = 0;

		return collision;
	}

//		public getEntityCollision(position:Vector3D, direction:Vector3D, entities:Array<IEntity>):PickingCollision
//		{
//			this._numRenderables = 0;
//
//			var renderable:IEntity;
//			var l:number = entities.length;
//
//			for (var c:number = 0; c < l; c++) {
//				renderable = entities[c];
//
//				if (renderable.isIntersectingRay(position, direction))
//					this._renderables[this._numRenderables++] = renderable;
//			}
//
//			return this.getPickingCollision(this._raycastCollector);
//		}

	public setIgnoreList(entities:Array<IEntity>):void
	{
		this._ignoredEntities = entities;
	}
	
	private isIgnored(entity:IEntity):boolean
	{
		if (this.onlyMouseEnabled && !entity._iIsMouseEnabled())
			return true;

		if (this._ignoredEntities) {
			var len:number = this._ignoredEntities.length;
			for (var i:number = 0; i < len; i++)
				if (this._ignoredEntities[i] == entity)
					return true;
		}
		
		return false;
	}

	private sortOnNearT(entity1:IEntity, entity2:IEntity):number
	{
		//return entity1._iPickingCollision.rayEntryDistance > entity2._iPickingCollision.rayEntryDistance? 1 : -1;// use this for Icycle;
		return entity1._iPickingCollision.rayEntryDistance > entity2._iPickingCollision.rayEntryDistance? 1 : entity1._iPickingCollision.rayEntryDistance < entity2._iPickingCollision.rayEntryDistance?-1:0;
	}

	private getPickingCollision(view:View):PickingCollision
	{
		// Sort entities from closest to furthest to reduce tests.
		this._entities = this._entities.sort(this.sortOnNearT); // TODO - test sort filter in JS

		// ---------------------------------------------------------------------
		// Evaluate triangle collisions when needed.
		// Replaces collision data provided by bounds collider with more precise data.
		// ---------------------------------------------------------------------

		this._bestCollision = null;

		var len:number = this._entities.length;
		for (var i:number = 0; i < len; i++) {
			this._entity = this._entities[i];
			this._testCollision = this._entity._iPickingCollision;
			if (this._bestCollision == null || this._testCollision.rayEntryDistance < this._bestCollision.rayEntryDistance) {

				//var partition=view.getPartition(this._entity);
				//var abstraction=partition.getAbstraction(this._entity);

				this._testCollider = view.getPartition(this._entity).getAbstraction(this._entity).pickingCollider;
				if (this._testCollider) {
					this._testCollision.rayEntryDistance = Number.MAX_VALUE;
					this._entity._acceptTraverser(this);
					// If a collision exists, update the collision data and stop all checks.
					if (this._bestCollision && !this._findClosestCollision)
						break;
				} else if (!this._testCollision.rayOriginIsInsideBounds) {
					// A bounds collision with no picking collider stops all checks.
					// Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
					// to enable the detection of a corresponsding triangle collision.
					// Therefore, bounds collisions with a ray origin inside its bounds can be ignored
					// if it has been established that there is NO triangle collider to test
					this._bestCollision = this._testCollision;
					break;
				}
			}
		}

		if (this._bestCollision)
			this.updatePosition(this._bestCollision);

		return this._bestCollision;
	}

	private updatePosition(pickingCollision:PickingCollision):void
	{
		var collisionPos:Vector3D = pickingCollision.position || (pickingCollision.position = new Vector3D());

		var rayDir:Vector3D = pickingCollision.rayDirection;
		var rayPos:Vector3D = pickingCollision.rayPosition;
		var t:number = pickingCollision.rayEntryDistance;
		collisionPos.x = rayPos.x + t*rayDir.x;
		collisionPos.y = rayPos.y + t*rayDir.y;
		collisionPos.z = rayPos.z + t*rayDir.z;
	}

	public dispose():void
	{
		//TODO
	}

	/**
	 *
	 * @param entity
	 */
	public applyEntity(entity:IEntity):void
	{
		if (!this.isIgnored(entity))
			this._entities.push(entity);
	}

	public applyBillboard(billboard:Billboard):void
	{
		if (this._testCollider.testBillboardCollision(billboard, billboard.material, this._testCollision))
			this._bestCollision = this._testCollision;
	}

	public applyLineShape(shape:Shape):void
	{
		if (this._testCollider.testLineCollision(<LineElements> shape.elements, shape.material || this._entity.material, this._testCollision, shape.count || shape.elements.numVertices, shape.offset))
			this._bestCollision = this._testCollision;
	}

	public applyTriangleShape(shape:Shape):void
	{
		if (this._testCollider.testTriangleCollision(<TriangleElements> shape.elements, shape.material || this._entity.material, this._testCollision, shape.count || shape.elements.numVertices, shape.offset))
			this._bestCollision = this._testCollision;
	}
	
	/**
	 *
	 * @param entity
	 */
	public applyDirectionalLight(entity:IEntity):void
	{
		//don't do anything here
	}

	/**
	 *
	 * @param entity
	 */
	public applyLightProbe(entity:IEntity):void
	{
		//don't do anything here
	}

	/**
	 *
	 * @param entity
	 */
	public applyPointLight(entity:IEntity):void
	{
		//don't do anything here
	}

	/**
	 *
	 * @param entity
	 */
	public applySkybox(entity:IEntity):void
	{
		//don't do anything here
	}
}