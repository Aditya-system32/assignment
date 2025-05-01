import React, { useState, useEffect } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ script }) {
  const [run, setRun] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0);
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState("");
  const [spriteName, setSpriteName] = useState("Cat");
  const [size, setSize] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    const executeScript = async (blocks) => {
      for (const block of blocks) {
        if (block.type === "move") {
          const radians = (direction * Math.PI) / 180;
          setPosition((prev) => ({
            x: prev.x + Math.cos(radians) * block.value,
            y: prev.y + Math.sin(radians) * block.value,
          }));
        } else if (block.type === "turn-right") {
          setDirection((prev) => (prev + block.value) % 360);
        } else if (block.type === "turn-left") {
          setDirection((prev) => (prev - block.value + 360) % 360);
        } else if (block.type === "goto") {
          setPosition(block.value);
        } else if (block.type === "say") {
          setMessage(block.value);
          await delay(block.duration * 1000);
          setMessage("");
        } else if (block.type === "think") {
          setThinking(block.value);
          await delay(block.duration * 1000);
          setThinking("");
        } else if (block.type === "repeat") {
          for (let i = 0; i < block.value; i++) {
            console.log(block);
            if (block.subscript) {
              await executeScript(block.subscript);
            }
          }
        }
        await delay(300);
      }
    };

    if (run && Array.isArray(script)) {
      executeScript(script).finally(() => setRun(false));
    }
  }, [run]);
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const spriteElement = e.currentTarget;
    const spriteBounds = spriteElement.getBoundingClientRect();

    setDragOffset({
      x: e.clientX - spriteBounds.left,
      y: e.clientY - spriteBounds.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = document.querySelector(".preview-container");
    const sprite = document.querySelector(".cat-sprite"); // Add class="cat-sprite" to CatSprite component

    if (!container || !sprite) return;

    const containerBounds = container.getBoundingClientRect();
    const spriteBounds = sprite.getBoundingClientRect();

    // Calculate maximum positions considering sprite size
    const maxX = containerBounds.width - spriteBounds.width;
    const maxY = containerBounds.height - spriteBounds.height;

    // Calculate new position with boundaries
    const newX = Math.min(
      Math.max(0, e.clientX - containerBounds.left - dragOffset.x),
      maxX
    );
    const newY = Math.min(
      Math.max(0, e.clientY - containerBounds.top - dragOffset.y),
      maxY
    );

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleStart = () => {
    setRun(false);
    setTimeout(() => setRun(true), 50);
  };

  const handleSizeChange = (e) => {
    if (isNaN(e.target.value) || e.target.value === "") return;
    setSize(e.target.value);
  };

  const handleXChange = (value) => {
    if (isNaN(value) || value === "") return;
    setPosition((prev) => ({ ...prev, x: value }));
  };

  const handleYChange = (value) => {
    if (isNaN(value) || value === "") return;
    setPosition((prev) => ({ ...prev, y: value }));
  };

  return (
    <div className="flex-none h-full w-full bg-blue-100 overflow-y-auto p-2">
      <div
        className="preview-container w-full h-1/2 bg-white rounded-lg relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            position: "absolute", // Change from relative to absolute
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? "grabbing" : "grab",
            transform: `scale(${size / 100})`,
            transformOrigin: "top left",
          }}
          className="cat-sprite" // Add this class
          onMouseDown={handleMouseDown}
        >
          <CatSprite
            script={script}
            run={run}
            position={position}
            setPosition={setPosition}
            direction={direction}
            setDirection={setDirection}
            message={message}
            setMessage={setMessage}
            thinking={thinking}
            setThinking={setThinking}
            size={size}
          />
        </div>
      </div>

      <div className="w-full h-1/2 rounded-lg mt-3 flex justify-between gap-3">
        <div className="flex-1 bg-blue-100 rounded-lg border border-red-200 shadow">
          <div className="gap-5 bg-white p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <p>Sprite</p>
              <input
                className="rounded-full px-2 py-1 w-19 border border-grey-500 shadow h-9"
                placeholder="name"
                value={spriteName}
                onChange={(e) => setSpriteName(e.target.value)}
              />
              <p>x-axis</p>
              <input
                className="w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                value={position.x}
                onChange={(e) => handleXChange(e.target.value)}
              />
              <p>y-axis</p>
              <input
                className="w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                value={position.y}
                onChange={(e) => handleYChange(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 mt-3 justify-between">
              <div className="flex items-center gap-3">
                <p>Show</p>
                <button> On</button>
                <button>Off</button>
              </div>

              <div className="flex items-center">
                <p>Size</p>
                <input
                  className="ml-2 w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                  value={size}
                  onChange={handleSizeChange}
                />
              </div>
              <div className="flex items-center">
                <p>Direction</p>
                <input
                  className="ml-2 w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                  value={direction}
                  onChange={(e) => {
                    if (isNaN(e.target.value) || e.target.value === "") return;
                    setDirection(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <button
              className="w-20 m-2 bg-white rounded-lg flex flex-col items-center border border-grey-500 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              onClick={() => {
                // Add your button click handler here
                setPosition({ x: 0, y: 0 }); // Example: Reset position
              }}
            >
              <div className="w-20 h-20 flex items-center justify-center">
                <CatSprite size={50} />
              </div>
              <p className="text-center text-sm font-medium mb-2">
                {spriteName}
              </p>
            </button>
          </div>
        </div>

        <div className="w-16 bg-white rounded-lg p-2 shadow">
          <p className="text-center">Stage</p>
          <button onClick={handleStart}>start</button>
        </div>
      </div>
    </div>
  );
}
