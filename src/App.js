import React from "react";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import Sprite from "./components/Sprite";

export default function App() {
  const [sprites, setSprites] = useState([
    {
      id: 1,
      name: "Cat",
      size: 100,
      position: { x: 0, y: 0 },
      direction: 0,
      script: [],
      message: "",
      run: false,
      thinking: false,
      executionToken:0
    },
  ]);

  const [selectedSpriteId, setSelectedSpriteId] = useState(null);

  const handleScriptUpdate = (newScript, spriteId) => {
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === spriteId ? { ...sprite, script: newScript } : sprite
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-blue-100 pt-6 font-sans">
        <div className="h-screen overflow-hidden flex flex-row  ">
          <div className="flex-1 h-screen overflow-hidden flex flex-row bg-white border-t border-r border-gray-200 rounded-tr-xl mr-2">
            <Sidebar />{" "}
            <MidArea
              sprites={sprites}
              selectedSpriteId={selectedSpriteId}
              onScriptUpdate={handleScriptUpdate}
            />
          </div>
          <div className="w-1/3 h-screen overflow-hidden flex flex-row bg-white border-t border-l border-gray-200 rounded-tl-xl ml-2">
            <PreviewArea
              sprites={sprites}
              setSprites={setSprites}
              selectedSpriteId={selectedSpriteId}
              setSelectedSpriteId={setSelectedSpriteId}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
