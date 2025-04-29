// components/Sprite.js
import React, { useState,useEffect } from "react";

const Sprite = ({ script,run }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
      const runScript = async () => {
        for (const block of script) {
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
            // Display message
            setSpeech(block.value);
            await delay(block.duration * 1000); // Convert seconds to milliseconds
          } else if (block.type === "think") {
            // Display thinking bubble
            setThinking(block.value);
            await delay(block.duration * 1000); // Convert seconds to milliseconds
          }
          await delay(300);
        }
      };
      if (run) {
        
        runScript();
        
      }
    }, [run, script]);

  return (
    <div className="relative w-full h-64 border rounded mt-4">
      <div
        className="w-12 h-12 bg-blue-600 absolute transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
          transform: `rotate(${direction}deg)`,
        }}
      />
      {/* <button
        onClick={runScript}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded shadow"
      >
        Run Script
      </button> */}
    </div>
  );
};

export default Sprite;
