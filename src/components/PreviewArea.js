import React, { useState, useEffect } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ script, sprites, setSprites }) {
  const [run, setRun] = useState(false);

  const [direction, setDirection] = useState(0);
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState("");
  const [spriteName, setSpriteName] = useState("Cat");
  const [size, setSize] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedSpriteId, setSelectedSpriteId] = useState(null);

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
  const handleMouseDown = (e, spriteId) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedSpriteId(spriteId);

    const spriteElement = e.currentTarget;
    const spriteBounds = spriteElement.getBoundingClientRect();

    setDragOffset({
      x: e.clientX - spriteBounds.left,
      y: e.clientY - spriteBounds.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedSpriteId) return;

    const container = document.querySelector(".preview-container");
    const sprite = document.querySelector(
      `[data-sprite-id="${selectedSpriteId}"]`
    );

    if (!container || !sprite) return;

    const containerBounds = container.getBoundingClientRect();
    const spriteBounds = sprite.getBoundingClientRect();

    // Calculate boundaries
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

    // Update the selected sprite's position
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId
          ? { ...sprite, position: { x: newX, y: newY } }
          : sprite
      )
    );
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
    if (!selectedSpriteId || isNaN(value) || value === "") return;
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId
          ? { ...sprite, position: { ...sprite.position, x: parseInt(value) } }
          : sprite
      )
    );
  };

  const handleYChange = (value) => {
    if (!selectedSpriteId || isNaN(value) || value === "") return;
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId
          ? { ...sprite, position: { ...sprite.position, y: parseInt(value) } }
          : sprite
      )
    );
  };

  const updateSelectedSprite = (updates) => {
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId ? { ...sprite, ...updates } : sprite
      )
    );
  };
  console.log(sprites);
  return (
    <div className="flex-none h-full w-full bg-blue-100 overflow-y-auto p-2">
      <div
        className="preview-container w-full h-1/2 bg-white rounded-lg relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {sprites.map((sprite) => (
          <div
            key={sprite.id}
            data-sprite-id={sprite.id}
            onClick={() => setSelectedSpriteId(sprite.id)}
            onMouseDown={(e) => handleMouseDown(e, sprite.id)}
            style={{
              position: "absolute",
              left: `${sprite.position.x}px`,
              top: `${sprite.position.y}px`,
              cursor:
                isDragging && selectedSpriteId === sprite.id
                  ? "grabbing"
                  : "grab",
              transform: `scale(${sprite.size / 100})`,
              transformOrigin: "center center",
              borderRadius: "20%",
              border:
                selectedSpriteId === sprite.id ? "2px solid blue" : "none",
              zIndex: selectedSpriteId === sprite.id ? 10 : 1,
            }}
            className="cat-sprite"
          >
            <CatSprite
              position={{ x: 0, y: 0 }} // Reset position since parent div handles positioning
              direction={sprite.direction}
              message={sprite.message}
              thinking={sprite.thinking}
              size={100} // Use 100 since we're scaling with the parent div
            />
          </div>
        ))}
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
                value={
                  selectedSpriteId
                    ? sprites.find((s) => s.id === selectedSpriteId)?.position
                        .x || 0
                    : 0
                }
                onChange={(e) => handleXChange(e.target.value)}
              />
              <p>y-axis</p>
              <input
                className="w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                value={
                  selectedSpriteId
                    ? sprites.find((s) => s.id === selectedSpriteId)?.position
                        .y || 0
                    : 0
                }
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
          <div className="flex flex-wrap gap-2 p-3">
            {sprites.map((sprite, index) => (
              <button
                key={index}
                className="w-24 p-2 bg-white rounded-lg flex flex-col items-center border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onClick={() => {
                  setPosition({ x: 0, y: 0 });
                  // Additional click handling
                }}
              >
                <div className="w-full aspect-square flex items-center justify-center">
                  <CatSprite size={60} />
                </div>
                <p className="text-center text-sm font-medium text-gray-600 mt-2">
                  {sprite.name || spriteName}
                </p>
              </button>
            ))}

            <button
              className="w-24 p-2 bg-green-500 text-white rounded-lg flex flex-col items-center justify-center border border-green-600 shadow-sm hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              onClick={() => {
                setSprites([
                  ...sprites,
                  {
                    id: 4,
                    name: "Jhinga",
                    size: 100,
                    position: { x: 10, y: 100 },
                    direction: 0,
                    script: [],
                    message: "Hmm...s",
                    run: false,
                    thinking: false,
                  },
                ]);
              }}
            >
              <div className="w-full aspect-square flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <p className="text-center text-sm font-medium mt-2">Add Sprite</p>
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
