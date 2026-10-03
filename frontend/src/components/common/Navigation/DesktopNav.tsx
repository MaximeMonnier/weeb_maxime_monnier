import { NavLink as RRNavLink } from "react-router-dom";
import { cx } from "../../../lib/cx";
import type { NavItem } from "../../../types/navigation";

type DesktopNavProps = {
  navItems: NavItem[];
};

export default function DesktopNav({ navItems }: DesktopNavProps) {
  return (
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <RRNavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cx("nav-link", isActive && "active")}
        >
          {item.label}
        </RRNavLink>
      ))}
    </div>
  );
}
