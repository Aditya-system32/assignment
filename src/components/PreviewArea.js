import React, { useState, useEffect } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ script }) {
  const [run, setRun] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [direction, setDirection] = useState(0);
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState("");
  const [spriteName, setSpriteName] = useState("Cat");
  const [size, setSize] = useState(100);

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

  const handleStart = () => {
    setRun(false);
    setTimeout(() => setRun(true), 50);
  };

  const handleSizeChange = (e) => {
    if(isNaN(e.target.value) || e.target.value === "") return;
    setSize(e.target.value);
  }

  const handleXChange = (value) => {
    if(isNaN(value) || value === "") return;
    setPosition((prev) => ({ ...prev, x: value }));
  }

  const handleYChange = (value) => {
    if(isNaN(value) || value === "") return;
    setPosition((prev) => ({ ...prev, y: value }));
  }

  return (
    <div className="flex-none h-full w-full bg-gray-500 overflow-y-auto p-2">
      <div className="w-full h-1/2 bg-gray-300 rounded-lg">
        <div className="h-full">
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

      <div className="w-full h-1/2 bg-gray-300 rounded-lg mt-3 flex justify-between gap-3">
        <div className="flex-1 bg-gray-100 rounded-lg">
          <div className="gap-5 bg-green-500 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <p>Sprite</p>
              <input
                className="rounded-full px-2 py-1 w-19"
                placeholder="name"
                value={spriteName}
                onChange={(e) => setSpriteName(e.target.value)}
              />
              <p>x-axis</p>
              <input
                className="w-10 rounded-full outline-none text-center"
                value={position.x}
                onChange={(e)=> handleXChange(e.target.value)}
              />
              <p>y-axis</p>
              <input
                className="w-10 rounded-full outline-none text-center"
                value={position.y}
                onChange={(e)=> handleYChange(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <p>Show</p>
              <button>On</button>
              <button>Off</button>
              <p>Size</p>
              <input
                className="w-10 rounded-full outline-none text-center"
                value={size}
                onChange={handleSizeChange}
              />
              <p>Direction</p>
              <input
                className="w-10 rounded-full outline-none text-center"
                value={direction}
                readOnly
              />
            </div>
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
