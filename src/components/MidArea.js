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

  removeBlock = (index) => {
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];
        blocks.splice(index, 1);
        return { blocks };
      },
      () => this.props.onScriptUpdate(this.state.blocks)
    );
  };

  removeSubBlock = (parentIndex, subIndex) => {
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];
        const subBlocks = blocks[parentIndex].subBlocks || [];
        subBlocks.splice(subIndex, 1);
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
            className="bg-blue-500 text-white px-4 py-2 mb-2 rounded shadow"
          >
            <div className="flex justify-between items-center">
              <span>
                {b.type}:{" "}
                {typeof b.value === "object"
                  ? `x:${b.value.x}, y:${b.value.y}`
                  : b.value}
              </span>
              <button
                onClick={() => this.removeBlock(i)}
                className="ml-2 text-red-300 hover:text-red-500"
              >
                ❌
              </button>
            </div>

            {b.type === "repeat" && b.subBlocks?.length > 0 && (
              <div className="ml-4 mt-2 bg-blue-300 p-2 rounded">
                {b.subBlocks.map((sb, si) => (
                  <div
                    key={si}
                    className="flex justify-between items-center text-sm bg-blue-400 text-white px-2 py-1 my-1 rounded"
                  >
                    <span>
                      {sb.type}:{" "}
                      {typeof sb.value === "object"
                        ? `x:${sb.value.x}, y:${sb.value.y}`
                        : sb.value}
                    </span>
                    <button
                      onClick={() => this.removeSubBlock(i, si)}
                      className="text-red-300 hover:text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
}

export default DropTarget("BLOCK", scriptTarget, (connect) => ({
  connectDropTarget: connect.dropTarget(),
}))(ScriptArea);
