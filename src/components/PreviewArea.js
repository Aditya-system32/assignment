import React from "react";
import CatSprite from "./CatSprite";
import { useState } from "react";
import Sprite from "./Sprite";

export default function PreviewArea({script}) {
  const [run, setRun] = useState(false);

  const handleStart = () => {
    setRun(false); // reset in case it's already true
    setTimeout(() => setRun(true), 50);// short delay to retrigger effect
  };
  return (
    <div className="flex-none h-full w-full bg-gray-500 overflow-y-auto p-2">
      <div className="w-full h-1/2 bg-gray-300 rounded-lg">
        <div className="h-full">
          <CatSprite script={script} run={run} />
          
        </div>
        
      </div>
      <div className="w-full h-1/2 bg-gray-300 rounded-lg mt-3 flex justify-between gap-3 ">
        {/* Left Panel - Sprite Area */}
        <div className="flex-1 bg-gray-100 rounded-lg">
          <div className="gap-5 bg-green-500 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <p>Sprite</p>
              <input
                className="rounded-full px-2 py-1 w-19"
                placeholder="name"
              />
              <p>x-axis</p>
              <input className="w-10 rounded-full outline-none text-center" />
              <p>y-axis</p>
              <input  className="w-10 rounded-full outline-none text-center"/>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <p>Show</p>
              <button>On</button>
              <button>Off</button>
              <p>Size</p>
              <input className="w-10 rounded-full outline-none text-center" />
              <p>Direction</p>
              <input className="w-10 rounded-full outline-none text-center" />
            </div>
          </div>
          <div>
          <button className="w-5"><CatSprite /></button>
          </div>
        </div>

        {/* Right Panel - Stage Area */}
        <div className="w-16 bg-white rounded-lg p-2 shadow">
          <p className="text-center">Stage</p>
          <button onClick={handleStart}>start</button>
        </div>
      </div>
    </div>
  );
}
