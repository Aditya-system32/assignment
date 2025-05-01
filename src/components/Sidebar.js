import React from "react";
import Icon from "./Icon";
import Block from "./Block"

export default function Sidebar({script}) {
  return (
    <div className="w-60 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      <div className="font-bold"> {"Events"} </div>
      <div className="flex flex-row flex-wrap bg-yellow-500 text-white px-2 py-1 my-2 text-sm cursor-pointer">
        {"When "}
        <Icon name="flag" size={15} className="text-green-600 mx-2" />
        {"clicked"}
      </div>
      <div className="flex flex-row flex-wrap bg-yellow-500 text-white px-2 py-1 my-2 text-sm cursor-pointer">
        {"When this sprite clicked"}
      </div>
      <div className="font-bold"> {"Motion"} </div>
      <Block type="move" initialValue={10} icon="🏃" />
      <Block type="turn-left" initialValue={15} icon="⬅" />
      <Block type="turn-right" initialValue={15} icon="➡" />
      <Block type="goto" initialValue={{ x: 100, y: 100 }} icon="📍" />
      <Block type="repeat" initialValue={5} icon="🔁" subBlocks={[]}/>
      <div className="font-bold"> {"Looks"} </div>
      <Block type="say" initialValue="Hello" duration={2} icon="🗣" />
      <Block type="think" initialValue="Hmm..." duration={3} icon="🤔" />
    </div>
  );
}
