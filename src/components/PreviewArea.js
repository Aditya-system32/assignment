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
  const [selectedSpriteIds, setSelectedSpriteIds] = useState([]);
  const [coll, setColl] = useState(true);

  const collisionCooldownRef = useRef(false);

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

  const swapAnimations = (sprite1, sprite2, setSprites) => {
    console.log(
      `Swapping animations between sprite ${sprite1.id} and sprite ${sprite2.id}`
    );

    setSprites((prevSprites) =>
      prevSprites.map((sprite) => {
        if (sprite.id === sprite1.id) {
          return {
            ...sprite,
            script: sprite2.script,
            executionToken: (sprite.executionToken || 0) + 1,
            run: false,
          };
        } else if (sprite.id === sprite2.id) {
          return {
            ...sprite,
            script: sprite1.script,
            executionToken: (sprite.executionToken || 0) + 1,
            run: false,
          };
        }
        return sprite;
      })
    );
  };

  useEffect(() => {
    const checkCollisions = async () => {
      if (collisionCooldownRef.current) return; // Skip if cooldown is active

      for (let i = 0; i < sprites.length; i++) {
        for (let j = i + 1; j < sprites.length; j++) {
          const sprite1 = sprites[i];
          const sprite2 = sprites[j];

          if (detectCollision(sprite1, sprite2) && coll) {
            console.log(
              `Collision detected between sprite ${sprite1.id} and sprite ${sprite2.id}`
            );

            // Prevent immediate repeated collisions
            collisionCooldownRef.current = true;
            setColl(false);

            // Stop current scripts
            runningSpritesRef.current.clear();

            // Swap animations
            await swapAnimations(sprite1, sprite2, setSprites);

            // Restart script execution for swapped sprites
            setTimeout(() => {
              setSprites((prev) =>
                prev.map((sprite) =>
                  sprite.id === sprite1.id || sprite.id === sprite2.id
                    ? { ...sprite, run: true }
                    : sprite
                )
              );
            }, 100);

            // Reset cooldown after 1000ms
            setTimeout(() => {
              collisionCooldownRef.current = false;
              setColl(true);
              console.log("Cooldown reset, collisions allowed again.");
            }, 1000);

            return; // Exit after handling the first collision
          }
        }
      }
    };
    const interval = setInterval(checkCollisions, 100);

    return () => clearInterval(interval);
  }, [sprites, setSprites]);

  const executeScript = async (
    blocks,
    spriteId,
    nested = false,
    token = null
  ) => {
    console.log(`Executing script for sprite ${spriteId}`);

    const sprite = sprites.find((s) => s.id === spriteId);
    const tokenAtStart = sprites.executionToken;
    if (
      !sprite ||
      !sprite.run ||
      (!nested && runningSpritesRef.current.has(spriteId))
    ) {
      console.log(`Script execution skipped for sprite ${spriteId}`);
      return;
    }

    if (!nested) {
      runningSpritesRef.current.add(spriteId);
    }

    try {
      for (const block of blocks) {
        const latestSprite = sprites.find((s) => s.id === spriteId);
        if (token !== null && latestSprite.executionToken !== token) {
          console.log(
            `Script execution for sprite ${spriteId} aborted due to token mismatch.`
          );
          return;
        }
        if (!sprite.run || !runningSpritesRef.current.has(spriteId)) break;
        switch (block.type) {
          case "move":
            const radians = (sprite.direction * Math.PI) / 180;
            const totalDistance = block.value;
            let movedDistance = 0;
            const stepSize = 1;

            while (Math.abs(movedDistance) < Math.abs(totalDistance)) {
              if (!sprite.run || !runningSpritesRef.current.has(spriteId))
                break;

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
                    const maxX = container ? container.clientWidth - 100 : 500;
                    const maxY = container ? container.clientHeight - 100 : 300;

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
              prev.map((s) => (s.id === spriteId ? { ...s, thinking: "" } : s))
            );
            break;

          case "repeat":
            const repeatCount = block.value;
            const currentIndex = blocks.indexOf(block);
            const blocksToRepeat = blocks.slice(0, currentIndex);

            for (let i = 0; i < repeatCount; i++) {
              if (collisionCooldownRef.current) {
                console.log(
                  `Collision detected during repeat for sprite ${spriteId}, stopping loop.`
                );
                break; // Exit the loop immediately if a collision is detected
              }
              const sprite = sprites.find((s) => s.id === spriteId);

              if (!sprite.run || !runningSpritesRef.current.has(spriteId))
                break;
              console.log(
                `Iteration ${i + 1} of repeat for sprite ${spriteId}`
              );

              // Execute each repeat block
              for (const repeatBlock of blocksToRepeat) {
                await executeScript(
                  [repeatBlock],
                  spriteId,
                  true,
                  sprite.executionToken
                );
              }

              // 🚨 Exit early if token changed (script swapped)
              const updatedSprite = sprites.find((s) => s.id === spriteId);
              if (updatedSprite.executionToken !== sprite.executionToken) {
                console.log(
                  `Execution token changed for sprite ${spriteId}, stopping repeat.`
                );
                return;
              }
            }
            break;

          default:
            console.warn(`Unknown block type: ${block.type}`);
        }
        await delay(300);
      }
    } finally {
      if (!nested) {
        console.log(`Finished executing script for sprite ${spriteId}`);
        setSprites((prev) =>
          prev.map((s) => (s.id === spriteId ? { ...s, run: false } : s))
        );
        console.log(`Removing sprite ${spriteId} from running set.`);

        runningSpritesRef.current.delete(spriteId);
      }
    }
  };

  useEffect(() => {
    sprites.forEach((sprite) => {
      if (sprite.run && Array.isArray(sprite.script)) {
        // Only start execution if sprite is not already running
        if (!runningSpritesRef.current.has(sprite.id)) {
          console.log(`Starting script execution for sprite ${sprite.id}`);
          executeScript(sprite.script, sprite.id, false, sprite.executionToken); // Pass nested=false
        } else {
          console.log(
            `Skipping execution for sprite ${sprite.id} because it's already running.`
          );
        }
      }
    });
  }, [sprites]);

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
                  }`}
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
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent button's onClick
                      setSprites((prev) =>
                        prev.filter((s) => s.id !== sprite.id)
                      ); // Remove the sprite
                    }}
                    className="bg-red-600 w-20 rounded text-white h-8 flex items-center justify-center cursor-pointer"
                  >
                    Delete
                  </div>
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
                    executionToken: 0,
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
