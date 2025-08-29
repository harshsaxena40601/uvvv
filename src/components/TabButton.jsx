import React from "react";
const TabButton = React.memo(({label, active, onClick}) => (
  <button onClick={onClick} className={`px-3 py-2 rounded-xl text-sm font-semibold border ${active? 'bg-orange-500 text-white border-orange-400' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>{label}</button>
));
export default TabButton;
