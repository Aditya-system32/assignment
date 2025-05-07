import React, { useState, useEffect, useRef } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({
  sprites,
  setSprites,
  selectedSpriteId,
  setSelectedSpriteId,
}) {
  const runningSpritesRef = useRef(new Set());
  const [direction, setDirection] = useState(0);
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState("");
  const [spriteName, setSpriteName] = useState("Cat");
  const [size, setSize] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSpriteIds, setSelectedSpriteIds] = useState([]); // Array of selected sprite IDs

  const delay = React.useCallback(
    (ms) => new Promise((res) => setTimeout(res, ms)),
    []
  );

  const detectCollision = (sprite1, sprite2) => {
    const size1 = sprite1.size / 2;
    const size2 = sprite2.size / 2;

    const x1 = sprite1.position.x + size1;
    const y1 = sprite1.position.y + size1;
    const x2 = sprite2.position.x + size2;
    const y2 = sprite2.position.y + size2;

    const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    return distance < size1 + size2; // Collision occurs if the distance is less than the sum of radii
  };

  const swapAnimations = async (sprite1, sprite2, setSprites) => {
    setSprites((prevSprites) =>
      prevSprites.map((sprite) => {
        if (sprite.id === sprite1.id) {
          return { ...sprite, script: sprite2.script, run: true }; // Restart script for sprite1
        } else if (sprite.id === sprite2.id) {
          return { ...sprite, script: sprite1.script, run: true }; // Restart script for sprite2
        }
        return sprite;
      })
    );

    // Restart the execution script for both sprites
    if (sprite1.run) {
      await executeScript(sprite1.script, sprite1.id);
    }
    if (sprite2.run) {
      await executeScript(sprite2.script, sprite2.id);
    }
  };

  useEffect(() => {
    const checkCollisions = async () => {
      for (let i = 0; i < sprites.length; i++) {
        for (let j = i + 1; j < sprites.length; j++) {
          const sprite1 = sprites[i];
          const sprite2 = sprites[j];

          if (detectCollision(sprite1, sprite2)) {
            await swapAnimations(sprite1, sprite2, setSprites);
          }
        }
      }
    };

    const interval = setInterval(checkCollisions, 100); // Check for collisions every 100ms

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [sprites, setSprites]);

  useEffect(() => {
    // Skip if not running
    const executeScript = async (blocks, spriteId) => {
      const sprite = sprites.find((s) => s.id === spriteId);
      if (!sprite || !sprite.run || runningSpritesRef.current.has(spriteId)) {
        return;
      }

      runningSpritesRef.current.add(spriteId);

      try {
        for (const block of blocks) {
          if (!sprite.run) break;

          switch (block.type) {
            case "move":
              const radians = (sprite.direction * Math.PI) / 180;
              const totalDistance = block.value;
              let movedDistance = 0;
              const stepSize = 1;

              while (Math.abs(movedDistance) < Math.abs(totalDistance)) {
                await new Promise((resolve) => {
                  setSprites((prev) =>
                    prev.map((s) => {
                      if (s.id !== spriteId) return s;

                      const stepX =
                        Math.cos(radians) * stepSize * Math.sign(totalDistance);
                      const stepY =
                        Math.sin(radians) * stepSize * Math.sign(totalDistance);

                      const newX = s.position.x + stepX;
                      const newY = s.position.y + stepY;

                      const container =
                        document.querySelector(".preview-container");
                      const maxX = container
                        ? container.clientWidth - 100
                        : 500;
                      const maxY = container
                        ? container.clientHeight - 100
                        : 300;

                      const constrainedX = Math.min(Math.max(0, newX), maxX);
                      const constrainedY = Math.min(Math.max(0, newY), maxY);

                      movedDistance += Math.sqrt(stepX ** 2 + stepY ** 2);

                      return {
                        ...s,
                        position: {
                          x: constrainedX,
                          y: constrainedY,
                        },
                      };
                    })
                  );
                  setTimeout(resolve, 10); // Small delay for smooth animation
                });
              }
              break;

            case "goto":
              const { x, y } = block.value; // Extract x and y coordinates
              const container = document.querySelector(".preview-container");
              setSprites((prev) =>
                prev.map((s) =>
                  s.id === spriteId
                    ? {
                        ...s,
                        position: {
                          x: Math.min(
                            Math.max(0, x),
                            container.clientWidth - 100
                          ), // Constrain within container
                          y: Math.min(
                            Math.max(0, y),
                            container.clientHeight - 100
                          ), // Constrain within container
                        },
                      }
                    : s
                )
              );
              break;

            case "turn-right":
            case "turn-left":
              const angleChange =
                block.type === "turn-right" ? block.value : -block.value;
              setSprites((prev) =>
                prev.map((s) =>
                  s.id === spriteId
                    ? {
                        ...s,
                        direction: (s.direction + angleChange + 360) % 360,
                      }
                    : s
                )
              );
              break;

            case "say":
              setSprites((prev) =>
                prev.map((s) =>
                  s.id === spriteId ? { ...s, message: block.value } : s
                )
              );
              await delay(block.duration * 1000);
              setSprites((prev) =>
                prev.map((s) => (s.id === spriteId ? { ...s, message: "" } : s))
              );
              break;

            case "think":
              setSprites((prev) =>
                prev.map((s) =>
                  s.id === spriteId ? { ...s, thinking: block.value } : s
                )
              );
              await delay(block.duration * 1000); // Wait for the specified duration
              setSprites((prev) =>
                prev.map((s) =>
                  s.id === spriteId ? { ...s, thinking: "" } : s
                )
              );
              break;

            case "repeat":
              const repeatCount = block.value; // Number of times to repeat
              const currentIndex = blocks.indexOf(block); // Find the index of the "repeat" block
              const blocksToRepeat = blocks.slice(0, currentIndex); // Get all blocks above the "repeat" block

              // Remove the spriteId from runningSpritesRef before repeating
              runningSpritesRef.current.delete(spriteId);

              for (let i = 0; i < repeatCount; i++) {
                console.log(`Iteration ${i + 1} of repeat`);
                for (const repeatBlock of blocksToRepeat) {
                  if (!sprite.run) break; // Stop if the sprite is no longer running
                  await executeScript([repeatBlock], spriteId); // Execute each block recursively
                }
                await delay(300); // Add a delay between iterations for smoother movement
              }

              // Ensure the spriteId is removed after the repeat block finishes
              runningSpritesRef.current.delete(spriteId);
              break;
            default:
              console.warn(`Unknown block type: ${block.type}`);
          }
          await delay(300);
        }
      } finally {
        setSprites((prev) =>
          prev.map((s) => (s.id === spriteId ? { ...s, run: false } : s))
        );
        runningSpritesRef.current.delete(spriteId); // Mark sprite as finished
      }
    };

    // Execute scripts for all running sprites
    sprites.forEach((sprite) => {
      if (sprite.run && Array.isArray(sprite.script)) {
        executeScript(sprite.script, sprite.id);
      }
    });
  }, [sprites, delay, setSprites]);

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
  const handleDirectionChange = (value) => {
    if (!selectedSpriteId) return;
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId
          ? { ...sprite, direction: value === "" ? "" : parseInt(value, 10) } // Allow empty value
          : sprite
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleStart = () => {
    if (selectedSpriteIds.length === 0) return; // Do nothing if no sprites are selected
    setSprites((prev) =>
      prev.map(
        (sprite) =>
          selectedSpriteIds.includes(sprite.id)
            ? { ...sprite, run: true } // Start only selected sprites
            : { ...sprite, run: false } // Ensure other sprites are not running
      )
    );
  };

  const handleSizeChange = (value) => {
    if (!selectedSpriteId) return;
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === selectedSpriteId
          ? { ...sprite, size: value === "" ? "" : parseInt(value, 10) } // Allow empty value
          : sprite
      )
    );
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
  return (
    <div className="flex-none h-full w-full bg-blue-100 overflow-y-auto p-2">
      <button
        onClick={handleStart} // Start all selected sprites
        className="w-36 right-3 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Start Selected
      </button>

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
            onClick={(e) => {
              if (e.ctrlKey) {
                // Toggle selection with Ctrl + Click
                setSelectedSpriteIds(
                  (prev) =>
                    prev.includes(sprite.id)
                      ? prev.filter((id) => id !== sprite.id) // Deselect if already selected
                      : [...prev, sprite.id] // Add to selection if not already selected
                );
              } else {
                // Single selection without Ctrl
                setSelectedSpriteIds([sprite.id]);
              }
            }}
            onMouseDown={(e) => handleMouseDown(e, sprite.id)}
            style={{
              position: "absolute",
              left: `${sprite.position.x}px`,
              top: `${sprite.position.y}px`,
              cursor:
                isDragging && selectedSpriteIds.includes(sprite.id)
                  ? "grabbing"
                  : "grab",
              transform: `scale(${sprite.size / 100})`,
              transformOrigin: "center center",
              borderRadius: "20%",
              border: selectedSpriteIds.includes(sprite.id)
                ? "2px solid blue"
                : "none", // Highlight selected sprites
              zIndex: selectedSpriteIds.includes(sprite.id) ? 10 : 1,
            }}
            className="cat-sprite"
          >
            <CatSprite
              position={{ x: 0, y: 0 }}
              direction={sprite.direction}
              message={sprite.message}
              thinking={sprite.thinking}
              size={100}
            />
          </div>
        ))}
      </div>

      <div className="w-full h-1/2 rounded-lg mt-3 flex flex-col lg:flex-row justify-between gap-3">
        <div className="flex-1 bg-blue-100 rounded-lg border border-red-200 shadow">
          <div className="gap-5 bg-white p-3 rounded-lg">
            <div className="flex flex-wrap gap-3 items-center">
              <p>Sprite</p>
              <input
                className="rounded-full px-2 py-1 w-full sm:w-32 border border-grey-500 shadow h-9"
                placeholder="name"
                value={
                  selectedSpriteId
                    ? sprites.find((s) => s.id === selectedSpriteId)?.name || ""
                    : ""
                }
                onChange={(e) => {
                  const newName = e.target.value;
                  setSprites((prev) =>
                    prev.map((sprite) =>
                      sprite.id === selectedSpriteId
                        ? { ...sprite, name: newName }
                        : sprite
                    )
                  );
                }}
              />
              <p>x-axis</p>
              <input
                className="w-full sm:w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
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
                className="w-full sm:w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                value={
                  selectedSpriteId
                    ? sprites.find((s) => s.id === selectedSpriteId)?.position
                        .y || 0
                    : 0
                }
                onChange={(e) => handleYChange(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-6 mt-3">
              <div className="flex items-center">
                <p>Size</p>
                <input
                  className="ml-2 w-full sm:w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                  value={
                    selectedSpriteId
                      ? sprites.find((s) => s.id === selectedSpriteId)?.size ??
                        ""
                      : ""
                  }
                  onChange={(e) => handleSizeChange(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <p>Direction</p>
                <input
                  className="ml-2 w-full sm:w-14 h-8 rounded-full outline-none text-center border border-grey-500 shadow"
                  value={
                    selectedSpriteId
                      ? sprites.find((s) => s.id === selectedSpriteId)
                          ?.direction ?? ""
                      : ""
                  }
                  onChange={(e) => handleDirectionChange(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {sprites.map((sprite, index) => (
              <div key={index}>
                <button
                  className={`w-full sm:w-1/2 lg:w-24 p-2 rounded-lg flex flex-col items-center border shadow-sm hover:bg-gray-50 bg-white focus:outline-none transition-all ${
                    selectedSpriteIds.includes(sprite.id)
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`} // Add blue border if selected
                  onClick={(e) => {
                    if (e.ctrlKey) {
                      // Toggle selection with Ctrl + Click
                      setSelectedSpriteIds(
                        (prev) =>
                          prev.includes(sprite.id)
                            ? prev.filter((id) => id !== sprite.id) // Deselect if already selected
                            : [...prev, sprite.id] // Add to selection if not already selected
                      );
                    } else {
                      // Single selection without Ctrl
                      setSelectedSpriteIds([sprite.id]);
                    }
                  }}
                >
                  <div className="w-full aspect-square flex items-center justify-center">
                    <CatSprite size={60} />
                  </div>
                  <p className="text-center text-sm font-medium text-gray-600 mt-2">
                    {sprite.name || spriteName}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent button's onClick
                      setSprites((prev) =>
                        prev.filter((s) => s.id !== sprite.id)
                      ); // Remove the sprite
                    }}
                    className="bg-red-600 w-20 rounded text-white h-8"
                  >
                    Delete
                  </button>
                </button>
              </div>
            ))}

            <button
              className="w-full sm:w-1/2 lg:w-24 p-2 bg-green-500 text-white rounded-lg flex flex-col items-center justify-center border border-green-600 shadow-sm hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              onClick={() => {
                const container = document.querySelector(".preview-container");
                const maxX = container ? container.clientWidth - 100 : 500;
                const maxY = container ? container.clientWidth - 200 : 300;
                const randomX = Math.floor(Math.random() * maxX);
                const randomY = Math.floor(Math.random() * maxY);
                setSprites([
                  ...sprites,
                  {
                    id: Math.random(),
                    name: "Mouse",
                    size: 100,
                    position: { x: randomX, y: randomY },
                    direction: 0,
                    script: [],
                    message: "",
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

        <div className="w-full lg:w-16 bg-white rounded-lg p-2 shadow">
          <p className="text-center">Stage</p>
        </div>
      </div>
    </div>
  );
}
