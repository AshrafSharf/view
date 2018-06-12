import {Plane3D, Vector3D} from "@awayjs/core";

import {TraverserBase, IEntity, INode, IContainerNode} from "@awayjs/renderer";

import {BoundingVolumeBase, NullBounds} from "@awayjs/scene";

/**
 * @class away.partition.NodeBase
 */
export class NodeBase implements IContainerNode
{
	public _pChildNodes:Array<INode> = new Array<INode>();
	public _pNumChildNodes:number = 0;

	public _pDebugEntity:IEntity;

	public _iCollectionMark:number;// = 0;

	public numEntities:number = 0;

	public parent:IContainerNode;

	public get debugVisible():boolean
	{
		return false;
	}


	/**
	 *
	 */
	constructor()
	{
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 * @internal
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		return true;
	}

	/**
	 *
	 * @param rayPosition
	 * @param rayDirection
	 * @returns {boolean}
	 */
	public isIntersectingRay(rayPosition:Vector3D, rayDirection:Vector3D):boolean
	{
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isRenderable():boolean
	{
		return true;
	}
	
	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return true;
	}
	
	public renderBounds(traverser:TraverserBase):void
	{
		//nothing to do here
	}


	/**
	 *
	 * @returns {boolean}
	 */
	public isMask():boolean
	{
		return false;
	}

	public dispose():void
	{
		this.parent = null;
		this._pChildNodes = null;
	}

	/**
	 *
	 * @param traverser
	 */
	public acceptTraverser(traverser:TraverserBase):void
	{
		if (this.numEntities == 0)
			return;

		if (traverser.enterNode(this)) {
			for (var i:number = 0; i < this._pNumChildNodes; i++)
				this._pChildNodes[i].acceptTraverser(traverser);
		}
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iAddNode(node:INode):void
	{
		node.parent = this;
		this.numEntities += node.numEntities;
		this._pChildNodes[ this._pNumChildNodes++ ] = node;

		var numEntities:number = node.numEntities;
		node = this;

		do {
			node.numEntities += numEntities;
		} while ((node = node.parent) != null);
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iRemoveNode(node:INode):void
	{
		var index:number = this._pChildNodes.indexOf(node);
		this._pChildNodes[index] = this._pChildNodes[--this._pNumChildNodes];
		this._pChildNodes.pop();

		var numEntities:number = node.numEntities;
		node = this;

		do {
			node.numEntities -= numEntities;
		} while ((node = node.parent) != null);
	}
}