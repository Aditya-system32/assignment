// components/Block.js
import React, { Component } from "react";
import { DragSource } from "react-dnd";

const blockSource = {
  beginDrag(props, monitor, component) {
    return {
      type: props.type,
      value: component?.state?.inputValue || 0,
      duration: component?.state?.duration || 0,
    };
  },
};

class Block extends Component {
  constructor(props) {
    super(props);
    this.state = {
        inputValue: props.initialValue || "Hello",
        duration: props.duration || 2,
    };
  }

  handleTextChange = (e) => {
    this.setState({ inputValue: e.target.value });
  };

  handleDurationChange = (e) => {
    this.setState({ duration: parseInt(e.target.value) || 0 });
  };

  handleChange = (e) => {
    if(isNaN(e.target.value)) return;
    this.setState({ inputValue: parseInt(e.target.value) || 0 });
  };

  handleGotoChange = (coord, value) => {
    this.setState((prevState) => ({
      inputValue: {
        ...prevState.inputValue,
        [coord]: parseInt(value) || 0,
      },
    }));
  };

  render() {
    const { connectDragSource, type, icon } = this.props;
    const { inputValue, duration } = this.state;

    return connectDragSource(
      <div className="bg-blue-500 text-white px-4 py-2 mb-2 mt-2 rounded shadow cursor-pointer flex items-center gap-2">
        {type === "move" && (
          <span>
            Move{" "}
            <input
              type="text"
              value={inputValue}
              onChange={this.handleChange}
              className="w-12 text-black px-1 rounded"
            />{" "}
            steps {icon && <span className="inline-block">{icon}</span>}
          </span>
        )}

        {type === "turn-left" && (
          <span>
            Turn{" "}
            {icon && <span className="inline-block mx-1">{icon}</span>}
            <input
              type="text"
              value={inputValue}
              onChange={this.handleChange}
              className="w-12 text-black px-1 rounded"
            />{" "}
            degrees
          </span>
        )}

        {type === "turn-right" && (
          <span>
            Turn{" "}
            {icon && <span className="inline-block mx-1">{icon}</span>}
            <input
              type="text"
              value={inputValue}
              onChange={this.handleChange}
              className="w-12 text-black px-1 rounded"
            />{" "}
            degrees
          </span>
        )}

        {type === "goto" && (
          <span>
            Go to{" "}
            {icon && <span className="inline-block mx-1">{icon}</span>} x:{" "}
            <input
              type="text"
              value={inputValue.x || 0}
              onChange={(e) => this.handleGotoChange("x", e.target.value)}
              className="w-12 text-black px-1 rounded"
            />{" "}
            y:{" "}
            <input
              type="text"
              value={inputValue.y || 0}
              onChange={(e) => this.handleGotoChange("y", e.target.value)}
              className="w-12 text-black px-1 rounded"
            />
          </span>
        )}
        {type === "say" && (
          <span>
            Say{" "}
            <input
              type="text"
              value={inputValue}
              onChange={this.handleTextChange}
              className="w-24 text-black px-1 rounded"
            />{" "}
            for{" "}
            <input
              type="number"
              value={duration}
              onChange={this.handleDurationChange}
              className="w-12 text-black px-1 rounded"
            />{" "}
            seconds
          </span>
        )}

        {type === "think" && (
          <span>
            Think{" "}
            <input
              type="text"
              value={inputValue}
              onChange={this.handleTextChange}
              className="w-24 text-black px-1 rounded"
            />{" "}
            for{" "}
            <input
              type="number"
              value={duration}
              onChange={this.handleDurationChange}
              className="w-12 text-black px-1 rounded"
            />{" "}
            seconds
          </span>
        )}
      </div>
    );
  }
}

export default DragSource("BLOCK", blockSource, (connect) => ({
  connectDragSource: connect.dragSource(),
}))(Block);
