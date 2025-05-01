import React from "react";
import { DropTarget } from "react-dnd";
import PropTypes from "prop-types";

const scriptTarget = {
  drop(props, monitor, component) {
    const item = monitor.getItem();
    if (!item || !props.selectedSpriteId) return;

    const newBlock = {
      type: item.type,
      value: item.value,
      duration: item.duration,
      subBlocks: item.subBlocks || [], // Preserve subBlocks
    };

    component.addBlock(newBlock); // Add the block immediately
  },
  canDrop(props) {
    return !!props.selectedSpriteId;
  },
};

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
});

class ScriptArea extends React.Component {
  static propTypes = {
    sprites: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        script: PropTypes.array,
      })
    ).isRequired,
    selectedSpriteId: PropTypes.number,
    onScriptUpdate: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
  };

  state = {
    blocks: [],
  };

  componentDidUpdate(prevProps) {
    if (prevProps.selectedSpriteId !== this.props.selectedSpriteId) {
      const sprite = this.props.sprites.find(
        (s) => s.id === this.props.selectedSpriteId
      );
      this.setState({ blocks: sprite?.script || [] });
    }
  }

  addBlock = (block) => {
    if (!this.props.selectedSpriteId) return;
  
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];
        const lastBlock = blocks[blocks.length - 1];
  
        // If the last block is a "repeat" block, add to its subBlocks
        if (lastBlock && lastBlock.type === "repeat") {
          lastBlock.subBlocks.push(block);
        } else {
          blocks.push(block);
        }
  
        return { blocks };
      },
      () => {
        this.props.onScriptUpdate(this.state.blocks, this.props.selectedSpriteId);
      }
    );
  };

  removeBlock = (index) => {
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];
        blocks.splice(index, 1);
        return { blocks };
      },
      () => {
        this.props.onScriptUpdate(
          this.state.blocks,
          this.props.selectedSpriteId
        );
      }
    );
  };

  removeSubBlock = (parentIndex, subIndex) => {
    this.setState(
      (prev) => {
        const blocks = [...prev.blocks];
        blocks[parentIndex].subBlocks.splice(subIndex, 1);
        return { blocks };
      },
      () => {
        this.props.onScriptUpdate(
          this.state.blocks,
          this.props.selectedSpriteId
        );
      }
    );
  };

  render() {
    const { connectDropTarget, selectedSpriteId } = this.props;

    if (!selectedSpriteId) {
      return (
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          Select a sprite to edit its script
        </div>
      );
    }

    return connectDropTarget(
      <div className="bg-white-700 p-4 min-h-[200px] h-full w-full rounded shadow">
        <h4 className="font-bold mb-3">Script Area</h4>
        {this.state.blocks.map((block, index) => (
          <div
            key={index}
            className="bg-blue-500 text-white px-4 py-2 mb-2 rounded shadow"
          >
            <div className="flex justify-between items-center">
              <span>
                {block.type}:{" "}
                {typeof block.value === "object"
                  ? `x:${block.value.x}, y:${block.value.y}`
                  : block.value}
              </span>
              <button
                onClick={() => this.removeBlock(index)}
                className="ml-2 text-red-300 hover:text-red-500"
              >
                ❌
              </button>
            </div>

            {block.type === "repeat" && block.subBlocks?.length > 0 && (
              <div className="ml-4 mt-2 bg-blue-300 p-2 rounded">
                {block.subBlocks.map((subBlock, subIndex) => (
                  <div
                    key={subIndex}
                    className="flex justify-between items-center text-sm bg-blue-400 text-white px-2 py-1 my-1 rounded"
                  >
                    <span>
                      {subBlock.type}:{" "}
                      {typeof subBlock.value === "object"
                        ? `x:${subBlock.value.x}, y:${subBlock.value.y}`
                        : subBlock.value}
                    </span>
                    <button
                      onClick={() => this.removeSubBlock(index, subIndex)}
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

function MidArea({ sprites, selectedSpriteId, onScriptUpdate }) {
  return (
    <div className="flex-1 h-full overflow-y-auto p-4">
      <WrappedScriptArea
        sprites={sprites}
        selectedSpriteId={selectedSpriteId}
        onScriptUpdate={onScriptUpdate}
        blocks={sprites.find((s) => s.id === selectedSpriteId)?.script || []}
      />
    </div>
  );
}

const WrappedScriptArea = DropTarget(
  "BLOCK", // Match this with the drag source type in Block.js
  scriptTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  })
)(ScriptArea);

MidArea.propTypes = {
  sprites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      script: PropTypes.array,
    })
  ).isRequired,
  selectedSpriteId: PropTypes.number,
  onScriptUpdate: PropTypes.func.isRequired,
};

export default MidArea;
