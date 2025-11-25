import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Menu = ({ items = [], children }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white border-none">
        {items.map((item, index) => {
          return Object.keys(item).length > 0 ? (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className="flex items-center gap-2 p-3 transition-all hover-gray cursor-pointer"
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ) : null;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Menu;
