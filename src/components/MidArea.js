// components/ScriptArea.js
import React from "react";
import { DropTarget } from "react-dnd";

const scriptTarget = {
  drop(props, monitor, component) {
    const item = monitor.getItem();
    component.addBlock(item);
  },
};

class ScriptArea extends React.Component {
  state = {
    blocks: [],
  };

  addBlock = (block) => {
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];

        // Check if last block is repeat and is waiting for subBlocks
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === "repeat") {
          if (!lastBlock.subBlocks) lastBlock.subBlocks = [];
          lastBlock.subBlocks.push(block);
        } else {
          blocks.push(block);
        }

        return { blocks };
      },
      () => this.props.onScriptUpdate(this.state.blocks)
    );
  };

  render() {
    const { connectDropTarget } = this.props;

    return connectDropTarget(
      <div className="bg-white-700 p-4 min-h-[200px] w-full rounded shadow">
        <h4 className="font-bold mb-3">Script Area</h4>
        {this.state.blocks.map((b, i) => (
          <div
            key={i}
            className="bg-blue-500 text-white px-4 py-2 mb-2 mt-2 rounded shadow cursor-pointer flex items-center gap-2 justify-center"
          >
            {b.type}:{" "}
            {typeof b.value === "object"
              ? `x:${b.value.x}, y:${b.value.y}`
              : b.value}
          </div>
        ))}
      </div>
    );
  }
}

export default DropTarget("BLOCK", scriptTarget, (connect) => ({
  connectDropTarget: connect.dropTarget(),
}))(ScriptArea);
