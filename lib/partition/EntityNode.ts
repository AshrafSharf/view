import {AbstractionBase, Plane3D, Vector3D, AssetEvent} from "@awayjs/core";

import {IPartitionEntity} from "../base/IPartitionEntity";

import {IPartitionTraverser} from "./IPartitionTraverser";
import {INode} from "./INode";
import { IContainerNode } from './IContainerNode';
import { PartitionBase } from './PartitionBase';
import { PickGroup } from '../PickGroup';
import { IPickingEntity } from '../base/IPickingEntity';

/**
 * @class away.partition.EntityNode
 */
export class EntityNode extends AbstractionBase implements INode
{
	public _iUpdateQueueNext:EntityNode;
	
	public _collectionMark:number;// = 0;

	public parent:IContainerNode;

	public get entity():IPartitionEntity
	{
		return <IPartitionEntity> this._asset;
	}

	public get pickObject():IPartitionEntity
	{
		return (<IPartitionEntity> this._asset).pickObject;
	}

	public get boundsVisible():boolean
	{
		return (<IPartitionEntity> this._asset).boundsVisible;
	}
	
	/**
	 *
	 * @returns {number}
	 */
	public get maskId():number
	{
		return (<IPartitionEntity> this._asset).maskId;
	}

	public getBoundsPrimitive(pickGroup:PickGroup):IPartitionEntity
	{
		return (<IPartitionEntity> this._asset).getBoundsPrimitive(pickGroup);
	}

	constructor(entity:IPartitionEntity, partition:PartitionBase)
	{
		super(entity, partition);
	}
	
	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return (<IPartitionEntity> this._asset).castsShadows;
	}

	public onClear(event:AssetEvent):void
	{
		(<PartitionBase> this._pool).clearEntity((<IPartitionEntity> this._asset));

		super.onClear(event);
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		if (!(<IPartitionEntity> this._asset)._iIsVisible())
			return false;

		return true; // todo: hack for 2d. attention. might break stuff in 3d.
		//return this._bounds.isInFrustum(planes, numPlanes);
	}

	public isVisible():boolean
	{
		return (<IPartitionEntity> this._asset)._iIsVisible();
	}

	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(rootEntity:IPartitionEntity, globalRayPosition:Vector3D, globalRayDirection:Vector3D, pickGroup:PickGroup):boolean
	{
		return pickGroup.getAbstraction(<IPickingEntity> this._asset)._isIntersectingRayInternal(rootEntity, globalRayPosition, globalRayDirection);
		// if (!this._entity._iIsVisible() || !this.isIntersectingMasks(globalRayPosition, globalRayDirection, this._entity._iAssignedMasks()))
		// 	return false;

		// var pickingCollision:PickingCollision = this._entity._iPickingCollision;
		// pickingCollision.rayPosition = this._entity.transform.inverseConcatenatedMatrix3D.transformVector(globalRayPosition);
		// pickingCollision.rayDirection = this._entity.transform.inverseConcatenatedMatrix3D.deltaTransformVector(globalRayDirection);

		// if (!pickingCollision.normal)
		// 	pickingCollision.normal = new Vector3D();

		// var rayEntryDistance:number = pickGroup.getAbstraction(this._entity).getBoundingVolume(null, this._entity.defaultBoundingVolume).rayIntersection(pickingCollision.rayPosition, pickingCollision.rayDirection, pickingCollision.normal);

		// if (rayEntryDistance < 0)
		// 	return false;

		// pickingCollision.rayEntryDistance = rayEntryDistance;
		// pickingCollision.globalRayPosition = globalRayPosition;
		// pickingCollision.globalRayDirection = globalRayDirection;
		// pickingCollision.rayOriginIsInsideBounds = rayEntryDistance == 0;

		// return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable():boolean
	{
		return (<IPartitionEntity> this._asset)._iAssignedColorTransform()._isRenderable();
	}
	
	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:IPartitionTraverser):void
	{
		if (traverser.enterNode(this))
			traverser.applyEntity((<IPartitionEntity> this._asset));
	}
}