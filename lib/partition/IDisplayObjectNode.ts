import {INode}						from "@awayjs/graphics/lib/base/INode";

import {DisplayObject}				from "@awayjs/scene/lib/display/DisplayObject";

/**
 * IDisplayObjectNode is an interface for the constructable class definition EntityNode that is used to
 * create node objects in the partition pipeline that represent the contents of a Entity
 *
 * @class away.pool.IDisplayObjectNode
 */
export interface IDisplayObjectNode extends INode
{
	_iUpdateQueueNext:IDisplayObjectNode;

	displayObject:DisplayObject;

	isSceneGraphNode:boolean;
}