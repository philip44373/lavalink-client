import { EventEmitter } from "events";
import { DestroyReasons, DisconnectReasons } from "./Constants.js";
import { LavalinkNode } from "./Node.js";
import { MiniMap } from "./Utils.js";
export class NodeManager extends EventEmitter {
    /**
     * Emit an event
     * @param event The event to emit
     * @param args The arguments to pass to the event
     * @returns
     */
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    /**
     * Add an event listener
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Add an event listener that only fires once
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    once(event, listener) {
        return super.once(event, listener);
    }
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    off(event, listener) {
        return super.off(event, listener);
    }
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    removeListener(event, listener) {
        return super.removeListener(event, listener);
    }
    /**
     * The LavalinkManager that created this NodeManager
     */
    LavalinkManager;
    /**
     * A map of all nodes in the nodeManager
     */
    nodes = new MiniMap();
    /**
     * @param LavalinkManager The LavalinkManager that created this NodeManager
     */
    constructor(LavalinkManager) {
        super();
        this.LavalinkManager = LavalinkManager;
        if (this.LavalinkManager.options.nodes)
            this.LavalinkManager.options.nodes.forEach(node => {
                this.createNode(node);
            });
    }
    /**
     * Disconnects all Nodes from lavalink ws sockets
     * @param deleteAllNodes if the nodes should also be deleted from nodeManager.nodes
     * @param destroyPlayers if the players should be destroyed
     * @returns amount of disconnected Nodes
     */
    async disconnectAll(deleteAllNodes = false, destroyPlayers = true) {
        if (!this.nodes.size)
            throw new Error("There are no nodes to disconnect (no nodes in the nodemanager)");
        if (!this.nodes.filter(v => v.connected).size)
            throw new Error("There are no nodes to disconnect (all nodes disconnected)");
        let counter = 0;
        for (const node of this.nodes.values()) {
            if (!node.connected)
                continue;
            if (destroyPlayers) {
                await node.destroy(DestroyReasons.DisconnectAllNodes, deleteAllNodes);
            }
            else {
                await node.disconnect(DisconnectReasons.DisconnectAllNodes);
            }
            counter++;
        }
        return counter;
    }
    /**
     * Connects all not connected nodes
     * @returns Amount of connected Nodes
     */
    async connectAll() {
        if (!this.nodes.size)
            throw new Error("There are no nodes to connect (no nodes in the nodemanager)");
        if (!this.nodes.filter(v => !v.connected).size)
            throw new Error("There are no nodes to connect (all nodes connected)");
        let counter = 0;
        for (const node of this.nodes.values()) {
            if (node.connected)
                continue;
            await node.connect();
            counter++;
        }
        return counter;
    }
    /**
     * Forcefully reconnects all nodes
     * @returns amount of nodes
     */
    async reconnectAll() {
        if (!this.nodes.size)
            throw new Error("There are no nodes to reconnect (no nodes in the nodemanager)");
        let counter = 0;
        for (const node of this.nodes.values()) {
            const sessionId = node.sessionId ? `${node.sessionId}` : undefined;
            await node.destroy(DestroyReasons.ReconnectAllNodes, false);
            await node.connect(sessionId);
            counter++;
        }
        return counter;
    }
    /**
     * Create a node and add it to the nodeManager
     * @param options The options for the node
     * @returns The node that was created
     */
    createNode(options) {
        if (this.nodes.has(options.id || `${options.host}:${options.port}`))
            return this.nodes.get(options.id || `${options.host}:${options.port}`);
        const newNode = new LavalinkNode(options, this);
        this.nodes.set(newNode.id, newNode);
        return newNode;
    }
    /**
     * Get the nodes sorted for the least usage, by a sorttype
     * @param sortType The type of sorting to use
     * @returns
     */
    leastUsedNodes(sortType = "players") {
        const connectedNodes = Array.from(this.nodes.values()).filter((node) => node.connected);
        switch (sortType) {
            case "memory":
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.memory?.used || 0) - (b.stats?.memory?.used || 0)); // sort after memor
                }
                break;
            case "cpuLavalink":
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.cpu?.lavalinkLoad || 0) - (b.stats?.cpu?.lavalinkLoad || 0)); // sort after memor
                }
                break;
            case "cpuSystem":
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.cpu?.systemLoad || 0) - (b.stats?.cpu?.systemLoad || 0)); // sort after memor
                }
                break;
            case "calls":
                {
                    return connectedNodes
                        .sort((a, b) => a.calls - b.calls); // client sided sorting
                }
                break;
            case "playingPlayers":
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.playingPlayers || 0) - (b.stats?.playingPlayers || 0));
                }
                break;
            case "players":
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
                }
                break;
            default:
                {
                    return connectedNodes
                        .sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
                }
                break;
        }
    }
    /**
     * Delete a node from the nodeManager and destroy it
     * @param node The node to delete
     * @param movePlayers whether to movePlayers to different connected node before deletion. @default false
     * @returns
     *
     * @example
     * Deletes the node
     * ```ts
     * client.lavalink.nodeManager.deleteNode("nodeId to delete");
     * ```
     * Moves players to a different node before deleting
     * ```ts
     * client.lavalink.nodeManager.deleteNode("nodeId to delete", true);
     * ```
     */
    deleteNode(node, movePlayers = false) {
        const decodeNode = typeof node === "string" ? this.nodes.get(node) : node || this.leastUsedNodes()[0];
        if (!decodeNode)
            throw new Error("Node was not found");
        if (movePlayers)
            decodeNode.destroy(DestroyReasons.NodeDeleted, true, true);
        else
            decodeNode.destroy(DestroyReasons.NodeDeleted);
        this.nodes.delete(decodeNode.id);
        return;
    }
}
