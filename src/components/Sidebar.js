import React from "react";
import Icon from "./Icon";
import Block from "./Block";

export default function Sidebar({ script }) {
  return (
    <div className="w-60 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      <div className="font-bold"> {"Motion"} </div>
      <Block type="move" initialValue={10} icon="🏃" />
      <Block type="turn-left" initialValue={15} icon="⬅" />
      <Block type="turn-right" initialValue={15} icon="➡" />
      <Block type="goto" initialValue={{ x: 100, y: 100 }} icon="📍" />
      <Block type="repeat" initialValue={5} icon="🔁" subBlocks={[]} />
      <div className="font-bold"> {"Looks"} </div>
      <Block type="say" initialValue="Hello" duration={2} icon="🗣" />
      <Block type="think" initialValue="Hmm..." duration={3} icon="🤔" />
    </div>
  );
}
